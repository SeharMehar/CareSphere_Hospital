import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './SharedPages.css';
import { DEPARTMENTS } from '../dummyData';
import { useAuth } from '../context/AuthContext';

const TRACKS = [
    {
        value: 'clinical observer',
        label: 'Clinical Observer',
        description: 'Doctors and senior medical students who want supervised observation exposure.'
    },
    {
        value: 'nursing intern',
        label: 'Nursing Intern',
        description: 'Hands-on ward rotation requests for nursing students and trainees.'
    },
    {
        value: 'admin trainee',
        label: 'Admin Trainee',
        description: 'Front-desk, records, and hospital operations learning program.'
    },
    {
        value: 'community volunteer',
        label: 'Community Volunteer',
        description: 'Outreach, awareness camp, and patient-support volunteer requests.'
    }
];

const Apply = () => {
    const { submitApplication } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        department: '',
        coverLetter: '',
        licenseNumber: '',
        yearsExperience: '',
        shiftPreference: '',
        languages: ''
    });

    const selectedTrack = TRACKS.find((track) => track.value === formData.role);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = await submitApplication(formData);
        if (!result?.success) {
            alert(result?.message || 'Unable to submit your request right now.');
            return;
        }

        alert('Your program request has been submitted successfully. Our team will review it and contact you soon.');
        navigate('/');
    };

    return (
        <div className="page-wrapper dark-nav">
            <Navbar />
            
            <header className="page-header">
                <h1>CareSphere Clinical Programs</h1>
                <p>Apply for observer, internship, trainee, or volunteer opportunities. This page is separate from portal account signup.</p>
            </header>

            <main className="form-container" style={{ maxWidth: '900px' }}>
                <div style={{background: '#eef8ff', border: '1px solid #cfe8f7', borderRadius: '12px', padding: '18px 20px', marginBottom: '24px'}}>
                    <h3 style={{margin: '0 0 8px', color: '#112A46'}}>Important Note</h3>
                    <p style={{margin: '0 0 10px', color: '#475569', lineHeight: 1.6}}>
                        If you want direct dashboard access as a patient or staff member, use the <Link to="/signup" style={{color: '#0083B0', fontWeight: '700'}}>Sign Up</Link> page.
                        This section is only for special public programs and review-based requests.
                    </p>
                    <p style={{margin: 0, color: '#64748b', fontSize: '0.95rem'}}>
                        Every submission is reviewed manually by the CareSphere admin team before approval.
                    </p>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '26px'}}>
                    {TRACKS.map((track) => (
                        <button
                            key={track.value}
                            type="button"
                            onClick={() => setFormData({...formData, role: track.value, licenseNumber: '', yearsExperience: '', shiftPreference: '', languages: ''})}
                            style={{
                                textAlign: 'left',
                                padding: '18px',
                                borderRadius: '12px',
                                border: formData.role === track.value ? '2px solid #0083B0' : '1px solid #d9e4ec',
                                background: formData.role === track.value ? '#f0fbff' : '#ffffff',
                                cursor: 'pointer'
                            }}
                        >
                            <strong style={{display: 'block', color: '#112A46', marginBottom: '8px'}}>{track.label}</strong>
                            <span style={{color: '#64748b', fontSize: '0.92rem', lineHeight: 1.5}}>{track.description}</span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Dr. Aisha Khan" required />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="aisha.khan@example.pk" required />
                    </div>

                    <div className="form-group">
                        <label>Program Track</label>
                        <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value, licenseNumber: '', yearsExperience: '', shiftPreference: '', languages: ''})} required>
                            <option value="">Select a Program</option>
                            {TRACKS.map((track) => (
                                <option key={track.value} value={track.value}>{track.label}</option>
                            ))}
                        </select>
                    </div>

                    {formData.role === 'clinical observer' && (
                        <div style={{background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #e1e8ed'}}>
                            <h4 style={{marginBottom: '15px', color: '#0083B0'}}>Observer Request Details</h4>
                            <div className="form-group">
                                <label>PMDC / University / Reference ID</label>
                                <input type="text" value={formData.licenseNumber} onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Experience Level</label>
                                <input type="number" min="0" value={formData.yearsExperience} onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})} placeholder="Years of study or clinical experience" required />
                            </div>
                            <div className="form-group">
                                <label>Availability Window</label>
                                <select value={formData.shiftPreference} onChange={(e) => setFormData({...formData, shiftPreference: e.target.value})} required>
                                    <option value="">Select Availability</option>
                                    <option value="weekday mornings">Weekday Mornings</option>
                                    <option value="weekday evenings">Weekday Evenings</option>
                                    <option value="weekend blocks">Weekend Blocks</option>
                                    <option value="flexible">Flexible</option>
                                </select>
                            </div>
                            <div className="form-group" style={{marginBottom: 0}}>
                                <label>Languages or Clinical Interests</label>
                                <input type="text" value={formData.languages} onChange={(e) => setFormData({...formData, languages: e.target.value})} placeholder="e.g. English, Urdu, Cardiology rounds" required />
                            </div>
                        </div>
                    )}

                    {formData.role === 'nursing intern' && (
                        <div style={{background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #e1e8ed'}}>
                            <h4 style={{marginBottom: '15px', color: '#0083B0'}}>Nursing Rotation Details</h4>
                            <div className="form-group">
                                <label>Student / Registration ID</label>
                                <input type="text" value={formData.licenseNumber} onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Training Year or Experience</label>
                                <input type="number" min="0" value={formData.yearsExperience} onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Rotation Preference</label>
                                <select value={formData.shiftPreference} onChange={(e) => setFormData({...formData, shiftPreference: e.target.value})} required>
                                    <option value="">Select Rotation</option>
                                    <option value="day rotation">Day Rotation</option>
                                    <option value="night rotation">Night Rotation</option>
                                    <option value="mixed rotation">Mixed Rotation</option>
                                </select>
                            </div>
                            <div className="form-group" style={{marginBottom: 0}}>
                                <label>Languages or Ward Skills</label>
                                <input type="text" value={formData.languages} onChange={(e) => setFormData({...formData, languages: e.target.value})} placeholder="e.g. Basic patient care, English, Urdu" required />
                            </div>
                        </div>
                    )}

                    {formData.role === 'admin trainee' && (
                        <div style={{background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #e1e8ed'}}>
                            <h4 style={{marginBottom: '15px', color: '#0083B0'}}>Operations Training Details</h4>
                            <div className="form-group">
                                <label>Institute / Reference ID</label>
                                <input type="text" value={formData.licenseNumber} onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Relevant Experience</label>
                                <input type="number" min="0" value={formData.yearsExperience} onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Availability</label>
                                <select value={formData.shiftPreference} onChange={(e) => setFormData({...formData, shiftPreference: e.target.value})} required>
                                    <option value="">Select Availability</option>
                                    <option value="weekday mornings">Weekday Mornings</option>
                                    <option value="weekday afternoons">Weekday Afternoons</option>
                                    <option value="full day">Full Day</option>
                                    <option value="flexible">Flexible</option>
                                </select>
                            </div>
                            <div className="form-group" style={{marginBottom: 0}}>
                                <label>Languages or Digital Skills</label>
                                <input type="text" value={formData.languages} onChange={(e) => setFormData({...formData, languages: e.target.value})} placeholder="e.g. MS Excel, English, patient coordination" required />
                            </div>
                        </div>
                    )}

                    {formData.role === 'community volunteer' && (
                        <div style={{background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #e1e8ed'}}>
                            <h4 style={{marginBottom: '15px', color: '#0083B0'}}>Volunteer Outreach Details</h4>
                            <div className="form-group">
                                <label>Reference / CNIC / Institution ID</label>
                                <input type="text" value={formData.licenseNumber} onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Years of Community or Support Experience</label>
                                <input type="number" min="0" value={formData.yearsExperience} onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Availability</label>
                                <select value={formData.shiftPreference} onChange={(e) => setFormData({...formData, shiftPreference: e.target.value})} required>
                                    <option value="">Select Availability</option>
                                    <option value="weekend camps">Weekend Camps</option>
                                    <option value="patient support desk">Patient Support Desk</option>
                                    <option value="community awareness drives">Community Awareness Drives</option>
                                    <option value="flexible">Flexible</option>
                                </select>
                            </div>
                            <div className="form-group" style={{marginBottom: 0}}>
                                <label>Languages or Outreach Skills</label>
                                <input type="text" value={formData.languages} onChange={(e) => setFormData({...formData, languages: e.target.value})} placeholder="e.g. Urdu, event support, patient guidance" required />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Preferred Department</label>
                        <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required>
                            <option value="">Select Department</option>
                            {DEPARTMENTS.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                            <option value="General Admin">General / Administration</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Purpose and Motivation</label>
                        <textarea rows="5" value={formData.coverLetter} onChange={(e) => setFormData({...formData, coverLetter: e.target.value})} placeholder={selectedTrack ? `Briefly explain why you are applying for the ${selectedTrack.label} track.` : 'Briefly explain your interest, goals, and relevant background.'} required></textarea>
                    </div>

                    <button type="submit" className="submit-btn" disabled={!formData.role}>Submit Program Request</button>
                    {!formData.role && <p style={{textAlign: 'center', marginTop: '10px', fontSize: '0.9rem', color: '#666'}}>Please select a program track to continue.</p>}
                </form>
            </main>
            <Footer />
        </div>
    );
};

export default Apply;
