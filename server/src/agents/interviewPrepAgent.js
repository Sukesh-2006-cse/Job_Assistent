const BaseAgent = require('./baseAgent');
const { groq } = require('@ai-sdk/groq');
const { generateText } = require('ai');
const { GROQ_MODEL } = require('./agentConfig');

class InterviewPrepAgent extends BaseAgent {
    constructor() {
        super('interviewPrepAgent');
    }

    async run({ userId, job }) {
        if (!job) return null;

        const jobId = job._id || job.id;
        if (!jobId) return null;

        const cacheKey = `prep_${jobId}`;

        // Check cache first
        const cachedPrep = await this.readMemory(userId, cacheKey);
        if (cachedPrep) return cachedPrep;

        if (!process.env.GROQ_API_KEY) {
            console.error('[InterviewPrepAgent] GROQ_API_KEY missing');
            return null;
        }

        try {
            const contextText = job.description || job.notes || "No additional context provided.";

            const prompt = `You are an expert interview coach.
            The candidate has an interview for "${job.role}" at "${job.company}".
            Job description / context: ${contextText}

            Generate a comprehensive interview preparation kit.
            Respond ONLY as valid JSON in this exact format:
            {
              "technicalQuestions": ["question 1", "question 2", ... 8 total],
              "behavioural": ["question 1", "question 2", ... 5 total],
              "starTemplates": [
                { "situation": "string", "task": "string", "action": "string", "result": "string" },
                ... 3 total
              ],
              "questionsToAsk": ["question 1", "question 2", "question 3"],
              "keyTips": ["tip 1", "tip 2", "tip 3"]
            }`;

            const { text } = await generateText({
                model: groq(GROQ_MODEL),
                prompt: prompt,
            });

            // Clean markdown if Groq returns it
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const prepKit = JSON.parse(jsonStr);

            // Write to memory (72hr TTL)
            await this.writeMemory(userId, cacheKey, prepKit, 72);

            return prepKit;
        } catch (error) {
            console.error('[InterviewPrepAgent] Generation Error:', error);
            // Don't throw, just return null so orchestrator can handle it
            return null;
        }
    }
}

module.exports = new InterviewPrepAgent();
