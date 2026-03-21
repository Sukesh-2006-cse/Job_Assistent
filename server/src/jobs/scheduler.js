const cron = require('node-cron');
const orchestratorAgent = require('../agents/orchestratorAgent');
const User = require('../../models/User');
const Job = require('../../models/Job');
const Profile = require('../../models/Profile');
const { TRIGGERS } = require('../agents/agentConfig');

// Schedule: runs at 9:00 AM every day
cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] Daily briefing cron running...');
    try {
        const users = await User.find({});
        console.log(`[Scheduler] Processing ${users.length} users`);

        for (const user of users) {
            try {
                // Fetch user's jobs and profile for context
                const jobs = await Job.find({ userId: user._id });
                const profile = await Profile.findOne({ userId: user._id });

                if (jobs.length === 0) {
                    console.log(`[Scheduler] Skipping user ${user._id} (no jobs)`);
                    continue;
                }

                await orchestratorAgent.run({
                    trigger: TRIGGERS.DAILY_CRON,
                    userId: user._id,
                    context: { jobs, profile }
                });
                console.log(`[Scheduler] Briefing generated for user ${user._id}`);
            } catch (userError) {
                console.error(`[Scheduler] Error processing user ${user._id}:`, userError);
                // Continue to next user
            }
        }
        console.log('[Scheduler] Daily briefing complete for all users');
    } catch (error) {
        console.error('[Scheduler] Critical error in daily briefing cron:', error);
    }
});

/**
 * Manual trigger for a single user (for dev/demo)
 */
async function runNow(userId) {
    console.log(`[Scheduler] Manual briefcase check for user ${userId}`);
    try {
        const jobs = await Job.find({ userId });
        const profile = await Profile.findOne({ userId });

        return await orchestratorAgent.run({
            trigger: TRIGGERS.DAILY_CRON,
            userId: userId,
            context: { jobs, profile }
        });
    } catch (error) {
        console.error(`[Scheduler] Manual run error for user ${userId}:`, error);
        throw error;
    }
}

module.exports = { runNow };
