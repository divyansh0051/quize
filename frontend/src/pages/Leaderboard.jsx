import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Search, FolderOpen, Award, CheckCircle } from 'lucide-react';
import api from '../api/axios.js';

const Leaderboard = () => {
  const [board, setBoard] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // States
  const [timeframe, setTimeframe] = useState('overall'); // overall | monthly | weekly
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = { timeframe };
      if (selectedCategory) params.categoryId = selectedCategory;

      const res = await api.get('/leaderboard', { params });
      setBoard(res.data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          padding: '12px',
          background: 'var(--glow-color)',
          borderRadius: '50%',
          marginBottom: '16px',
          color: 'var(--color-warning)'
        }}>
          <Trophy size={36} />
        </div>
        <h1 style={{ fontSize: '32px' }}>Global Leaderboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          See where you stand among top-tier candidates on the platform.
        </p>
      </div>

      {/* Filter and Timeframe Control tabs */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Timeframe tab selector */}
          <div style={{ display: 'flex', background: 'var(--bg-glass)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            {['overall', 'monthly', 'weekly'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className="btn"
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: timeframe === tf ? 'var(--color-primary)' : 'transparent',
                  color: timeframe === tf ? '#fff' : 'var(--text-muted)',
                  fontSize: '13px',
                  textTransform: 'capitalize'
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Category drop down filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-control"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '180px', padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Standings List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Calculating candidate standings...</p>
        </div>
      ) : board.length === 0 ? (
        <div className="glass-card text-center" style={{ padding: '60px', textAlign: 'center', borderStyle: 'dashed' }}>
          <Trophy size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3>No Records Found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Be the first to complete a quiz in this category to set a record!
          </p>
        </div>
      ) : (
        <div>
          {board.map((student) => {
            const isTop3 = student.rank <= 3;
            
            return (
              <div key={student.userId} className="leaderboard-row">
                {/* Ranking Circle */}
                <div className={`leaderboard-rank ${
                  student.rank === 1 ? 'rank-1' :
                  student.rank === 2 ? 'rank-2' :
                  student.rank === 3 ? 'rank-3' : 'rank-normal'
                }`}>
                  {student.rank}
                </div>

                {/* Name & Email detail */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>{student.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{student.email}</div>
                </div>

                {/* Performance Aggs details */}
                <div className="leaderboard-stats">
                  
                  <div className="leaderboard-stat-item">
                    <div className="leaderboard-stat-lbl">Quizzes taken</div>
                    <div className="leaderboard-stat-val" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <CheckCircle size={14} style={{ color: 'var(--color-primary)' }} /> {student.quizzesCompleted}
                    </div>
                  </div>

                  <div className="leaderboard-stat-item">
                    <div className="leaderboard-stat-lbl">Average Score</div>
                    <div className="leaderboard-stat-val" style={{ color: 'var(--color-secondary)' }}>
                      {student.averageScore}%
                    </div>
                  </div>

                  <div className="leaderboard-stat-item">
                    <div className="leaderboard-stat-lbl">Best Score</div>
                    <div className="leaderboard-stat-val" style={{ color: 'var(--color-success)', fontSize: '16px' }}>
                      {student.highestScore}%
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Leaderboard;
