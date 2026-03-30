import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './JobDetail.module.css';
import Navigation from '../../components/Navigation/Navigation';
import apiClient from '../../api/apiClient';
import { ClipboardList, Target, Bot, Check, Lightbulb, Clock, ArrowLeft, RefreshCw, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { getPrepKit, runOrchestrator } from '../../api/butlerApi';
import { TRIGGERS } from '../../constants/triggers';

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Notes editing state
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [editedNotes, setEditedNotes] = useState('');

    // AI Section state
    const [suggestion, setSuggestion] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [copied, setCopied] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState('details');

    // Match Score state
    const [matchReport, setMatchReport] = useState(null);
    const [matchLoading, setMatchLoading] = useState(false);

    // Prep Kit state
    const [prepKit, setPrepKit] = useState(null);
    const [prepLoading, setPrepLoading] = useState(false);
    const [prepReady, setPrepReady] = useState(false);
    const [hintsVisible, setHintsVisible] = useState({});

    useEffect(() => {
        fetchJob();
    }, [id]);

    useEffect(() => {
        if (job) {
            fetchMatchScore();
            if (job.status === 'Interview') {
                fetchPrepData();
            }
        }
    }, [job?.id || job?._id, job?.status]);

    const fetchJob = async () => {
        try {
            const response = await apiClient.get(`/butler/job/${id}`);
            setJob(response.data);
            setEditedNotes(response.data.notes || '');
        } catch (err) {
            setError('Could not load job details.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMatchScore = async () => {
        setMatchLoading(true);
        try {
            const response = await apiClient.get(`/discover/match/${id}`, {
                params: { job: JSON.stringify(job) }
            });
            setMatchReport(response.data);
        } catch (err) {
            console.error('Match Score Error:', err);
        } finally {
            setMatchLoading(false);
        }
    };

    const fetchPrepData = async () => {
        setPrepLoading(true);
        try {
            const data = await getPrepKit(id);
            if (data.ready) {
                setPrepKit(data.prepKit);
                setPrepReady(true);
            } else {
                setPrepReady(false);
            }
        } catch (err) {
            console.error('Prep Kit Error:', err);
        } finally {
            setPrepLoading(false);
        }
    };

    const handleManuallyTriggerPrep = async () => {
        setPrepLoading(true);
        try {
            await runOrchestrator(TRIGGERS.STATUS_CHANGED_INTERVIEW, { job });
            // Wait a bit then poll
            setTimeout(fetchPrepData, 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.details || err.response?.data?.error || 'Failed to trigger generation';
            alert(`Error: ${errorMsg}`);
            setPrepLoading(false);
        }
    };

    const toggleHint = (index) => {
        setHintsVisible(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            await apiClient.put(`/job-tracker/${id}`, { status: newStatus });
            setJob(prev => ({ ...prev, status: newStatus }));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleSaveNotes = async () => {
        try {
            await apiClient.put(`/job-tracker/${id}`, { notes: editedNotes });
            setJob(prev => ({ ...prev, notes: editedNotes }));
            setIsEditingNotes(false);
        } catch (err) {
            alert('Failed to save notes');
        }
    };

    const generateEmail = async (isRegenerate = false) => {
        setAiLoading(true);
        setAiError(null);
        try {
            const daysSince = Math.floor((Date.now() - new Date(job.appliedDate)) / 86400000);
            const endpoint = isRegenerate ? '/butler/suggest/regenerate' : '/butler/suggest';
            const response = await apiClient.post(endpoint, {
                company: job.company,
                role: job.role,
                daysSince,
                status: job.status,
                notes: job.notes
            });
            setSuggestion(response.data.suggestion);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Could not generate suggestion. Try again.';
            setAiError(errorMessage);
        } finally {
            setAiLoading(false);
        }
    };

    const copyFullPrepKit = () => {
        if (!prepKit) return;

        let text = `INTERVIEW PREP KIT: ${job.role} at ${job.company}\n\n`;

        text += "TECHNICAL QUESTIONS:\n";
        prepKit.technicalQuestions.forEach((q, i) => text += `${i + 1}. ${q}\n`);

        text += "\nBEHAVIOURAL QUESTIONS:\n";
        prepKit.behavioural.forEach((q, i) => text += `${i + 1}. ${q}\n`);

        text += "\nSTAR TEMPLATES:\n";
        prepKit.starTemplates.forEach((t, i) => {
            text += `Template ${i + 1}:\nS: ${t.situation}\nT: ${t.task}\nA: ${t.action}\nR: ${t.result}\n\n`;
        });

        text += "QUESTIONS TO ASK:\n";
        prepKit.questionsToAsk.forEach(q => text += `- ${q}\n`);

        text += "\nKEY TIPS:\n";
        prepKit.keyTips.forEach(t => text += `- ${t}\n`);

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(suggestion);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const getDaysSince = (dateString) => {
        const days = Math.floor((Date.now() - new Date(dateString)) / 86400000);
        return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
    };

    if (loading) return <div className={styles.loading}>Loading butler's report...</div>;
    if (error) return <div className={styles.error}>{error} <button onClick={() => navigate(-1)}>Go Back</button></div>;
    if (!job) return null;

    return (
        <div className={styles.container}>
            <Navigation />

            <div className={styles.headerWrapper}>
                <div className={styles.headerContent}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Back to Applications
                    </button>

                    <div className={styles.headerTop}>
                        <div>
                            <h1 className={styles.companyName}>{job.company}</h1>
                            <h2 className={styles.roleTitle}>{job.role}</h2>
                        </div>
                        <span className={`${styles.statusBadge} ${styles[job.status.toLowerCase()]}`}>
                            {job.status}
                        </span>
                    </div>
                    <div className={styles.metaRow}>
                        <span className={styles.platform}>{job.platform}</span>
                        <span className={styles.separator}>•</span>
                        <span>Applied {getDaysSince(job.appliedDate)}</span>
                        <span className={styles.separator}>•</span>
                        <span>{formatDate(job.appliedDate)}</span>
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                {job.status === 'Interview' && (
                    <div className={styles.tabNav}>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'details' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('details')}
                        >
                            <ClipboardList size={18} style={{ marginRight: '8px' }} /> Details
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'prep' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('prep')}
                        >
                            <Target size={18} style={{ marginRight: '8px' }} /> Interview Prep
                        </button>
                    </div>
                )}

                {activeTab === 'details' ? (
                    <div className={styles.tabContent}>
                        <section className={styles.detailSection}>
                            <h3 className={styles.sectionHeading}>Notes</h3>
                            {isEditingNotes ? (
                                <div className={styles.editNotesContainer}>
                                    <textarea
                                        className={styles.notesTextarea}
                                        value={editedNotes}
                                        onChange={(e) => setEditedNotes(e.target.value)}
                                        rows="5"
                                    />
                                    <div className={styles.editBtns}>
                                        <button className={styles.saveBtn} onClick={handleSaveNotes}>Save</button>
                                        <button className={styles.cancelBtn} onClick={() => {
                                            setEditedNotes(job.notes || '');
                                            setIsEditingNotes(false);
                                        }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.notesBox}>
                                    {job.notes ? (
                                        <p className={styles.notesText}>{job.notes}</p>
                                    ) : (
                                        <p className={styles.noNotes}>No notes added yet.</p>
                                    )}
                                    <button className={styles.editBtn} onClick={() => setIsEditingNotes(true)}>
                                        Edit Notes
                                    </button>
                                </div>
                            )}
                        </section>

                        <section className={styles.detailSection}>
                            <h3 className={styles.sectionHeading}>Update Status</h3>
                            <div className={styles.statusButtons}>
                                {['Applied', 'Interview', 'Offer', 'Rejected'].map(status => (
                                    <button
                                        key={status}
                                        className={`${styles.statusBtn} ${job.status === status ? styles.activeStatus : ''}`}
                                        onClick={() => handleStatusUpdate(status)}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {(matchLoading || matchReport) && (
                            <section className={`${styles.detailSection} ${styles.matchSection}`}>
                                <h3 className={styles.sectionHeading}>Match Analysis</h3>

                                {matchLoading ? (
                                    <div className={styles.matchSkeleton}>
                                        <div className={styles.skeletonScore}></div>
                                        <div className={styles.skeletonText}></div>
                                    </div>
                                ) : (
                                    <div className={styles.matchReport}>
                                        <div className={styles.matchHeader}>
                                            <div className={styles.matchScoreCircle}>
                                                <span className={styles.scoreNumber}>{matchReport.score || 0}</span>
                                                <span className={styles.scoreLabel}>% Match</span>
                                            </div>
                                            <div className={styles.matchVerdict}>
                                                <span className={`${styles.verdictBadge} ${styles[(matchReport.verdict || 'Low Fit').replace(' ', '').toLowerCase()]}`}>
                                                    {matchReport.verdict || 'Low Fit'}
                                                </span>
                                                <p className={styles.matchSummary}>{matchReport.summary || 'No analysis available.'}</p>
                                            </div>
                                        </div>

                                        <div className={styles.skillsComparison}>
                                            <div className={styles.skillGroup}>
                                                <h4>Matched Skills</h4>
                                                <div className={styles.skillPills}>
                                                    {(matchReport.matched || []).map(skill => (
                                                        <span key={skill} className={styles.matchedSkill}>{skill}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className={styles.skillGroup}>
                                                <h4>Missing Skills</h4>
                                                <div className={styles.skillPills}>
                                                    {(matchReport.missing || []).map(skill => (
                                                        <span key={skill} className={styles.missingSkill}>{skill}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        <section className={`${styles.detailSection} ${styles.butlerSection}`}>
                            <div className={styles.butlerHeader}>
                                <h3 className={styles.sectionHeading}>
                                    <span className={styles.butlerIcon}><Bot size={24} /></span> Ask Butler
                                </h3>
                                <p className={styles.butlerSubtext}>Generate a personalised follow-up email</p>
                            </div>

                            {!suggestion && !aiLoading && (
                                <button className={styles.generateBtn} onClick={() => generateEmail()}>
                                    <Sparkles size={18} style={{ marginRight: '8px' }} /> Generate Follow-up Email
                                </button>
                            )}

                            {aiLoading && (
                                <div className={styles.aiLoading}>
                                    <div className={styles.spinner}></div>
                                    <span>Butler is writing...</span>
                                </div>
                            )}

                            {suggestion && (
                                <div className={styles.suggestionContainer}>
                                    <textarea
                                        className={styles.suggestionTextarea}
                                        value={suggestion}
                                        readOnly
                                    />
                                    <div className={styles.aiActions}>
                                        <button className={styles.copyBtn} onClick={copyToClipboard}>
                                            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy to Clipboard</>}
                                        </button>
                                        <button className={styles.regenerateBtn} onClick={() => generateEmail(true)}>
                                            <RefreshCw size={16} /> Regenerate
                                        </button>
                                    </div>
                                </div>
                            )}

                            {aiError && (
                                <div className={styles.aiError}>
                                    <p>{aiError}</p>
                                    <button className={styles.retryBtn} onClick={() => generateEmail()}>Try Again</button>
                                </div>
                            )}
                        </section>

                        {job.applyUrl && (
                            <div className={styles.applySection}>
                                <a
                                    href={job.applyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.applyNowBtn}
                                >
                                    Apply Now <ExternalLink size={18} style={{ marginLeft: '8px' }} />
                                </a>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.prepContent}>
                        {!prepReady && !prepLoading ? (
                            <div className={styles.prepPending}>
                                <div className={styles.prepEmptyIcon}><Clock size={48} /></div>
                                <h3>Prep kit is being generated...</h3>
                                <p>Butler is analyzing the job and crafting your strategy. Check back in a moment.</p>
                                <button className={styles.generateNowBtn} onClick={handleManuallyTriggerPrep}>
                                    Generate Now
                                </button>
                            </div>
                        ) : prepLoading ? (
                            <div className={styles.prepSkeleton}>
                                <div className={styles.skeletonLine}></div>
                                <div className={styles.skeletonBox}></div>
                                <div className={styles.skeletonLine}></div>
                                <div className={styles.skeletonBox}></div>
                            </div>
                        ) : (
                            <div className={styles.prepKit}>
                                <div className={styles.prepHeader}>
                                    <h2>Your Personalized Prep Kit</h2>
                                    <p>Based on {job.company}'s requirements for {job.role}</p>
                                </div>

                                <div className={styles.prepGrid}>
                                    <section className={styles.prepSectionDetail}>
                                        <h3 className={styles.sectionHeading}>Technical Questions</h3>
                                        <div className={styles.questionList}>
                                            {(prepKit.technicalQuestions || []).map((q, i) => (
                                                <div key={i} className={styles.questionItem}>
                                                    <p className={styles.questionText}><strong>{i + 1}.</strong> {q}</p>
                                                    <button className={styles.hintToggle} onClick={() => toggleHint(`tech_${i}`)}>
                                                        {hintsVisible[`tech_${i}`] ? 'Hide Hint' : 'Show Answer Hint'}
                                                    </button>
                                                    {hintsVisible[`tech_${i}`] && (
                                                        <div className={styles.hintBox}>
                                                            <Lightbulb size={16} color="var(--accent-yellow)" style={{ marginRight: '8px' }} /> Think about your experience with related technologies in your past projects.
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className={styles.prepSectionDetail}>
                                        <h3 className={styles.sectionHeading}>Behavioural Questions</h3>
                                        <div className={styles.questionList}>
                                            {(prepKit.behavioural || []).map((q, i) => (
                                                <div key={i} className={styles.questionItem}>
                                                    <p className={styles.questionText}><strong>{i + 1}.</strong> {q}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className={styles.prepSectionDetail}>
                                        <h3 className={styles.sectionHeading}>STAR Answer Templates</h3>
                                        <div className={styles.starTemplates}>
                                            {(prepKit.starTemplates || []).map((t, i) => (
                                                <div key={i} className={styles.starCard}>
                                                    <div className={styles.starField}><strong>S:</strong> {t.situation}</div>
                                                    <div className={styles.starField}><strong>T:</strong> {t.task}</div>
                                                    <div className={styles.starField}><strong>A:</strong> {t.action}</div>
                                                    <div className={styles.starField}><strong>R:</strong> {t.result}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <div className={styles.prepRow}>
                                        <section className={`${styles.prepSectionDetail} ${styles.half}`}>
                                            <h3 className={styles.sectionHeading}>Ask the Interviewer</h3>
                                            <ul className={styles.bulletList}>
                                                {(prepKit.questionsToAsk || []).map((q, i) => <li key={i}>{q}</li>)}
                                            </ul>
                                        </section>

                                        <section className={`${styles.prepSectionDetail} ${styles.half}`}>
                                            <h3 className={styles.sectionHeading}>Quick Tips</h3>
                                            <div className={styles.tipCards}>
                                                {(prepKit.keyTips || []).map((t, i) => (
                                                    <div key={i} className={styles.tipCard}>
                                                        <span className={styles.tipIcon}><Lightbulb size={18} /></span>
                                                        <p>{t}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                <button className={styles.copyPrepBtn} onClick={copyFullPrepKit}>
                                    {copied ? <><Check size={18} /> Copied Full Kit!</> : <><Copy size={18} /> Copy Full Prep Kit</>}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobDetail;
