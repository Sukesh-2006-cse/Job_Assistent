import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, X, FileText, Loader2 } from 'lucide-react';
import './CoverLetterModal.css';

const CoverLetterModal = ({ isOpen, onClose, content, job, userProfile }) => {
    const letterRef = useRef();
    const [isDownloading, setIsDownloading] = useState(false);

    if (!isOpen) return null;

    const downloadPDF = async () => {
        setIsDownloading(true);
        const element = letterRef.current;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Cover_Letter_${job.company.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="cl-modal-overlay">
            <div className="cl-modal-content">
                <div className="cl-modal-header">
                    <h2>Generate Cover Letter</h2>
                    <div className="cl-modal-actions">
                        <button
                            className="cl-download-btn"
                            onClick={downloadPDF}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <><Loader2 className="cl-spin" size={18} style={{ marginRight: '8px' }} /> Generating...</>
                            ) : (
                                <><Download size={18} style={{ marginRight: '8px' }} /> Download PDF</>
                            )}
                        </button>
                        <button className="cl-close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="cl-preview-container">
                    <div className="cl-a4-page" ref={letterRef}>
                        <div className="cl-letter-content">
                            {/* Standard Professional Header */}
                            <div className="cl-header-section">
                                <p><strong>{userProfile?.userId?.name || 'Your Name'}</strong></p>
                                <p>{userProfile?.academic?.college || 'Your Address'}</p>
                                <p>{userProfile?.preferences?.preferredCities || 'City, State'}</p>
                                <p>{userProfile?.userId?.email || 'Email Address'}</p>
                                <p>Date: {new Date().toLocaleDateString()}</p>
                            </div>

                            <div className="cl-employer-section">
                                <p>Hiring Manager</p>
                                <p><strong>{job.company}</strong></p>
                                <p>{job.location}</p>
                            </div>

                            <div className="cl-subject-section">
                                <p><strong>Subject: Application for {job.title} Role</strong></p>
                            </div>

                            <div className="cl-body-section">
                                <pre className="cl-text-pre">{content}</pre>
                            </div>

                            <div className="cl-footer-section">
                                <p>Sincerely,</p>
                                <p><strong>{userProfile?.userId?.name || 'Your Name'}</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoverLetterModal;
