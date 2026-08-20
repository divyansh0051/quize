import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, Clock, CheckCircle, XCircle, HelpCircle, ArrowLeft, ArrowUpRight } from 'lucide-react';
import api from '../api/axios.js';

const QuizResult = () => {
  const { id } = useParams(); // attemptId
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttemptDetails();
  }, [id]);

  const fetchAttemptDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attempts/${id}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve detailed results for this attempt.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    if (min === 0) return `${sec} seconds`;
    return `${min} min ${sec} sec`;
  };

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Compiling detailed review scorecard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="main-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <XCircle size={48} color="var(--color-danger)" style={{ marginBottom: '16px' }} />
          <h3>Error</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '24px' }}>{error}</p>
          <Link to="/quizzes" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { attempt, questions } = data;
  const isPassed = attempt.status === 'PASSED';

  return (
    <div className="main-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Return Button */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/quizzes" className="btn btn-secondary">
          <ArrowLeft size={16} /> Explore Quizzes
        </Link>
        <Link to="/dashboard" className="btn btn-secondary" style={{ gap: '4px' }}>
          My Dashboard <ArrowUpRight size={16} />
        </Link>
      </div>

      {/* Main Stats Block card */}
      <div className="glass-card" style={{
        textAlign: 'center',
        padding: '40px',
        marginBottom: '32px',
        borderTop: isPassed ? '4px solid var(--color-success)' : '4px solid var(--color-danger)'
      }}>
        <div style={{
          display: 'inline-flex',
          padding: '16px',
          borderRadius: '50%',
          background: isPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: isPassed ? 'var(--color-success)' : 'var(--color-danger)',
          marginBottom: '20px'
        }}>
          <Award size={48} />
        </div>

        <h1 style={{ fontSize: '32px' }}>{attempt.quizTitle}</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Attempt Review Scorecard</p>

        <div style={{ margin: '30px 0' }}>
          <div style={{ fontSize: '56px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: isPassed ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {attempt.percentage}%
          </div>
          <span className={`badge ${isPassed ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '13px', padding: '6px 16px', borderRadius: '30px', marginTop: '10px' }}>
            {attempt.status}
          </span>
        </div>

        {/* Aggregate details grids */}
        <div className="grid grid-4" style={{ gap: '16px', borderTop: '1px solid var(--border-glass)', paddingTop: '30px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Marks Obtained</div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>{attempt.score.toFixed(1)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Duration Taken</div>
            <div style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Clock size={16} /> {formatDuration(attempt.timeTaken)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Criteria Target</div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>{attempt.passingScore}%</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Attempt Date</div>
            <div style={{ fontSize: '15px', fontWeight: '700' }}>
              {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Responses ratio counts */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '24px',
          padding: '12px',
          background: 'var(--bg-glass)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={14} color="var(--color-success)" /> <strong>{attempt.correctAnswers}</strong> Correct
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <XCircle size={14} color="var(--color-danger)" /> <strong>{attempt.incorrectAnswers}</strong> Incorrect
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HelpCircle size={14} color="var(--text-muted)" /> <strong>{attempt.unanswered}</strong> Unanswered
          </span>
        </div>
      </div>

      {/* Review Answers list */}
      <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>Review Questions & Answers</h2>
      
      <div>
        {questions.map((q, idx) => {
          const isSkipped = q.selectedOptionId === null;
          const isCorrect = q.isCorrect;

          let statusText = 'Correct Answer';
          let borderColors = '1px solid var(--border-glass)';
          
          if (isSkipped) {
            statusText = 'Unanswered / Skipped';
          } else if (!isCorrect) {
            statusText = 'Incorrect Answer';
            borderColors = '1px solid rgba(239, 68, 68, 0.2)';
          } else {
            borderColors = '1px solid rgba(16, 185, 129, 0.2)';
          }

          return (
            <div key={q.id} className="glass-card" style={{ marginBottom: '24px', border: borderColors, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                  Question {idx + 1}
                </span>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`badge ${
                    isSkipped ? 'badge-warning' :
                    isCorrect ? 'badge-success' : 'badge-danger'
                  }`} style={{ fontSize: '11px' }}>
                    {statusText}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    [{q.marks} Mark]
                  </span>
                </div>
              </div>

              <h3 style={{ fontSize: '18px', marginBottom: '20px', lineHeight: '1.4' }}>
                {q.questionText}
              </h3>

              {/* Renders answer options */}
              <div style={{ marginBottom: '20px' }}>
                {q.options.map(opt => {
                  const isSelectedOption = q.selectedOptionId === opt.id;
                  const isCorrectOption = opt.isCorrect;

                  let optClass = 'question-option';
                  let icon = <div className="radio-circle"></div>;

                  if (isCorrectOption) {
                    optClass += ' correct';
                    icon = <CheckCircle size={18} color="var(--color-success)" style={{ flexShrink: 0 }} />;
                  } else if (isSelectedOption && !isCorrectOption) {
                    optClass += ' incorrect';
                    icon = <XCircle size={18} color="var(--color-danger)" style={{ flexShrink: 0 }} />;
                  }

                  if (isSelectedOption && isCorrectOption) {
                    optClass += ' selected';
                  }

                  return (
                    <div 
                      key={opt.id} 
                      className={optClass} 
                      style={{ 
                        cursor: 'default', 
                        opacity: (isSelectedOption || isCorrectOption) ? 1 : 0.6 
                      }}
                    >
                      {icon}
                      <span style={{ fontSize: '14px' }}>{opt.optionText}</span>
                      {isCorrectOption && (
                        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', color: 'var(--color-success)', textTransform: 'uppercase' }}>
                          Correct Key
                        </span>
                      )}
                      {isSelectedOption && !isCorrectOption && (
                        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', color: 'var(--color-danger)', textTransform: 'uppercase' }}>
                          Your Choice
                        </span>
                      )}
                      {isSelectedOption && isCorrectOption && (
                        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', color: 'var(--color-success)', textTransform: 'uppercase' }}>
                          Your Choice (Passed)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Renders explanation block */}
              {q.explanation && (
                <div style={{
                  padding: '16px',
                  background: 'var(--bg-glass)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--color-primary)',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Explanation:</strong>
                  <span style={{ color: 'var(--text-muted)' }}>{q.explanation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default QuizResult;
