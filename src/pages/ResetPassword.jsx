import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { backend } from '../backend';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './SharedPages.css';

const getResetTokenFromLocation = (search, hash) => {
  const searchParams = new URLSearchParams(search);
  const searchToken = searchParams.get('token') || searchParams.get('access_token');
  if (searchToken) return searchToken;

  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?')) : hash.slice(1);
  const hashParams = new URLSearchParams(hashQuery);
  return hashParams.get('token') || hashParams.get('access_token') || '';
};

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | invalid
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = getResetTokenFromLocation(
    location.search,
    typeof window === 'undefined' ? '' : window.location.hash
  );

  useEffect(() => {
    const validate = async () => {
      const validation = await backend.validateResetToken(resetToken);
      if (!validation.success) {
        setStatus('invalid');
        setMessage(validation.message || 'This reset link is invalid or has expired.');
      }
    };

    if (resetToken) {
      validate();
    }
  }, [resetToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match. Please try again.');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    setStatus('loading');
    setMessage('');

    const result = await backend.resetPassword(resetToken, password);

    if (!result.success) {
      setStatus('error');
      setMessage(result.message || 'Failed to update password. Please try again.');
      return;
    }

    setStatus('success');
    setMessage('Your password has been updated successfully!');
    setTimeout(() => {
      navigate('/login');
    }, 2500);
  };

  if (status === 'invalid') {
    return (
      <div className="page-wrapper dark-nav">
        <Navbar />
        <header className="page-header">
          <h1>Invalid Link</h1>
        </header>
        <main className="form-container" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '20px', color: '#ff4d4d' }}>Invalid</div>
          <p style={{ color: '#ff4d4d', marginBottom: '20px' }}>{message}</p>
          <Link to="/forgot-password">
            <button className="submit-btn" style={{ maxWidth: '220px', margin: '0 auto' }}>
              Request New Link
            </button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="page-wrapper dark-nav">
        <Navbar />
        <header className="page-header">
          <h1>Password Updated!</h1>
        </header>
        <main className="form-container" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '20px', color: '#00b4db' }}>Success</div>
          <h3 style={{ color: '#00b4db', marginBottom: '10px' }}>Password changed</h3>
          <p style={{ color: '#555' }}>{message}</p>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Redirecting to login...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper dark-nav">
      <Navbar />
      <header className="page-header">
        <h1>Set New Password</h1>
        <p>Choose a strong password for your local CareSphere account.</p>
      </header>

      <main className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={6}
              disabled={status === 'loading'}
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={6}
              disabled={status === 'loading'}
            />
          </div>

          {status === 'error' && (
            <p
              style={{
                color: '#ff4d4d',
                marginBottom: '15px',
                textAlign: 'center',
                padding: '10px',
                background: 'rgba(255,77,77,0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255,77,77,0.3)'
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={status === 'loading'}
            style={{ marginBottom: '15px' }}
          >
            {status === 'loading' ? 'Updating Password...' : 'Update Password'}
          </button>

          <p style={{ textAlign: 'center' }}>
            <Link to="/login" style={{ color: '#00b4db', fontWeight: 'bold' }}>
              Cancel - Back to Login
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
