const BaseAgent = require('./baseAgent');
const { groq } = require('@ai-sdk/groq');
const { generateText } = require('ai');
const { GROQ_MODEL } = require('./agentConfig');

class JobMatchAgent extends BaseAgent {
    constructor() {
        super('jobMatchAgent');
    }

    async run({ userId, job = null, jobs = [], profile }) {
        // Mode 1: Single Job Analysis (Groq Powered)
        if (job) {
            const cacheKey = `match_${job._id || job.id}`;
            const cached = await this.readMemory(userId, cacheKey);
            if (cached) return cached;

            if (!process.env.GROQ_API_KEY) {
                console.error('[JobMatchAgent] GROQ_API_KEY missing');
                return null;
            }

            try {
                const prompt = `You are a technical recruiter.
                Candidate profile:
                  Skills: ${profile?.experience?.skills?.join(', ') || 'None listed'}
                  Experience: ${profile?.experience?.experienceLevel || 'Entry level'}
                  Preferred roles: ${profile?.preferences?.preferredRoles?.join(', ') || 'Software Engineer'}
                
                Job posting:
                  Title: ${job.title}
                  Company: ${job.company}
                  Description: ${job.description || 'No description provided'}
                
                Analyse the fit. Respond ONLY as valid JSON in this exact format:
                {
                  "score": 0-100 number,
                  "verdict": "Strong Fit" | "Good Fit" | "Partial Fit" | "Low Fit",
                  "matched": ["matching skill 1", ...],
                  "missing": ["missing skill 1", ...],
                  "summary": "one sentence explanation under 20 words"
                }`;

                const { text } = await generateText({
                    model: groq(GROQ_MODEL),
                    prompt: prompt,
                });

                // Clean markdown
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const matchReport = JSON.parse(jsonStr);

                // Cache for 24 hours
                await this.writeMemory(userId, cacheKey, matchReport, 24);
                return matchReport;
            } catch (error) {
                console.error('[JobMatchAgent] Match Error:', error);
                return null;
            }
        }

        // Mode 2: Bulk Job Scoring for Dashboard (Keyword Match)
        if (jobs.length > 0) {
            const yesterday = new Date(Date.now() - 86400000);
            const userSkills = (profile?.experience?.skills || []).map(s => s.toLowerCase());
            const userRoles = (profile?.preferences?.preferredRoles || []).map(r => r.toLowerCase());

            const scoredJobs = jobs
                .filter(j => new Date(j.postedDate || Date.now()) > yesterday)
                .map(j => {
                    let score = 0;
                    const text = ((j.title || '') + ' ' + (j.description || '')).toLowerCase();

                    // Basic keyword scoring
                    userSkills.forEach(skill => { if (text.includes(skill)) score += 10; });
                    userRoles.forEach(role => { if (text.includes(role)) score += 20; });

                    return { ...j, matchScore: Math.min(score, 95) };
                })
                .sort((a, b) => b.matchScore - a.matchScore);

            return scoredJobs.slice(0, 3);
        }

        return null;
    }
}

module.exports = new JobMatchAgent();
