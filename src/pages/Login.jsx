import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import './SharedPages.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    const res = await login(email, password);

    if (!res.success) {
      if (res.accountCreated) {
        setNotice(res.message);
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
      setIsSubmitting(false);
    }
    // On success, the user state change in context triggers the useEffect above
  };

  // Show nothing while checking initial session
  if (loading) {
    return <Loader />;
  }

  return (
    <div className="page-wrapper dark-nav">
      <Navbar />
      <header className="page-header">
        <h1>CareSphere Login</h1>
        <p>Enter your email and password. If it is your first time, we will create a patient account for you automatically.</p>
      </header>

      <main className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isSubmitting}
            />
          </div>

          {notice && <p style={{color: '#0369a1', marginBottom: '15px', textAlign: 'center', padding: '10px', background: 'rgba(14,165,233,0.12)', borderRadius: '8px', border: '1px solid rgba(14,165,233,0.3)'}}>{notice}</p>}
          {error && <p style={{color: '#ff4d4d', marginBottom: '15px', textAlign: 'center', padding: '10px', background: 'rgba(255,77,77,0.1)', borderRadius: '8px', border: '1px solid rgba(255,77,77,0.3)'}}>{error}</p>}

          <button type="submit" className="submit-btn" disabled={isSubmitting} style={{marginBottom: '15px'}}>
            {isSubmitting ? 'Checking account...' : 'Continue with Email'}
          </button>

          <p style={{textAlign: 'center', color: '#94a3b8', fontSize: '0.92rem', marginBottom: '15px'}}>
            Existing users will log in normally. New email users will get quick patient access.
          </p>

          <p style={{textAlign: 'center', marginBottom: '8px'}}>
            <Link to="/forgot-password" style={{color: '#aaa', fontSize: '0.9rem'}}>Forgot your password?</Link>
          </p>
          <p style={{textAlign: 'center'}}>
            Don't have an account? <Link to="/signup" style={{color: '#00b4db', fontWeight: 'bold'}}>Sign Up</Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
