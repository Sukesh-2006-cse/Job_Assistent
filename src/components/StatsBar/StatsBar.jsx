import React from 'react';
import styles from './StatsBar.module.css';

const StatsBar = ({ stats }) => {
    if (!stats) return null;

    const { totalJobs, totalApplied, totalInterview, totalOffer, followUpsDue } = stats;

    return (
        <div className={styles.statsContainer}>
            <div className={`${styles.statBox} ${styles.total}`}>
                <span className={styles.statNumber}>{totalJobs}</span>
                <span className={styles.statLabel}>Total</span>
            </div>
            <div className={`${styles.statBox} ${styles.applied}`}>
                <span className={styles.statNumber}>{totalApplied}</span>
                <span className={styles.statLabel}>Applied</span>
            </div>
            <div className={`${styles.statBox} ${styles.interview}`}>
                <span className={styles.statNumber}>{totalInterview}</span>
                <span className={styles.statLabel}>Interviews</span>
            </div>
            <div className={`${styles.statBox} ${styles.offer}`}>
                <span className={styles.statNumber}>{totalOffer}</span>
                <span className={styles.statLabel}>Offers</span>
            </div>
            <div className={`${styles.statBox} ${styles.urgent}`}>
                <span className={styles.statNumber}>
                    {followUpsDue}
                </span>
                <span className={styles.statLabel}>Follow-ups Due</span>
            </div>
        </div>
    );
};

export default StatsBar;
