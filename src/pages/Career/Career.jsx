import React, { useState, useEffect } from 'react';
import { getCareerRoadmap } from '../../api/butlerApi';
import styles from './Career.module.css';
import Navigation from '../../components/Navigation/Navigation';

const Career = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRoadmap();
    }, []);

    const fetchRoadmap = async () => {
        try {
            const result = await getCareerRoadmap();
            setData(result);
        } catch (err) {
            setError('Failed to load career data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className={styles.loader}>Analyzing your career path...</div>;

    if (error) return <div className={styles.errorContainer}>{error}</div>;

    if (!data || !data.roadmap) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptyIcon}>🛡️</div>
                <h1>Career Butler is locked</h1>
                <p>{data?.message || 'Apply to more jobs to unlock career insights.'}</p>
                <div className={styles.statsHint}>
                    Target: 3 Rejections for pattern analysis
                </div>
            </div>
        );
    }

    const { insight, nextBestJob, skillGaps, roadmap } = data;

    // Sort roadmap: High priority first
    const sortedRoadmap = [...roadmap].sort((a, b) => {
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return (
        <div className={styles.pageWrapper}>
            <Navigation />
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Career Roadmap</h1>
                    <p>Strategic plan based on your recent application results</p>
                </header>

                <section className={styles.insightSection}>
                    <div className={styles.insightCard}>
                        <div className={styles.insightIcon}>💡</div>
                        <div className={styles.insightText}>
                            <h3>Butler's Insight</h3>
                            <p>{insight}</p>
                        </div>
                    </div>

                    <div className={styles.suggestionBox}>
                        <label>Next Best Move</label>
                        <p>{nextBestJob}</p>
                    </div>
                </section>

                <section className={styles.gapsSection}>
                    <h2>Identified Skill Gaps</h2>
                    <p className={styles.subtext}>Skills frequently requested in your rejected roles but missing from your profile.</p>
                    <div className={styles.gapsGrid}>
                        {skillGaps.map((gap, i) => (
                            <span key={i} className={styles.gapPill}>{gap}</span>
                        ))}
                    </div>
                </section>

                <section className={styles.roadmapSection}>
                    <h2>Learning Roadmap</h2>
                    <div className={styles.roadmapGrid}>
                        {sortedRoadmap.map((item, i) => (
                            <div key={i} className={`${styles.roadmapCard} ${styles[item.priority.toLowerCase()]}`}>
                                <div className={styles.cardHeader}>
                                    <h3>{item.skill}</h3>
                                    <span className={styles.priorityLabel}>{item.priority} Priority</span>
                                </div>
                                <div className={styles.cardMeta}>
                                    <span>⏱️ ~{item.estimatedWeeks} Weeks</span>
                                </div>
                                <div className={styles.resources}>
                                    <h4>Recommended Resources:</h4>
                                    <ul>
                                        {item.resources.map((res, idx) => (
                                            <li key={idx}>
                                                <a href={`https://www.google.com/search?q=${encodeURIComponent(res)}`} target="_blank" rel="noopener noreferrer">
                                                    {res} ↗
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Career;
