import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './SharedPages.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const getDeterministicIndex = (seed, length) => {
    if (length <= 0) return 0;

    let hash = 0;
    for (const char of seed) {
        hash = (hash * 31 + char.charCodeAt(0)) % 2147483647;
    }

    return Math.abs(hash) % length;
};

const Appointment = () => {
    const { user, users, departments, bookAppointment } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        patientName: user?.name || '',
        date: '',
        department: '',
        doctorId: '',
        disease: '',
        note: ''
    });

    const doctors = users.filter(u => u.role === 'doctor' && u.department === formData.department);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const appointmentTime = new Date(formData.date);
        if (appointmentTime.getMinutes() % 15 !== 0) {
            alert('Appointments can only be booked in exact 15-minute intervals (e.g. 10:00, 10:15, 10:30, 10:45). Please adjust your time selection.');
            return;
        }
        
        const timeString = appointmentTime.toTimeString().substring(0, 5); // HH:mm
        
        let finalDocId = formData.doctorId;
        let finalDocName = 'Unassigned';
        
        if (finalDocId === 'random' && doctors.length > 0) {
            const availableDocs = doctors.filter(d => timeString >= d.shift_start && timeString <= d.shift_end);
            if (availableDocs.length === 0) {
                alert(`No doctors in ${formData.department} are currently available at ${timeString}. Please choose a different time.`);
                return;
            }
            const randomIndex = getDeterministicIndex(
                `${formData.date}-${formData.department}-${formData.patientName}`,
                availableDocs.length
            );
            finalDocId = availableDocs[randomIndex].id;
            finalDocName = availableDocs[randomIndex].name;
        } else if (finalDocId !== 'random') {
            const selectedDoctor = doctors.find(d => d.id.toString() === finalDocId.toString());
            if (selectedDoctor) {
                if (timeString < selectedDoctor.shift_start || timeString > selectedDoctor.shift_end) {
                    alert(`Dr. ${selectedDoctor.name} is only available between ${selectedDoctor.shift_start} and ${selectedDoctor.shift_end}.`);
                    return;
                }
                finalDocName = selectedDoctor.name;
            }
        }

        bookAppointment({
            patientId: user.id,
            patientName: formData.patientName,
            date: formData.date,
            department: formData.department,
            doctorId: finalDocId === 'random' ? '' : finalDocId,
            doctorName: finalDocName,
            disease: formData.disease,
            note: formData.note
        });
        
        alert('Appointment requested successfully and is pending confirmation!');
        navigate('/dashboard');
    };

    if (!user) return null; // Prevent rendering anything before redirect triggers

    return (
        <div className="page-wrapper dark-nav">
            <Navbar />
            
            <header className="page-header">
                <h1>Book an Appointment</h1>
                <p>Schedule your visit with our world-class specialists. Seamless booking, accelerated care.</p>
            </header>

            <main className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Patient Full Name</label>
                        <input 
                            type="text" 
                            value={formData.patientName} 
                            onChange={e => setFormData({...formData, patientName: e.target.value})} 
                            required 
                            readOnly={!!user.name}
                        />
                        <small style={{color: 'green'}}>Auto-filled from your profile</small>
                    </div>

                    <div className="form-group">
                        <label>Department</label>
                        <select 
                            value={formData.department} 
                            onChange={e => setFormData({...formData, department: e.target.value, doctorId: ''})} 
                            required
                        >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.name}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Attending Doctor</label>
                        <select 
                            value={formData.doctorId} 
                            onChange={e => setFormData({...formData, doctorId: e.target.value})} 
                            required
                            disabled={!formData.department}
                        >
                            <option value="">{formData.department ? 'Select a Doctor' : 'Select a Department First'}</option>
                            <option value="random">Any Doctor (Random)</option>
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.name} (Shift: {doc.shift_start} - {doc.shift_end})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Primary Disease / Symptoms (Optional)</label>
                        <input 
                            type="text" 
                            value={formData.disease} 
                            onChange={e => setFormData({...formData, disease: e.target.value})} 
                            placeholder="e.g. High fever, headache"
                        />
                    </div>

                    <div className="form-group">
                        <label>Additional Notes (Optional)</label>
                        <textarea 
                            value={formData.note} 
                            onChange={e => setFormData({...formData, note: e.target.value})} 
                            placeholder="Any specific requests or earlier records..."
                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            rows="3"
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Preferred Date and Time</label>
                        <input 
                            type="datetime-local" 
                            value={formData.date} 
                            onChange={e => setFormData({...formData, date: e.target.value})} 
                            required 
                        />
                    </div>

                    <button type="submit" className="submit-btn" style={{marginTop: '10px'}}>
                        Confirm Booking Request
                    </button>
                </form>
            </main>
            <Footer />
        </div>
    );
};

export default Appointment;
