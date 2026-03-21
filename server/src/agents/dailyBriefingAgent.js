const BaseAgent = require('./baseAgent');
const { groq } = require('@ai-sdk/groq');
const { generateText } = require('ai');
const { GROQ_MODEL } = require('./agentConfig');

class DailyBriefingAgent extends BaseAgent {
    constructor() {
        super('dailyBriefingAgent');
    }

    async run({ userId, agentResults }) {
        const { actions = [], jobMatches = [], careerInsight = null, stats = {} } = agentResults;

        const highPriorityCount = actions.filter(a => a.priority === 'High').length;

        const prompt = `You are a friendly career assistant writing a morning briefing for a job seeker.
        Data:
          Follow-ups due today: ${highPriorityCount}
          Total active applications: ${stats.totalJobs || 0}
          Active interviews: ${stats.totalInterview || 0}
          New matching jobs found: ${jobMatches?.length || 0}
          Career insight available: ${careerInsight ? 'yes' : 'no'}
        
        Write a short upbeat morning message under 30 words.
        Be encouraging. Mention the most important action first.`;

        try {
            const { text } = await generateText({
                model: groq(GROQ_MODEL),
                prompt: prompt,
            });

            const briefing = {
                message: text.trim(),
                followUpCount: highPriorityCount,
                newJobsCount: jobMatches?.length || 0,
                interviewCount: stats.totalInterview || 0,
                generatedAt: new Date().toISOString()
            };

            // Write to memory with 20hr TTL (valid until next morning)
            await this.writeMemory(userId, 'daily_briefing', briefing, 20);

            return briefing;
        } catch (error) {
            console.error('[DailyBriefingAgent] Error:', error);
            return null;
        }
    }
}

module.exports = new DailyBriefingAgent();
