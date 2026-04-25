import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './SharedPages.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gender: '',
    dob: '',
    phone: '',
    address: '',
    bloodGroup: '',
    emergencyPhone: '',
    disease: ''
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    const res = await signup(formData);
    setIsSubmitting(false);
    if (res.success) {
      if (res.autoSignedIn) {
        navigate('/dashboard', { replace: true });
        return;
      }
      setSuccessMsg(res.message || 'Account created! Please check your email to verify your account, then log in.');
    } else {
      setErrorMsg(res.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="page-wrapper dark-nav">
      <Navbar />
      <header className="page-header">
        <h1>Patient Registration</h1>
        <p>Create your patient portal account with your email. Extra health details are optional and can be added later.</p>
      </header>

      <main className="form-container" style={{maxWidth: '800px'}}>
        <form onSubmit={handleSubmit} style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
          
          <div className="form-group" style={{gridColumn: '1 / -1', marginBottom: 0}}>
            <label>Full Patient Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ali Raza" required />
          </div>

          <div className="form-group" style={{marginBottom: 0}}>
            <label>Email Address (Username)</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="ali.raza@example.pk" required />
          </div>
          
          <div className="form-group" style={{marginBottom: 0}}>
            <label>Account Password</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" required />
          </div>

          <div className="form-group" style={{marginBottom: 0}}>
            <label>Gender</label>
            <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group" style={{marginBottom: 0}}>
            <label>Date of Birth</label>
            <input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
          </div>

          <div className="form-group" style={{marginBottom: 0}}>
            <label>Phone Number (Optional)</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          </div>

          <div className="form-group" style={{marginBottom: 0}}>
            <label>Blood Group (Optional)</label>
            <select value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}>
              <option value="">Select Blood Group</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>

          <div className="form-group" style={{gridColumn: '1 / -1', marginBottom: 0}}>
            <label>Home Address (Optional)</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
          </div>

          <div className="form-group" style={{marginBottom: 0}}>
            <label>Emergency Contact Phone (Optional)</label>
            <input type="tel" value={formData.emergencyPhone} onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})} />
          </div>

          <div className="form-group" style={{marginBottom: 0}}>
            <label>Primary Disease / Symptom (Optional)</label>
            <input type="text" value={formData.disease} onChange={(e) => setFormData({...formData, disease: e.target.value})} placeholder="e.g. Asthma..." />
          </div>

          {successMsg && <p style={{gridColumn: '1 / -1', color: '#4dff91', background: 'rgba(77,255,145,0.1)', border: '1px solid rgba(77,255,145,0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center'}}>{successMsg} <Link to="/login" style={{color: '#00b4db', fontWeight: 'bold'}}>Login now →</Link></p>}
          {errorMsg && <p style={{gridColumn: '1 / -1', color: '#ff4d4d', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center'}}>{errorMsg}</p>}

          <button type="submit" className="submit-btn" disabled={isSubmitting || !!successMsg} style={{gridColumn: '1 / -1', marginTop: '10px'}}>
            {isSubmitting ? 'Creating Account...' : 'Register Patient Account'}
          </button>

          <p style={{gridColumn: '1 / -1', textAlign: 'center', marginTop: '10px'}}>
            Already have an account? <Link to="/login" style={{color: '#00b4db', fontWeight: 'bold'}}>Login Here</Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default SignUp;
