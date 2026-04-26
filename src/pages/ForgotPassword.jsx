import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { buildAppUrl } from '../appUrl';
import { backend } from '../backend';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './SharedPages.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    setResetLink('');

    const result = await backend.requestPasswordReset(email);

    if (!result.success) {
      setStatus('error');
      setMessage(result.message || 'Failed to create reset link. Please try again.');
      return;
    }

    setStatus('success');
    setResetLink(
      result.resetLink
        ? buildAppUrl(result.resetLink)
        : result.token
        ? buildAppUrl(`/reset-password?token=${result.token}`)
        : ''
    );
    setMessage(result.message || `Password reset instructions have been sent to ${email}.`);
  };

  return (
    <div className="page-wrapper dark-nav">
      <Navbar />
      <header className="page-header">
        <h1>Reset Password</h1>
        <p>Enter your email for a reset link.</p>
      </header>

      <main className="form-container">
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '20px', color: '#00b4db' }}>Reset Link</div>
            <h3 style={{ color: '#00b4db', marginBottom: '10px' }}>Link ready</h3>
            <p style={{ color: '#555', marginBottom: '20px' }}>{message}</p>
            {resetLink && (
              <a
                href={resetLink}
                style={{
                  display: 'block',
                  wordBreak: 'break-all',
                  color: '#00b4db',
                  fontWeight: 'bold',
                  marginBottom: '20px'
                }}
              >
                {resetLink}
              </a>
            )}
            <Link to="/login">
              <button className="submit-btn" style={{ maxWidth: '220px', margin: '0 auto' }}>
                Back to Login
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
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
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </button>

            <p style={{ textAlign: 'center' }}>
              Remember your password?{' '}
              <Link to="/login" style={{ color: '#00b4db', fontWeight: 'bold' }}>
                Back to Login
              </Link>
            </p>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
