const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Job = require('../../models/Job');
const Profile = require('../../models/Profile');
const orchestratorAgent = require('../agents/orchestratorAgent');
const { TRIGGERS } = require('../agents/agentConfig');
const { readMemory } = require('../memory/memoryStore');
const { groq } = require('@ai-sdk/groq');
const { generateText } = require('ai');

// Model Configuration
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Helper for AI generation
async function generateEmail(prompt) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("AI service configuration missing (GROQ_API_KEY).");
    }

    try {
        const { text } = await generateText({
            model: groq(GROQ_MODEL),
            prompt: prompt,
        });
        return text;
    } catch (err) {
        console.error("[Butler] Groq API Call Failed:", err);
        throw new Error(`Groq API Error: ${err.message}`);
    }
}

// POST /api/butler/orchestrate - General coordination endpoint
router.post('/orchestrate', authMiddleware, async (req, res) => {
    try {
        const { trigger, context = {} } = req.body;
        const userId = req.user.id;

        const [jobs, profile] = await Promise.all([
            Job.find({ userId }),
            Profile.findOne({ userId })
        ]);

        const result = await orchestratorAgent.run({
            trigger,
            userId,
            context: { ...context, jobs, profile }
        });

        res.json(result);
    } catch (error) {
        console.error('Orchestration Error:', error);
        res.status(500).json({
            error: 'Orchestration failed',
            details: error.message
        });
    }
});

// GET /api/butler/today - Get dashboard data
router.get('/today', authMiddleware, async (req, res) => {
    // Prevent browser caching to ensure sync with Applications page
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    try {
        const userId = req.user.id;
        const [jobs, profile] = await Promise.all([
            Job.find({ userId }),
            Profile.findOne({ userId })
        ]);

        const result = await orchestratorAgent.run({
            trigger: TRIGGERS.DASHBOARD_OPEN,
            userId,
            context: { jobs, profile }
        });

        res.json(result);
    } catch (error) {
        console.error('Butler Dashboard Error Details:', {
            message: error.message,
            stack: error.stack,
            userId: req.user.id
        });
        res.status(500).json({ error: 'Failed to fetch butler dashboard data', details: error.message });
    }
});

// GET /api/butler/job/:id - Fetch single job
router.get('/job/:id', authMiddleware, async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, userId: req.user.id });
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch job' });
    }
});

// GET /api/butler/prep/:jobId - Fetch cached prep kit
router.get('/prep/:jobId', authMiddleware, async (req, res) => {
    try {
        const { jobId } = req.params;
        const prepKit = await readMemory(req.user.id, 'interviewPrepAgent', `prep_${jobId}`);

        if (prepKit) {
            res.json({ prepKit, ready: true });
        } else {
            res.json({ prepKit: null, ready: false, message: 'Prep kit is being generated...' });
        }
    } catch (error) {
        console.error('[Butler Prep] Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch interview prep kit' });
    }
});

// POST /api/butler/suggest - Generate AI follow-up email
router.post('/suggest', authMiddleware, async (req, res) => {
    try {
        const { company, role, daysSince, status, notes } = req.body;
        const prompt = `You are a professional career assistant.
       The user applied for ${role} at ${company} ${daysSince} days ago.
       Current application status: ${status}.
       User notes about this application: ${notes || 'none'}.
       Write a short professional follow-up email under 80 words.
       Make it warm and direct.
       Do not use placeholder names like [Your Name].
       Write it ready to copy and send immediately.`;

        const suggestion = await generateEmail(prompt);
        res.json({ suggestion });
    } catch (error) {
        console.error('AI Suggestion Error:', error.message);
        res.status(500).json({ suggestion: null, error: error.message });
    }
});

// POST /api/butler/suggest/regenerate - Regenerate AI follow-up email
router.post('/suggest/regenerate', authMiddleware, async (req, res) => {
    try {
        const { company, role, daysSince, status, notes } = req.body;
        const prompt = `You are a professional career assistant.
       The user applied for ${role} at ${company} ${daysSince} days ago.
       Current application status: ${status}.
       User notes about this application: ${notes || 'none'}.
       Write a short professional follow-up email under 80 words.
       This is a second attempt. Make it slightly different in tone — more confident and concise.
       Do not use placeholder names like [Your Name].
       Write it ready to copy and send immediately.`;

        const suggestion = await generateEmail(prompt);
        res.json({ suggestion });
    } catch (error) {
        console.error('AI Regeneration Error:', error.message);
        res.status(500).json({ suggestion: null, error: error.message });
    }
});

// GET /api/butler/career - Get career insights (roadmap)
router.get('/career', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [rejectedJobs, profile] = await Promise.all([
            Job.find({ userId, status: 'Rejected' }),
            Profile.findOne({ userId })
        ]);

        if (rejectedJobs.length < 3) {
            return res.json({
                roadmap: null,
                message: 'Apply to more jobs to unlock career insights. You need at least 3 rejections for pattern analysis.'
            });
        }

        const result = await orchestratorAgent.run({
            trigger: TRIGGERS.THREE_REJECTIONS,
            userId,
            context: { rejectedJobs, profile }
        });

        res.json(result);
    } catch (error) {
        console.error('Career Route Error:', error);
        res.status(500).json({ error: 'Failed to fetch career roadmap' });
    }
});

// GET /api/butler/briefing - Get cached AI briefing
router.get('/briefing', authMiddleware, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    try {
        const briefing = await readMemory(req.user.id, 'dailyBriefingAgent', 'daily_briefing');
        res.json({ briefing: briefing || null });
    } catch (error) {
        console.error('[Butler Briefing] Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch daily briefing' });
    }
});

// POST /api/butler/briefing/generate - Manually trigger briefing generation
router.post('/briefing/generate', authMiddleware, async (req, res) => {
    try {
        const { runNow } = require('../jobs/scheduler');
        await runNow(req.user.id);
        res.json({ success: true, message: 'Briefing generated manually' });
    } catch (error) {
        console.error('[Butler Briefing] Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate briefing manually' });
    }
});

module.exports = router;
