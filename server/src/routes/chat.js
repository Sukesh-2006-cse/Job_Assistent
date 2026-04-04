const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Job = require('../../models/Job');
const Profile = require('../../models/Profile');
const { getButlerActions } = require('../utils/butlerEngine');

// Use same AI SDK pattern as the rest of the project
const { groq } = require('@ai-sdk/groq');
const { streamText } = require('ai');

const GROQ_MODEL = 'llama-3.3-70b-versatile';

// POST /api/chat/message — streaming chat endpoint
router.post('/message', authMiddleware, async (req, res) => {
    const { message, history = [] } = req.body;

    // Step 1 — Validate input
    if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
    }

    // Set streaming headers BEFORE writing anything
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
        // Step 2 — Fetch user context from MongoDB in parallel
        const userId = req.user._id || req.user.id;
        let jobs = [];
        let profile = null;

        try {
            [jobs, profile] = await Promise.all([
                Job.find({ userId }),
                Profile.findOne({ userId })
            ]);
        } catch (dbErr) {
            console.error('[Chat] DB fetch error (continuing):', dbErr.message);
        }

        // Step 3 — Build context-aware system prompt
        const now = Date.now();
        const butlerActions = getButlerActions(jobs || []);
        const highPriorityActions = butlerActions.filter(a => a.priority === 'High');
        const interviews = (jobs || []).filter(j => j.status === 'Interview');
        const offers = (jobs || []).filter(j => j.status === 'Offer');

        const jobListContext = (jobs || []).map(job => {
            const daysSince = Math.floor((now - new Date(job.appliedDate)) / 86400000);
            return `  - ${job.company} (${job.role}) — Status: ${job.status}, Applied ${daysSince} days ago`;
        }).join('\n');

        const skills = profile?.skills?.join(', ') || 'not specified';
        const preferredRoles = profile?.preferredRoles?.join(', ') || 'not specified';
        const experienceLevel = profile?.experienceLevel || 'not specified';

        const systemPrompt = `You are Butler, a personal AI career assistant inside Apply-Flow, a job application tracking app. You have full context about the user's job search and help them stay on top of applications, prepare for interviews, write follow-up emails, and get career advice.

Be helpful, concise, and encouraging. Use job-search metaphors occasionally. Keep responses under 150 words unless the user asks for something long like a complete email draft.

USER'S JOB SEARCH CONTEXT:
- Total jobs tracked: ${jobs ? jobs.length : 0}
- High priority follow-ups due today: ${highPriorityActions.length}
- Active interviews: ${interviews.length}
- Offers awaiting response: ${offers.length}

JOB APPLICATIONS:
${jobListContext || '  (No applications tracked yet — encourage the user to add their applications)'}

USER PROFILE:
- Skills: ${skills}
- Preferred roles: ${preferredRoles}
- Experience level: ${experienceLevel}

INSTRUCTIONS:
- Always refer to companies and roles by their actual name from the context.
- Never fabricate job listings not in the context.
- If asked to write a follow-up email, write a complete ready-to-send email using the real company and role from context.
- If context shows overdue follow-ups, proactively mention them.
- If the user has no jobs, encourage them to add applications to Apply-Flow.
- Be practical and action-oriented.`;

        // Step 4 — Build messages array
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: message.trim() }
        ];

        // Step 5 — Stream with Vercel AI SDK (same pattern as butler.js)
        const result = await streamText({
            model: groq(GROQ_MODEL),
            messages,
            maxTokens: 500,
        });

        // Step 6 — Pipe text stream to HTTP response
        for await (const textPart of result.textStream) {
            res.write(textPart);
        }

        res.end();

    } catch (err) {
        console.error('[Chat] Stream error:', err.message, err.stack);
        try {
            res.write(`I encountered an error: ${err.message}. Please try again.`);
            res.end();
        } catch {
            // Response may already be closed
        }
    }
});

module.exports = router;
