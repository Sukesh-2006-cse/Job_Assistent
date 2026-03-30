const BaseAgent = require('./baseAgent');
const { groq } = require('@ai-sdk/groq');
const { generateText } = require('ai');
const { GROQ_MODEL } = require('./agentConfig');

class CoverLetterAgent extends BaseAgent {
    constructor() {
        super('cover-letter-expert');
    }

    async run({ userId, job, profile }) {
        if (!job || !profile) return { error: 'Missing job or profile context' };

        console.log(`[CoverLetterAgent] Generating for user ${userId}`);

        if (!process.env.GROQ_API_KEY) {
            return { error: 'Please configure GROQ_API_KEY in the server .env file.' };
        }

        try {
            const prompt = this.constructPrompt(job, profile);

            const { text } = await generateText({
                model: groq(GROQ_MODEL),
                prompt: prompt,
            });

            return {
                content: text,
                format: 'Professional',
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('[CoverLetterAgent] Generation error:', error);
            return { error: 'AI generation failed: ' + error.message };
        }
    }

    constructPrompt(job, profile) {
        const skills = profile.experience?.skills?.join(', ') || 'General Engineering Skills';
        const degree = `${profile.academic?.degree} in ${profile.academic?.branch}` || 'Engineering';

        return `
            You are an expert career consultant. Generate a professional cover letter for the following job application.
            
            USER PROFILE:
            - Name: ${profile.userId?.name || 'Your Name'}
            - Degree: ${degree}
            - Skills: ${skills}
            - Experience: ${profile.experience?.experienceLevel || 'Fresher'}
            
            JOB DETAILS:
            - Title: ${job.title}
            - Company: ${job.company}
            - Location: ${job.location}
            
            STRICT FORMATTING RULES:
            1. Use a professional tone.
            2. The output should ONLY be the text content of the cover letter.
            3. Include placeholders like [Date], [Hiring Manager Name], [Company Address] etc. where appropriate.
            4. Follow this structure:
               - Header (Applicant's name and contact)
               - Date
               - Employer's contact
               - Salutation
               - Opening: Why you're writing.
               - Body: Skills, experience, and value-add.
               - Closing: Thank you and call to action.
               - Sign-off.
            5. Ensure the content is concise (max 1 page).
            
            COVER LETTER CONTENT:
        `;
    }
}

module.exports = new CoverLetterAgent();
