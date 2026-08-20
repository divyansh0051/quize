import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Award, Compass, Play, BookOpen, Library, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/axios.js';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for statistics
  const [stats, setStats] = useState({
    totalCompleted: 0,
    passed: 0,
    failed: 0,
    averageScore: 0,
    highestScore: 0,
    totalQuestions: 0
  });

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attempts');
      const attemptsData = res.data;
      
      setAttempts(attemptsData);
      calculateStats(attemptsData);
    } catch (err) {
      console.error('Error fetching attempts history:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (dataList) => {
    const totalCompleted = dataList.length;
    let passed = 0;
    let highestScore = 0;
    let sumPercentage = 0;
    let totalQuestions = 0;

    const scoresTrend = [];

    // Process attempts in chronological order for chart trend
    [...dataList].reverse().forEach((att) => {
      if (att.completedAt) {
        if (att.status === 'PASSED') passed++;
        if (att.percentage > highestScore) highestScore = att.percentage;
        
        sumPercentage += att.percentage;
        totalQuestions += (att.correctAnswers + att.incorrectAnswers + att.unanswered);

        const dateObj = new Date(att.completedAt);
        scoresTrend.push({
          date: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          score: att.percentage,
          quiz: att.quiz.title
        });
      }
    });

    const averageScore = totalCompleted > 0 ? parseFloat((sumPercentage / totalCompleted).toFixed(1)) : 0;
    
    setStats({
      totalCompleted,
      passed,
      failed: totalCompleted - passed,
      averageScore,
      highestScore,
      totalQuestions
    });

    setChartData(scoresTrend);
  };

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Analyzing performance history...</p>
      </div>
    );
  }

  return (
    <div className="main-content">
      
      {/* Welcome Banner */}
      <div className="glass-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '30px 40px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>My Progress Hub</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>
            Track assessments, review scores, and monitor learning curves.
          </p>
        </div>
        <Link to="/quizzes" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }}>
          <Compass size={18} /> Discover Quizzes
        </Link>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-4" style={{ gap: '20px', marginBottom: '32px' }}>
        
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)' }}>
            <Library size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.totalCompleted}</div>
            <div className="stat-label">Quizzes Taken</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.passed}</div>
            <div className="stat-label">Quizzes Passed</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-secondary)' }}>
            <Activity size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.averageScore}%</div>
            <div className="stat-label">Average Score</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.highestScore}%</div>
            <div className="stat-label">Highest Score</div>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) 2fr', gap: '24px' }}>
        
        {/* Left Side: Score Trend Line Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--color-primary)' }} /> Score Trend Over Time
          </h3>
          
          <div style={{ width: '100%', height: '300px', flex: 1, minHeight: '260px' }}>
            {chartData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No score data points yet. Complete quizzes to populate this trend chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="95%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}
                    labelStyle={{ color: 'var(--text-muted)', fontWeight: '700' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    name="Score Percentage"
                    stroke="var(--color-primary)" 
                    strokeWidth={3} 
                    activeDot={{ r: 8 }}
                    dot={{ strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Side: Recent Attempts List log */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} style={{ color: 'var(--color-secondary)' }} /> Recent Attempts
          </h3>

          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '310px' }} className="table-container">
            {attempts.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>
                No previous attempts recorded. Discovery quizzes to begin testing!
              </div>
            ) : (
              <table className="table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Quiz Title</th>
                    <th>Score</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.slice(0, 5).map(att => (
                    <tr key={att.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{att.quiz.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {new Date(att.completedAt || att.startedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${att.status === 'PASSED' ? 'badge-success' : 'badge-danger'}`}>
                          {att.percentage}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => navigate(`/attempts/${att.id}`)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px', display: 'inline-flex' }}
                        >
                          Review <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
