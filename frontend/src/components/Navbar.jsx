import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, Trophy, BookOpen, LayoutDashboard, 
  Users, FolderHeart, Sun, Moon, Sparkles 
} from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');

  const checkUser = () => {
    const userJson = localStorage.getItem('quiz_user');
    if (userJson) {
      setUser(JSON.parse(userJson));
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    checkUser();
    // Listen to local changes
    window.addEventListener('auth_change', checkUser);
    return () => window.removeEventListener('auth_change', checkUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    setUser(null);
    navigate('/login');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };

  if (!user) return null; // Don't show header if user is not logged in yet

  const isAdmin = user.role === 'ADMIN';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <Sparkles size={24} color="#6366f1" />
        <span>QuizVerse</span>
      </Link>

      <div className="navbar-links">
        {isAdmin ? (
          <>
            <Link 
              to="/admin/dashboard" 
              className={`navbar-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LayoutDashboard size={16} /> Dashboard
              </span>
            </Link>
            <Link 
              to="/admin/users" 
              className={`navbar-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} /> Students
              </span>
            </Link>
            <Link 
              to="/admin/categories" 
              className={`navbar-link ${location.pathname === '/admin/categories' ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FolderHeart size={16} /> Categories
              </span>
            </Link>
            <Link 
              to="/admin/quizzes" 
              className={`navbar-link ${location.pathname.startsWith('/admin/quizzes') ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={16} /> Quizzes
              </span>
            </Link>
          </>
        ) : (
          <>
            <Link 
              to="/quizzes" 
              className={`navbar-link ${location.pathname === '/quizzes' ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={16} /> Quizzes
              </span>
            </Link>
            <Link 
              to="/dashboard" 
              className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LayoutDashboard size={16} /> My Progress
              </span>
            </Link>
            <Link 
              to="/leaderboard" 
              className={`navbar-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={16} /> Standings
              </span>
            </Link>
          </>
        )}
      </div>

      <div className="navbar-user">
        <button 
          onClick={toggleTheme} 
          className="btn btn-secondary" 
          style={{ padding: '8px', borderRadius: '50%', display: 'flex' }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <span className="user-badge">{user.role}</span>
        <span style={{ fontWeight: '600', fontSize: '14px' }}>Hi, {user.name}</span>
        
        <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '8px 12px' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
