import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Play, ArrowLeft, AlertCircle, Award, BookOpen, RotateCcw } from 'lucide-react';
import api from '../api/axios.js';

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuizDetails();
  }, [id]);

  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes/${id}`);
      setQuiz(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load quiz details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    if (quiz.userAttemptsCount >= quiz.maxAttempts) {
      setError('You have already exhausted the maximum allowed attempts for this quiz.');
      return;
    }
    navigate(`/quizzes/${id}/attempt`);
  };

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving assessment metrics...</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="main-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <AlertCircle size={48} color="var(--color-danger)" style={{ marginBottom: '16px' }} />
          <h3>Error</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '24px' }}>{error}</p>
          <Link to="/quizzes" className="btn btn-secondary">
            <ArrowLeft size={16} /> Back to Quizzes
          </Link>
        </div>
      </div>
    );
  }

  const userAttemptsRemaining = Math.max(0, quiz.maxAttempts - quiz.userAttemptsCount);
  const isLimitReached = userAttemptsRemaining <= 0;

  return (
    <div className="main-content" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/quizzes" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
      </div>

      <div className="glass-card" style={{ padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <span className="badge badge-info" style={{ fontSize: '12px', padding: '6px 12px' }}>{quiz.category.name}</span>
          <span className={`badge ${
            quiz.difficulty === 'EASY' ? 'badge-success' :
            quiz.difficulty === 'INTERMEDIATE' ? 'badge-warning' : 'badge-danger'
          }`} style={{ fontSize: '12px', padding: '6px 12px' }}>{quiz.difficulty}</span>
        </div>

        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>{quiz.title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
          {quiz.description || 'No description provided for this quiz.'}
        </p>

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
            marginBottom: '24px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-2" style={{ gap: '20px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
            <Clock size={24} style={{ color: 'var(--color-primary)' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>DURATION LIMIT</div>
              <div style={{ fontWeight: '700', fontSize: '18px' }}>{quiz.duration} Minutes</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
            <BookOpen size={24} style={{ color: 'var(--color-secondary)' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TOTAL QUESTIONS</div>
              <div style={{ fontWeight: '700', fontSize: '18px' }}>{quiz._count?.questions || 0} MCQ Items</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
            <Award size={24} style={{ color: 'var(--color-success)' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PASSING CONDITION</div>
              <div style={{ fontWeight: '700', fontSize: '18px' }}>{quiz.passingScore}% Correct score</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
            <RotateCcw size={24} style={{ color: 'var(--color-warning)' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ATTEMPTS CONSUMED</div>
              <div style={{ fontWeight: '700', fontSize: '18px' }}>
                {quiz.userAttemptsCount} / {quiz.maxAttempts}
              </div>
            </div>
          </div>
        </div>

        <div style={{ 
          borderTop: '1px solid var(--border-glass)', 
          paddingTop: '32px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            {isLimitReached ? (
              <span className="badge badge-danger" style={{ padding: '8px 12px' }}>Attempts limit exhausted</span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                You have <strong>{userAttemptsRemaining}</strong> attempt(s) remaining.
              </span>
            )}
          </div>

          <button
            onClick={handleStartQuiz}
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '16px' }}
            disabled={isLimitReached}
          >
            <Play size={18} /> Start Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizDetails;
