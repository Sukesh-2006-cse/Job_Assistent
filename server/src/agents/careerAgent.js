const BaseAgent = require('./baseAgent');
const { groq } = require('@ai-sdk/groq');
const { generateText } = require('ai');
const { GROQ_MODEL, MEMORY_TTL } = require('./agentConfig');

class CareerAgent extends BaseAgent {
    constructor() {
        super('careerAgent');
    }

    async run({ userId, rejectedJobs = [], profile = null }) {
        if (!userId) return null;

        // Check cache first (168hr = 1 week)
        const cachedRoadmap = await this.readMemory(userId, 'careerRoadmap');
        if (cachedRoadmap) return cachedRoadmap;

        if (!profile || rejectedJobs.length === 0) {
            return { error: 'Incomplete data for analysis' };
        }

        try {
            // Extract potential skill gaps from rejected job descriptions
            const combinedDescriptions = rejectedJobs.map(j => j.description || '').join(' ').toLowerCase();
            const userSkills = (profile.experience?.skills || []).map(s => s.toLowerCase());

            // Very basic extraction of technical terms (ideally would use AI but we can ask AI to do the gap analysis directly)
            const prompt = `You are a career development coach.
            A job seeker has been rejected from these roles:
            ${rejectedJobs.map(j => `- ${j.role} at ${j.company}`).join('\n')}

            Their current skills: ${userSkills.join(', ')}
            
            Job descriptions analysis context (Keywords/Descriptions of rejected roles):
            ${combinedDescriptions.substring(0, 2000)}

            1. Identify skill gaps (technical skills frequently requested but missing from their profile).
            2. Create a weekly career improvement roadmap.
            
            Respond ONLY as valid JSON in this exact format:
            {
              "skillGaps": ["skill 1", "skill 2", ...],
              "roadmap": [
                { 
                  "skill": "string", 
                  "priority": "High" | "Medium" | "Low",
                  "estimatedWeeks": number,
                  "resources": ["resource link/name 1", "resource 2"] 
                },
                ...
              ],
              "insight": "one sentence career insight under 25 words",
              "nextBestJob": "specific job role/suggestion for their current state"
            }`;

            const { text } = await generateText({
                model: groq(GROQ_MODEL),
                prompt: prompt,
            });

            // Clean markdown if Groq returns it
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const roadmapResult = JSON.parse(jsonStr);

            // Write to memory (1 week TTL)
            await this.writeMemory(userId, 'careerRoadmap', roadmapResult, 168);

            return roadmapResult;
        } catch (error) {
            console.error('[CareerAgent] Error:', error);
            return null;
        }
    }
}

module.exports = new CareerAgent();
