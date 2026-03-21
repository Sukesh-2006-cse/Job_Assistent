import React, { useState, useEffect } from 'react';
import styles from './AddJobModal.module.css';
import { createJob } from '../../api/jobsApi';

const AddJobModal = ({ onClose, onJobAdded }) => {
    const [formData, setFormData] = useState({
        company: '',
        role: '',
        appliedDate: new Date().toISOString().split('T')[0],
        platform: 'LinkedIn',
        status: 'Applied',
        notes: ''
    });
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.company || !formData.role || !formData.appliedDate) {
            setSubmitError('Please fill in all required fields.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const newJob = await createJob(formData);
            onJobAdded(newJob);
            onClose();
        } catch (error) {
            setSubmitError('Failed to save job application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                <h2 className={styles.title}>New Application</h2>

                {submitError && <div className={styles.errorBanner}>{submitError}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Company Name *</label>
                        <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="e.g. Google"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Role *</label>
                        <input
                            type="text"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            placeholder="e.g. Software Engineer"
                            required
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Date Applied *</label>
                            <input
                                type="date"
                                name="appliedDate"
                                value={formData.appliedDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Platform</label>
                            <select name="platform" value={formData.platform} onChange={handleChange}>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Naukri">Naukri</option>
                                <option value="Indeed">Indeed</option>
                                <option value="Company Website">Company Website</option>
                                <option value="Referral">Referral</option>
                                <option value="Internshala">Internshala</option>
                                <option value="AngelList">AngelList</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Status</label>
                        <select name="status" value={formData.status} onChange={handleChange}>
                            <option value="Applied">Applied</option>
                            <option value="Interview">Interview</option>
                            <option value="Offer">Offer</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Notes (Optional)</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Add any specific details here..."
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Add to Tracker'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddJobModal;
