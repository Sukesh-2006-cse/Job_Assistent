module.exports = {
    GEMINI_MODEL: 'gemini-pro',
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    MAX_TOKENS: 1500,

    MEMORY_TTL: {
        jobMatch: 24,       // hours
        interviewPrep: 72,   // hours — prep kit valid 3 days
        followUpEmail: 48,   // hours
        careerRoadmap: 168,  // 1 week
        dailyBriefing: 12    // hours
    },

    TRIGGERS: {
        DASHBOARD_OPEN: 'DASHBOARD_OPEN',
        JOB_VIEWED: 'JOB_VIEWED',
        STATUS_CHANGED_INTERVIEW: 'STATUS_CHANGED_INTERVIEW',
        RESUME_UPLOADED: 'RESUME_UPLOADED',
        THREE_REJECTIONS: 'THREE_REJECTIONS',
        DAILY_CRON: 'DAILY_CRON',
        ASK_BUTLER: 'ASK_BUTLER',
        GENERATE_COVER_LETTER: 'GENERATE_COVER_LETTER'
    }
};
