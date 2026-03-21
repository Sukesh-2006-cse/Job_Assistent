import React, { useState, useEffect } from 'react';
import styles from './Applications.module.css';
import { getAllJobs, updateJob, deleteJob } from '../../api/jobsApi';
import JobCard from '../../components/JobCard/JobCard';
import AddJobModal from '../../components/AddJobModal/AddJobModal';
import Navigation from '../../components/Navigation/Navigation';

const Applications = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const data = await getAllJobs();
            setJobs(data);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJobAdded = (newJob) => {
        setJobs(prev => [newJob, ...prev]);
    };

    const handleStatusChange = (id, newStatus) => {
        setJobs(prev => prev.map(job =>
            job._id === id ? { ...job, status: newStatus } : job
        ));
    };

    const handleDelete = (id) => {
        setJobs(prev => prev.filter(job => job._id !== id));
    };

    const stats = {
        total: jobs.length,
        applied: jobs.filter(j => j.status === 'Applied').length,
        interview: jobs.filter(j => j.status === 'Interview').length,
        offer: jobs.filter(j => j.status === 'Offer').length,
    };

    const filteredJobs = jobs.filter(job => {
        const matchesFilter = activeFilter === 'All' || job.status === activeFilter;
        const matchesSearch = job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.role.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className={styles.container}>
            <Navigation />

            <div className={styles.headerWrapper}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>My Applications</h1>
                        <p className={styles.subtitle}>{filteredJobs.length} applications</p>
                    </div>
                    <button className={styles.addBtn} onClick={() => setShowModal(true)}>
                        + Add Job
                    </button>
                </header>
            </div>

            <div className={styles.content}>
                <div className={styles.statsRow}>
                    <div className={styles.statBox}>
                        <span className={styles.statNumber}>{stats.total}</span>
                        <span className={styles.statLabel}>Total</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statNumber}>{stats.applied}</span>
                        <span className={styles.statLabel}>Applied</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statNumber}>{stats.interview}</span>
                        <span className={styles.statLabel}>Interviews</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statNumber}>{stats.offer}</span>
                        <span className={styles.statLabel}>Offers</span>
                    </div>
                </div>

                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Search by company or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    <div className={styles.filterButtons}>
                        {['All', 'Applied', 'Interview', 'Offer', 'Rejected'].map(filter => (
                            <button
                                key={filter}
                                className={`${styles.filterBtn} ${activeFilter === filter ? styles.activeFilter : ''}`}
                                onClick={() => setActiveFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.jobsList}>
                    {loading ? (
                        <div className={styles.message}>Loading your applications...</div>
                    ) : filteredJobs.length === 0 ? (
                        <div className={styles.message}>
                            No applications found. Add a job or discover new ones!
                        </div>
                    ) : (
                        filteredJobs.map(job => (
                            <JobCard
                                key={job._id}
                                job={job}
                                onStatusChange={handleStatusChange}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            </div>

            {showModal && (
                <AddJobModal
                    onClose={() => setShowModal(false)}
                    onJobAdded={handleJobAdded}
                />
            )}
        </div>
    );
};

export default Applications;
