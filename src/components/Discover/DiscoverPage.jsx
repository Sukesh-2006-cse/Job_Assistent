import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DiscoverPage.css';
import Navigation from '../Navigation/Navigation';

const JobCard = ({ job }) => (
    <div className="job-card">
        <div className="job-card-header">
            {job.logo ? (
                <img src={job.logo} alt={job.company} className="company-logo" />
            ) : (
                <div className="company-logo-placeholder">{job.company.charAt(0)}</div>
            )}
            <div className="job-info">
                <h3>{job.title}</h3>
                <div className="company-row">
                    <p className="company-name">{job.company}</p>
                    {job.matchScore && (
                        <span className="match-badge">🎯 {job.matchScore}%</span>
                    )}
                </div>
            </div>
            <span className="source-tag">{job.source}</span>
        </div>
        <div className="job-card-body">
            <div className="job-meta">
                <span>📍 {job.location}</span>
                <span>💼 {job.type}</span>
            </div>
            <p className="job-description">{job.description}</p>
        </div>
        <div className="job-card-footer">
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="apply-btn">
                View & Apply
            </a>
        </div>
    </div>
);

const DiscoverPage = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchUserAndJobs = async () => {
            try {
                setLoading(true);
                if (!user) {
                    navigate('/');
                    return;
                }

                // Support both id and _id
                const userId = user.id || user._id;

                if (!userId) {
                    console.error('No User ID found in localStorage', user);
                    throw new Error('User ID missing. Please login again.');
                }

                const token = localStorage.getItem('token');

                // 1. Fetch the user's detailed profile (using unified /api/profile)
                const profileRes = await fetch(`http://127.0.0.1:5000/api/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (profileRes.status === 404) {
                    console.log('Profile not found, redirecting to onboarding');
                    navigate('/onboarding');
                    return;
                }

                if (!profileRes.ok) {
                    throw new Error('Failed to fetch profile info');
                }

                const profileData = await profileRes.json();
                setProfile(profileData);

                // 2. Determine search query (prioritize preferredRoles)
                const roleQuery = profileData.preferences?.preferredRoles?.[0];
                const skillQuery = profileData.experience?.skills?.slice(0, 2).join(' ');
                const searchQuery = roleQuery || skillQuery || 'Software Engineer';

                // 3. Fetch jobs using that personalized query (use /api/discover/jobs)
                const jobsRes = await fetch(`http://127.0.0.1:5000/api/discover/jobs?query=${encodeURIComponent(searchQuery)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!jobsRes.ok) throw new Error('Failed to fetch recommended jobs');

                const jobData = await jobsRes.json();
                setJobs(jobData);
            } catch (err) {
                console.error('Discover Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndJobs();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    return (
        <div className="discover-container">
            <Navigation />

            <main className="discover-main">
                <header className="discover-header">
                    <h1>Recommended for You</h1>
                    <p>Based on your profile and interest in <strong>{profile?.preferences?.preferredRoles?.join(', ') || 'Tech Roles'}</strong></p>
                    {profile?.experience?.skills?.length > 0 && (
                        <div className="user-skills-badges">
                            {profile.experience.skills.map(skill => (
                                <span key={skill} className="skill-badge">{skill}</span>
                            ))}
                        </div>
                    )}
                </header>

                {loading ? (
                    <div className="loader-container">
                        <div className="skeleton-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="skeleton-card"></div>
                            ))}
                        </div>
                        <p className="loading-text">Aggregating jobs from multiple sources...</p>
                    </div>
                ) : error ? (
                    <div className="error-message">
                        <p>❌ {error}</p>
                        <button onClick={() => window.location.reload()}>Try Again</button>
                    </div>
                ) : (
                    <div className="jobs-grid">
                        {jobs.length > 0 ? (
                            jobs.map(job => <JobCard key={job.id} job={job} />)
                        ) : (
                            <p className="no-jobs">No jobs found matching your profile. Try updating your skills!</p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DiscoverPage;
