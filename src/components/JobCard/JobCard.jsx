import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './JobCard.module.css';
import { updateJob, deleteJob } from '../../api/jobsApi';

const JobCard = ({ job, onStatusChange, onDelete }) => {
    const navigate = useNavigate();
    if (!job) return null;

    const daysSince = job.appliedDate
        ? Math.floor((Date.now() - new Date(job.appliedDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const getDaysText = () => {
        if (isNaN(daysSince)) return 'Date Unknown';
        if (daysSince === 0) return 'Today';
        if (daysSince === 1) return 'Yesterday';
        return `${daysSince} days ago`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    };

    const handleStatusUpdate = async (e) => {
        const newStatus = e.target.value;
        try {
            await updateJob(job._id, { status: newStatus });
            onStatusChange(job._id, newStatus);
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        }
    };

    const handleDeleteClick = async () => {
        if (window.confirm("Are you sure you want to delete this application?")) {
            try {
                await deleteJob(job._id);
                onDelete(job._id);
            } catch (error) {
                console.error('Failed to delete job:', error);
                alert('Failed to delete job');
            }
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.topRow}>
                <div className={styles.companyInfo}>
                    <h3 className={styles.companyName}>{job.company}</h3>
                    {job.matchScore && (
                        <div className={styles.matchBadge} title="AI Match Score">
                            🎯 {job.matchScore}%
                        </div>
                    )}
                </div>
                <span className={`${styles.statusBadge} ${styles[job.status.toLowerCase()]}`}>
                    {job.status}
                </span>
            </div>

            <div className={styles.secondRow}>
                <span className={styles.role}>{job.role}</span>
                {job.platform && <span className={styles.platformPill}>{job.platform}</span>}
            </div>

            <div className={styles.thirdRow}>
                <span className={styles.daysSince}>{getDaysText()}</span>
                <span className={styles.bullet}>•</span>
                <span className={styles.appliedDate}>{formatDate(job.appliedDate)}</span>
            </div>

            {job.notes && (
                <p className={styles.notesPreview}>
                    {job.notes.length > 80 ? `${job.notes.substring(0, 80)}...` : job.notes}
                </p>
            )}

            <div className={styles.actionsRow}>
                <div className={styles.mainActions}>
                    <select
                        className={styles.statusDropdown}
                        value={job.status}
                        onChange={handleStatusUpdate}
                    >
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    <button
                        className={styles.detailsBtn}
                        onClick={() => navigate('/jobs/' + job._id)}
                    >
                        View Details
                    </button>
                </div>
                <button className={styles.deleteBtn} onClick={handleDeleteClick}>
                    Delete
                </button>
            </div>
        </div>
    );
};

export default JobCard;
