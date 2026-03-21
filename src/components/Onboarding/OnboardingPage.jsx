import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingPage.css';
import TagInput from './TagInput';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1
        degree: '',
        branch: '',
        college: '',
        gradYear: '',
        // Step 2
        skills: [],
        experienceLevel: 'Fresher',
        // Step 3
        preferredRoles: [],
        locationPreference: 'Remote',
        preferredCities: '',
        minSalary: '',
        maxSalary: '',
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            navigate('/');
            return;
        }
        // Check if onboarding is already complete from database state
        if (user.isOnboarded) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const setSkills = (skills) => setFormData((prev) => ({ ...prev, skills }));
    const setPreferredRoles = (preferredRoles) => setFormData((prev) => ({ ...prev, preferredRoles }));

    const nextStep = () => setCurrentStep((prev) => prev + 1);
    const prevStep = () => setCurrentStep((prev) => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const payload = { ...formData, userId: user.id };

            const response = await fetch('http://127.0.0.1:5000/api/profile/onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to save profile');
            }

            const result = await response.json();

            // Update local user state
            user.isOnboarded = true;
            localStorage.setItem('user', JSON.stringify(user));

            alert('Profile built and saved successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error saving your profile. Please try again.');
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="onboarding-step">
                        <div className="onboarding-header">
                            <h1>Academic Background</h1>
                            <p>Tell us about your education</p>
                        </div>
                        <div className="form-group">
                            <label>Degree</label>
                            <select name="degree" value={formData.degree} onChange={handleChange} required>
                                <option value="">Select Degree</option>
                                <option value="B.E">B.E</option>
                                <option value="B.Tech">B.Tech</option>
                                <option value="MCA">MCA</option>
                                <option value="BCA">BCA</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Branch</label>
                            <input type="text" name="branch" value={formData.branch} onChange={handleChange} placeholder="e.g. Computer Science" required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>College Name</label>
                                <input type="text" name="college" value={formData.college} onChange={handleChange} placeholder="Your College" required />
                            </div>
                            <div className="form-group">
                                <label>Graduation Year</label>
                                <input type="number" name="gradYear" value={formData.gradYear} onChange={handleChange} placeholder="2024" required />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="onboarding-step">
                        <div className="onboarding-header">
                            <h1>Skills & Experience</h1>
                            <p>Showcase your expertise</p>
                        </div>
                        <div className="form-group">
                            <label>Skills (Press Enter to add)</label>
                            <TagInput tags={formData.skills} setTags={setSkills} placeholder="e.g. React, Python..." />
                        </div>
                        <div className="form-group">
                            <label>Experience Level</label>
                            <div className="radio-group">
                                {['Fresher', '1-2 Years', '3+ Years'].map((level) => (
                                    <label key={level} className="radio-label">
                                        <input
                                            type="radio"
                                            name="experienceLevel"
                                            value={level}
                                            checked={formData.experienceLevel === level}
                                            onChange={handleChange}
                                        />
                                        {level}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="onboarding-step">
                        <div className="onboarding-header">
                            <h1>Job Preferences</h1>
                            <p>What are you looking for?</p>
                        </div>
                        <div className="form-group">
                            <label>Preferred Roles (Press Enter to add)</label>
                            <TagInput tags={formData.preferredRoles} setTags={setPreferredRoles} placeholder="e.g. Frontend Dev, Data Analyst..." />
                        </div>
                        <div className="form-group">
                            <label>Location Preference</label>
                            <select name="locationPreference" value={formData.locationPreference} onChange={handleChange}>
                                <option value="Remote">Remote</option>
                                <option value="Hybrid">Hybrid</option>
                                <option value="On-site">On-site</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Preferred Cities</label>
                            <input type="text" name="preferredCities" value={formData.preferredCities} onChange={handleChange} placeholder="Bengaluru, Hyderabad..." />
                        </div>
                        <div className="form-group">
                            <label>Expected Salary (LPA)</label>
                            <div className="form-row">
                                <input type="number" name="minSalary" value={formData.minSalary} onChange={handleChange} placeholder="Min (optional)" />
                                <input type="number" name="maxSalary" value={formData.maxSalary} onChange={handleChange} placeholder="Max (optional)" />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">
                <div className="step-indicator">
                    {[1, 2, 3].map((step) => (
                        <div
                            key={step}
                            className={`step-dot ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
                        >
                            {currentStep > step ? '✓' : step}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="onboarding-form">
                    {renderStep()}

                    <div className="form-actions">
                        {currentStep > 1 && (
                            <button type="button" onClick={prevStep} className="auth-button btn-secondary">
                                Back
                            </button>
                        )}
                        {currentStep < 3 ? (
                            <button type="button" onClick={nextStep} className="auth-button btn-primary">
                                Next Step
                            </button>
                        ) : (
                            <button type="submit" className="auth-button btn-primary">
                                Complete Setup
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OnboardingPage;
