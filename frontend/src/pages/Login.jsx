import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Sparkles, AlertCircle } from 'lucide-react';
import api from '../api/axios.js';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      
      // Store session
      localStorage.setItem('quiz_token', res.data.token);
      localStorage.setItem('quiz_user', JSON.stringify(res.data.user));

      // Trigger custom auth update event
      window.dispatchEvent(new Event('auth_change'));

      // Redirect based on role
      if (res.data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/quizzes');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleShortcut = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
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
            color: 'var(--color-primary)'
          }}>
            <Sparkles size={28} />
          </div>
          <h2>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>
            Login to test your knowledge or manage quizzes
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
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : (
              <>
                <LogIn size={18} /> Login Account
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
            Register Student
          </Link>
        </div>

        {/* Demo shortcuts helper */}
        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-glass)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            DEMO LOGIN HELPERS
          </span>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={() => handleShortcut('admin@quiz.com', 'admin123')}
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '12px', padding: '6px 12px' }}
            >
              Sign as Admin
            </button>
            <button
              onClick={() => handleShortcut('student@quiz.com', 'student123')}
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '12px', padding: '6px 12px' }}
            >
              Sign as Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
