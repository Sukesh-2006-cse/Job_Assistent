const BaseAgent = require('./baseAgent');
const { groq } = require('@ai-sdk/groq');
const { generateText } = require('ai');
const { GROQ_MODEL } = require('./agentConfig');
const Profile = require('../../models/Profile');

class ResumeAgent extends BaseAgent {
    constructor() {
        super('resumeAgent');
    }

    async run({ userId, resumeText }) {
        if (!resumeText) return null;

        try {
            const prompt = `Extract structured data from this resume text.
            Respond ONLY as valid JSON in this exact format:
            {
              "skills": ["technical skill 1", "technical skill 2", ...],
              "preferredRoles": ["job title 1", "job title 2", ...],
              "experienceLevel": "Fresher" | "1-2 Years" | "3+ Years",
              "degree": "Degree name",
              "branch": "Branch of study",
              "college": "College name",
              "summary": "one sentence professional summary under 20 words"
            }
            
            Resume text:
            ${resumeText}`;

            const { text } = await generateText({
                model: groq(GROQ_MODEL),
                prompt: prompt,
            });

            console.log('[ResumeAgent] Raw LLM Response:', text);

            // Clean markdown if Groq returns it
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

            let extracted;
            try {
                // Find the first '{' and last '}' to isolate JSON if there's extra text
                const start = jsonStr.indexOf('{');
                const end = jsonStr.lastIndexOf('}');
                if (start === -1 || end === -1) {
                    throw new Error('No JSON object found in LLM response');
                }
                const cleanedJson = jsonStr.substring(start, end + 1);
                extracted = JSON.parse(cleanedJson);
            } catch (parseError) {
                console.error('[ResumeAgent] JSON Parse Error:', parseError.message);
                console.log('[ResumeAgent] Attempted to parse:', jsonStr);
                throw new Error('LLM returned invalid format for resume data');
            }

            // Write to memory
            await this.writeMemory(userId, 'resumeData', extracted);

            // Update User Profile in MongoDB
            const currentYear = new Date().getFullYear();
            const profileUpdate = {
                academic: {
                    degree: extracted.degree || 'Not specified',
                    branch: extracted.branch || 'Not specified',
                    college: extracted.college || 'Not specified',
                    gradYear: parseInt(extracted.gradYear) || currentYear
                },
                experience: {
                    skills: Array.isArray(extracted.skills) ? extracted.skills : [],
                    experienceLevel: ['Fresher', '1-2 Years', '3+ Years'].includes(extracted.experienceLevel)
                        ? extracted.experienceLevel
                        : 'Fresher'
                },
                preferences: {
                    preferredRoles: Array.isArray(extracted.preferredRoles) ? extracted.preferredRoles : []
                }
            };

            const updatedProfile = await Profile.findOneAndUpdate(
                { userId },
                { $set: profileUpdate },
                { upsert: true, new: true }
            );

            return { extracted, updatedProfile, profileUpdated: true };
        } catch (error) {
            console.error('[ResumeAgent] Error:', error);
            throw error;
        }
    }
}

module.exports = new ResumeAgent();
