import React, { useState, useEffect } from 'react';
import { getProfile, uploadResume } from '../../api/profileApi';
import styles from './Profile.module.css';
import Navigation from '../../components/Navigation/Navigation';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [extractedData, setExtractedData] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await getProfile();
            setProfile(data);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file.');
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
            const result = await uploadResume(file);
            setSuccess(true);
            setExtractedData(result.extracted);
            await fetchProfile(); // Refresh profile data
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload resume');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className={styles.loader}>Loading Profile...</div>;

    return (
        <div className={styles.pageWrapper}>
            <Navigation />
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>My Profile</h1>
                    <p>Manage your professional identity and resume</p>
                </header>

                <div className={styles.grid}>
                    <section className={styles.card}>
                        <h2>Professional Info</h2>
                        {profile ? (
                            <div className={styles.infoList}>
                                <div className={styles.infoItem}>
                                    <label>Experience Level</label>
                                    <span>{profile.experience?.experienceLevel || 'Not set'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>Degree</label>
                                    <span>{profile.academic?.degree || 'Not set'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>Branch</label>
                                    <span>{profile.academic?.branch || 'Not set'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>College</label>
                                    <span>{profile.academic?.college || 'Not set'}</span>
                                </div>
                            </div>
                        ) : (
                            <p>No profile data found. Upload a resume to get started!</p>
                        )}

                        <div className={styles.skillsSection}>
                            <h3>Skills</h3>
                            <div className={styles.pills}>
                                {profile?.experience?.skills?.map((skill, i) => (
                                    <span key={i} className={styles.pill}>{skill}</span>
                                )) || 'No skills listed'}
                            </div>
                        </div>

                        <div className={styles.rolesSection}>
                            <h3>Preferred Roles</h3>
                            <div className={styles.pills}>
                                {profile?.preferences?.preferredRoles?.map((role, i) => (
                                    <span key={i} className={styles.rolePill}>{role}</span>
                                )) || 'No roles listed'}
                            </div>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <h2>Resume Analysis</h2>
                        <p className={styles.subtext}>Upload your latest resume (PDF) to automatically sync your profile.</p>

                        <div className={styles.uploadBox}>
                            <input
                                type="file"
                                id="resume-upload"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                className={styles.fileInput}
                            />
                            <label htmlFor="resume-upload" className={styles.uploadLabel}>
                                {uploading ? 'Analyzing...' : 'Choose PDF Resume'}
                            </label>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}
                        {success && <div className={styles.success}>✓ Profile updated from your resume!</div>}

                        {extractedData && (
                            <div className={styles.extractedOverlay}>
                                <div className={styles.extractedContent}>
                                    <h3>Butler Extracted:</h3>
                                    <p><strong>Summary:</strong> {extractedData.summary}</p>
                                    <div className={styles.miniGrid}>
                                        <div>
                                            <h4>Skills found:</h4>
                                            <div className={styles.pills}>
                                                {extractedData.skills.slice(0, 5).map((s, i) => <span key={i} className={styles.tinyPill}>{s}</span>)}
                                                {extractedData.skills.length > 5 && <span>+{extractedData.skills.length - 5} more</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <h4>Roles found:</h4>
                                            <div className={styles.pills}>
                                                {extractedData.preferredRoles.map((r, i) => <span key={i} className={styles.tinyRolePill}>{r}</span>)}
                                            </div>
                                        </div>
                                    </div>
                                    <button className={styles.closeBtn} onClick={() => setExtractedData(null)}>Awesome</button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Profile;
