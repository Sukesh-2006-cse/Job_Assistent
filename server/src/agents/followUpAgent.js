const BaseAgent = require('./baseAgent');
const { groq } = require('@ai-sdk/groq');
const { generateText } = require('ai');
const { GROQ_MODEL } = require('./agentConfig');

class FollowUpAgent extends BaseAgent {
    constructor() {
        super('followUpAgent');
    }

    async run({ userId, jobs = [], job = null, mode = 'actions' }) {
        // Mode 1: Enrich dashboard actions
        if (mode === 'actions') {
            const yesterday = new Date(Date.now() - 86400000);
            const actions = jobs
                .filter(j => j.status === 'Applied' && new Date(j.appliedDate) < yesterday)
                .map(j => ({
                    jobId: j._id || j.id,
                    company: j.company,
                    role: j.role,
                    priority: 'High',
                    type: 'Follow-up'
                }));

            return actions;
        }

        // Mode 2: Generate individualized email
        if (mode === 'email' && job) {
            const jobId = job._id || job.id;
            if (!jobId) return { error: 'Job ID missing' };

            const cacheKey = `email_${jobId}`;
            const cached = await this.readMemory(userId, cacheKey);
            if (cached) return { suggestion: cached };

            if (!process.env.GROQ_API_KEY) {
                return { suggestion: "Please configure GROQ_API_KEY to generate emails." };
            }

            try {
                const daysSince = Math.floor((Date.now() - new Date(job.appliedDate)) / 86400000);

                const prompt = `You are a professional career assistant.
                The user applied for ${job.role} at ${job.company} ${daysSince} days ago.
                Current application status: ${job.status}.
                User notes about this application: ${job.notes || 'none'}.
                Write a short professional follow-up email under 80 words.
                Make it warm and direct.
                Do not use placeholder names like [Your Name].
                Write it ready to copy and send immediately.`;

                const { text } = await generateText({
                    model: groq(GROQ_MODEL),
                    prompt: prompt,
                });

                await this.writeMemory(userId, cacheKey, text, 48);
                return { suggestion: text };
            } catch (error) {
                console.error('[FollowUpAgent] Email generation error:', error);
                return { error: 'Failed to generate email' };
            }
        }

        return null;
    }
}

module.exports = new FollowUpAgent();
