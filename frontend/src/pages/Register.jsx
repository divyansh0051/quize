import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Sparkles, AlertCircle } from 'lucide-react';
import api from '../api/axios.js';

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await api.post('/auth/register', { name, email, password });
      
      // Store session
      localStorage.setItem('quiz_token', res.data.token);
      localStorage.setItem('quiz_user', JSON.stringify(res.data.user));

      // Trigger custom auth update event
      window.dispatchEvent(new Event('auth_change'));

      // Registered user is student, so redirect to student quizzes catalog
      navigate('/quizzes');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '20px'
    }}>
      <div className="glass-card" style={{ maxWidth: '420px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            background: 'var(--glow-color)',
            borderRadius: '50%',
            marginBottom: '16px',
            color: 'var(--color-secondary)'
          }}>
            <Sparkles size={28} />
          </div>
          <h2>Join QuizVerse</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>
            Register your student account to begin taking quizzes
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-danger)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Creating...' : (
              <>
                <UserPlus size={18} /> Register Student
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
