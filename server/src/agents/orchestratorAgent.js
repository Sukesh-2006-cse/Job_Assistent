const BaseAgent = require('./baseAgent');
const { TRIGGERS, MEMORY_TTL } = require('./agentConfig');

// Import specialized agents
const followUpAgent = require('./followUpAgent');
const jobMatchAgent = require('./jobMatchAgent');
const interviewPrepAgent = require('./interviewPrepAgent');
const resumeAgent = require('./resumeAgent');
const careerAgent = require('./careerAgent');
const dailyBriefingAgent = require('./dailyBriefingAgent');
const memoryStore = require('../memory/memoryStore');

class OrchestratorAgent extends BaseAgent {
    constructor() {
        super('orchestrator');
    }

    async run({ trigger, userId, context = {} }) {
        console.log(`[Orchestrator] Triggered by: ${trigger} for User: ${userId}`);

        try {
            switch (trigger) {
                case TRIGGERS.DASHBOARD_OPEN:
                    return await this.handleDashboardOpen(userId, context);

                case TRIGGERS.JOB_VIEWED:
                    return await this.handleJobViewed(userId, context);

                case TRIGGERS.STATUS_CHANGED_INTERVIEW:
                    return await this.handleStatusChangedInterview(userId, context);

                case TRIGGERS.RESUME_UPLOADED:
                    return await this.handleResumeUploaded(userId, context);

                case TRIGGERS.THREE_REJECTIONS:
                    return await this.handleThreeRejections(userId, context);

                case TRIGGERS.ASK_BUTLER:
                    return await this.handleAskButler(userId, context);

                case TRIGGERS.DAILY_CRON:
                    return await this.handleDailyCron(userId, context);

                default:
                    return { error: `Unknown trigger type: ${trigger}` };
            }
        } catch (error) {
            console.error(`[Orchestrator] Critical Error handling trigger ${trigger}:`, error);
            return { error: 'Internal coordination error', details: error.message };
        }
    }

    // --- Trigger Handlers ---

    async handleDashboardOpen(userId, context) {
        const { jobs = [], profile = null } = context;

        const [followUpRes, jobMatchRes, careerInsight] = await Promise.allSettled([
            this.safeRun(followUpAgent, { userId, jobs }),
            this.safeRun(jobMatchAgent, { userId, profile }),
            this.readMemory(userId, 'careerInsight')
        ]);

        const stats = this.calculateStats(jobs, followUpRes.status === 'fulfilled' ? followUpRes.value : []);

        // 1. Fix memory key and agent scope
        let briefing = await memoryStore.readMemory(userId, 'dailyBriefingAgent', 'daily_briefing');

        // 2. Live Sync: Update snapshot counts with current reality
        if (briefing) {
            briefing = {
                ...briefing,
                followUpCount: stats.followUpsDue,
                interviewCount: stats.totalInterview,
                // We keep the message from the morning but keep the pills live
            };
        }

        return {
            actions: followUpRes.status === 'fulfilled' && Array.isArray(followUpRes.value) ? followUpRes.value : [],
            jobMatches: jobMatchRes.status === 'fulfilled' && Array.isArray(jobMatchRes.value) ? jobMatchRes.value.slice(0, 3) : [],
            careerInsight: careerInsight.status === 'fulfilled' ? careerInsight.value : null,
            stats,
            briefing: briefing || null
        };
    }

    async handleJobViewed(userId, context) {
        const { job, profile } = context;
        if (!job) return null;

        const jobId = job._id || job.id;
        const cacheKey = `match_${jobId}`;

        // Check cache
        const cached = await this.readMemory(userId, cacheKey);
        if (cached) return cached;

        // Run Match Agent
        const result = await this.safeRun(jobMatchAgent, { userId, job, profile });
        if (result) {
            await this.writeMemory(userId, cacheKey, result, MEMORY_TTL.jobMatch);
        }
        return result;
    }

    async handleStatusChangedInterview(userId, context) {
        const { job } = context;
        if (!job) return { error: 'No job context provided' };

        const jobId = job._id || job.id;
        if (!jobId) return { error: 'Job ID missing in context' };

        const prepKit = await this.safeRun(interviewPrepAgent, { userId, job });

        if (prepKit) {
            await this.writeMemory(userId, `prep_${jobId}`, prepKit, MEMORY_TTL.interviewPrep);
        }

        return { prepKit, ready: !!prepKit, message: prepKit ? 'Interview prep is ready' : 'Generation failed' };
    }

    async handleResumeUploaded(userId, context) {
        const { resumeText } = context;
        if (!resumeText) return { error: 'No resume text provided' };

        return await this.safeRun(resumeAgent, { userId, resumeText });
    }

    async handleThreeRejections(userId, context) {
        const { rejectedJobs = [], profile } = context;
        if (rejectedJobs.length < 3) return { error: 'Insufficient rejections' };

        return await this.safeRun(careerAgent, { userId, rejectedJobs, profile });
    }

    async handleAskButler(userId, context) {
        const { job } = context;
        if (!job) return { error: 'No job context provided' };

        const suggestion = await this.safeRun(followUpAgent, { userId, job, mode: 'email' });
        return { suggestion };
    }

    async handleDailyCron(userId, context) {
        const { jobs = [], profile = null } = context;

        const results = await Promise.allSettled([
            this.safeRun(followUpAgent, { userId, jobs }),
            this.safeRun(jobMatchAgent, { userId, profile }),
            this.readMemory(userId, 'careerInsight'),
            this.safeRun(resumeAgent, { userId }) // Usually won't do much without text, but for completeness
        ]);

        const agentResults = {
            actions: results[0].status === 'fulfilled' ? results[0].value : [],
            jobMatches: results[1].status === 'fulfilled' ? results[1].value : [],
            careerInsight: results[2].status === 'fulfilled' ? results[2].value : null,
            stats: this.calculateStats(jobs, results[0].status === 'fulfilled' ? results[0].value : [])
        };

        const briefing = await this.safeRun(dailyBriefingAgent, { userId, agentResults });

        if (briefing) {
            // Fix memory key to match what we read in handleDashboardOpen
            await memoryStore.writeMemory(userId, 'dailyBriefingAgent', 'daily_briefing', briefing, MEMORY_TTL.dailyBriefing);
        }
        return briefing;
    }

    // --- Utilities ---

    async safeRun(agent, context) {
        try {
            if (!agent || typeof agent.run !== 'function') {
                console.warn(`[Orchestrator] Agent has no run() method.`);
                return { error: 'Agent configuration error' };
            }
            return await agent.run(context);
        } catch (error) {
            console.error(`[Orchestrator] Error running agent:`, error);
            return { error: error.message || 'Unknown agent error' };
        }
    }

    calculateStats(jobs = [], actions = []) {
        return {
            totalJobs: jobs.length,
            totalApplied: jobs.filter(j => j.status === 'Applied').length,
            totalInterview: jobs.filter(j => j.status === 'Interview').length,
            totalOffer: jobs.filter(j => j.status === 'Offer').length,
            followUpsDue: (actions || []).filter(a => a.priority === 'High').length
        };
    }
}

module.exports = new OrchestratorAgent();
