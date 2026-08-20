import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, Library, CheckSquare, Award, 
  HelpCircle, TrendingUp, BarChart3, PieChart as PieIcon 
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import api from '../api/axios.js';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve admin analytics data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Assembling operations metrics dashboard...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="main-content">
        <div className="glass-card text-center" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>Error</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{error}</p>
        </div>
      </div>
    );
  }

  const { stats, charts } = analytics;

  return (
    <div className="main-content">
      
      {/* Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px' }}>Admin Control Center</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Overview of platform growth, student engagement, and test metrics.
        </p>
      </div>

      {/* Aggregate Counts Grid */}
      <div className="grid grid-4" style={{ gap: '20px', marginBottom: '32px' }}>
        
        <div className="glass-card stat-card" onClick={() => navigate('/admin/users')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-label">Total Student Users</div>
          </div>
        </div>

        <div className="glass-card stat-card" onClick={() => navigate('/admin/quizzes')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-secondary)' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.totalQuizzes}</div>
            <div className="stat-label">Total Quizzes ({stats.publishedQuizzes} Live)</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
            <Library size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.totalAttempts}</div>
            <div className="stat-label">Completed Attempts</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.averageScore}%</div>
            <div className="stat-label">Platform Avg Score</div>
          </div>
        </div>

      </div>

      {/* Charts Panels */}
      <div className="grid grid-2" style={{ gap: '24px', marginBottom: '24px' }}>
        
        {/* Trend line for activity (attempts/registrations) */}
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} /> Daily Assessment Activity
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            {charts.attemptTrend.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No database activity log.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="95%">
                <LineChart data={charts.attemptTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px' }} />
                  <Line type="monotone" dataKey="attempts" name="Quizzes Submitted" stroke="var(--color-primary)" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Performance Bar chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: 'var(--color-secondary)' }} /> Performance by Category
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            {charts.categoryPerformance.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No category metrics compiled yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="95%">
                <BarChart data={charts.categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px' }} />
                  <Bar dataKey="avgScore" name="Average Score %" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Category Popularity Pie Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={18} style={{ color: 'var(--color-warning)' }} /> Category Share
          </h3>
          <div style={{ width: '100%', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {charts.popularCategories.length === 0 ? (
              <span style={{ color: 'var(--text-muted)' }}>No category shares data yet.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.popularCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.popularCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pass/Fail aggregate Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Attempt Outcomes Breakdown</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>
            Successful vs unsuccessful marks compilations across all quiz attempts.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ height: '16px', width: '100%', background: 'var(--bg-glass)', borderRadius: '8px', overflow: 'hidden', display: 'flex', border: '1px solid var(--border-glass)' }}>
                <div style={{
                  height: '100%',
                  width: `${stats.totalAttempts > 0 ? (stats.passedAttempts / stats.totalAttempts) * 100 : 0}%`,
                  background: 'var(--color-success)'
                }} />
                <div style={{
                  height: '100%',
                  width: `${stats.totalAttempts > 0 ? (stats.failedAttempts / stats.totalAttempts) * 100 : 0}%`,
                  background: 'var(--color-danger)'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontWeight: '700', fontSize: '18px' }}>
                  <span>●</span> {stats.passedAttempts}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PASSED ATTEMPTS</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)', fontWeight: '700', fontSize: '18px' }}>
                  <span>●</span> {stats.failedAttempts}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>FAILED ATTEMPTS</div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
