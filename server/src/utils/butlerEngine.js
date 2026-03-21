function getButlerActions(jobs) {
    const actions = [];
    const now = Date.now();

    jobs.forEach(job => {
        // Skip Rejected jobs
        if (job.status === 'Rejected') return;

        const daysSince = Math.floor((now - new Date(job.appliedDate)) / 86400000);
        let action = '';
        let priority = 'Low';
        let urgencyScore = 0;

        if (job.status === 'Offer') {
            priority = 'High';
            urgencyScore = 100;
            action = "Respond to this offer today";
        } else if (job.status === 'Interview') {
            priority = 'High';
            urgencyScore = 90;
            action = "Prepare for your interview";
        } else if (job.status === 'Applied' && daysSince >= 30) {
            priority = 'Low';
            urgencyScore = 20;
            action = "No response in 30+ days — consider marking as ghosted";
        } else if (job.status === 'Applied' && daysSince >= 14) {
            priority = 'High';
            urgencyScore = 80;
            action = `Follow up now — Day ${daysSince}`;
        } else if (job.status === 'Applied' && daysSince >= 7) {
            priority = 'Medium';
            urgencyScore = 50;
            action = `Follow up in ${14 - daysSince} more days`;
        } else if (job.status === 'Applied' && daysSince < 7) {
            priority = 'Low';
            urgencyScore = 10;
            action = "Application sent — waiting for response";
        }

        if (action) {
            actions.push({
                ...job.toObject ? job.toObject() : job,
                action,
                priority,
                urgencyScore,
                daysSince
            });
        }
    });

    // Sort by urgencyScore descending
    return actions.sort((a, b) => b.urgencyScore - a.urgencyScore);
}

module.exports = { getButlerActions };
