import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle } from 'lucide-react';
import api from '../api/axios.js';

const QuizAttempt = () => {
  const { id } = useParams(); // quizId
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Quiz state
  const [attemptId, setAttemptId] = useState('');
  const [quizMetadata, setQuizMetadata] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Answers state: { [questionId]: selectedOptionId }
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  
  const timerRef = useRef(null);
  const quizStartedRef = useRef(false);

  useEffect(() => {
    // Prevent accidental page leave
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to exit the quiz? Your progress might be lost.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Start/Resume assessment
    startAssessment();

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(timerRef.current);
    };
  }, [id]);

  const startAssessment = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await api.post(`/attempts/quizzes/${id}/start`);
      const data = res.data;
      
      setAttemptId(data.attemptId);
      setQuizMetadata(data.quiz);
      setQuestions(data.questions);
      
      // Calculate initial timer
      const startTime = new Date(data.startedAt).getTime();
      const endTime = startTime + (data.quiz.duration * 60 * 1000);
      const initialRemaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(initialRemaining);
      
      // Load saved answers from localStorage if present
      const savedAnswers = localStorage.getItem(`quiz_answers_${data.attemptId}`);
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers));
      }

      setLoading(false);
      quizStartedRef.current = true;
    } catch (err) {
      console.error('Error starting quiz:", err');
      setError(err.response?.data?.error || 'Could not initialize quiz session');
      setLoading(false);
    }
  };

  // Timer Tick implementation
  useEffect(() => {
    if (timeLeft === null || loading) return;

    if (timeLeft <= 0) {
      clearInterval(timerRef.current);
      handleAutoSubmit();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, loading]);

  // Persist answers to local storage on changes
  const saveAnswer = (questionId, optionId) => {
    const updated = {
      ...answers,
      [questionId]: optionId
    };
    setAnswers(updated);
    localStorage.setItem(`quiz_answers_${attemptId}`, JSON.stringify(updated));
  };

  const handleSelectOption = (optionId) => {
    const currentQuestion = questions[currentIndex];
    saveAnswer(currentQuestion.id, optionId);
  };

  // Submission format transformer
  const prepareAnswersPayload = () => {
    return Object.keys(answers).map(qId => ({
      questionId: qId,
      selectedOptionId: answers[qId]
    }));
  };

  const submitQuiz = async (isAuto = false) => {
    if (!isAuto && !window.confirm('Are you sure you want to submit your answers?')) {
      return;
    }

    try {
      setLoading(true);
      const payload = {
        attemptId,
        answers: prepareAnswersPayload()
      };
      
      const res = await api.post(`/attempts/quizzes/${id}/submit`, payload);
      
      // Cleanup localStorage
      localStorage.removeItem(`quiz_answers_${attemptId}`);
      
      // Navigate to detailed result
      navigate(`/attempts/${attemptId}`);
    } catch (err) {
      console.error('Error submitting quiz answers:', err);
      alert('Error submitting quiz. Please try again.');
      setLoading(false);
    }
  };

  const handleAutoSubmit = () => {
    alert('Time has expired! Your quiz is being submitted automatically.');
    submitQuiz(true);
  };

  // Navigate Questions helper
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !quizMetadata) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Initializing quiz session space...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <AlertTriangle size={48} color="var(--color-danger)" style={{ marginBottom: '16px' }} />
          <h3>Access Denied</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '24px' }}>{error}</p>
          <button onClick={() => navigate('/quizzes')} className="btn btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  return (
    <div className="main-content">
      {/* Quiz Attempt Header with Timer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-card)',
        padding: '16px 24px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-glass)',
        marginBottom: '24px',
        position: 'sticky',
        top: '75px',
        zIndex: 90
      }}>
        <div>
          <h2 style={{ fontSize: '20px' }}>{quizMetadata.title}</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Attempt workspace • Candidate console
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: timeLeft < 60 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-glass)',
          border: timeLeft < 60 ? '1px solid var(--color-danger)' : '1px solid var(--border-glass)',
          padding: '8px 16px',
          borderRadius: '24px',
          color: timeLeft < 60 ? 'var(--color-danger)' : 'var(--text-main)',
          transition: 'var(--transition)'
        }}>
          <Clock size={16} />
          <span style={{ fontWeight: '800', fontFamily: 'var(--font-heading)', fontSize: '18px' }}>
            {timeLeft !== null ? formatTime(timeLeft) : 'Loading...'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) 280px', gap: '24px' }}>
        
        {/* Left Side: Question Pane */}
        <div>
          <div className="glass-card" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
              <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                QUESTION {currentIndex + 1} OF {questions.length}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Worth {currentQuestion.marks} Mark(s)
              </span>
            </div>

            <h3 style={{ fontSize: '20px', lineHeight: '1.5', fontWeight: '600', marginBottom: '24px' }}>
              {currentQuestion.questionText}
            </h3>

            {/* MCQ Options list */}
            <div style={{ flex: 1 }}>
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.id;
                return (
                  <div
                    key={opt.id}
                    className={`question-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(opt.id)}
                  >
                    <div className="radio-circle"></div>
                    <span style={{ fontSize: '15px' }}>{opt.optionText}</span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}>
              <button
                onClick={handlePrev}
                className="btn btn-secondary"
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="btn btn-secondary"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => submitQuiz(false)}
                  className="btn btn-success"
                  style={{ gap: '8px' }}
                >
                  <Send size={16} /> Finish Assessment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quiz Dashboard/Navigation */}
        <div>
          <div className="glass-card" style={{ position: 'sticky', top: '160px' }}>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Progress Tracker
            </h4>
            
            <div className="question-grid" style={{ marginBottom: '24px' }}>
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurr = idx === currentIndex;
                
                let btnClass = 'question-number-btn';
                if (isCurr) btnClass += ' current';
                if (isAnswered) btnClass += ' answered';

                return (
                  <button
                    key={q.id}
                    className={btnClass}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--color-primary)' }}></div>
                <span>Answered Questions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1px solid var(--color-primary)', background: 'rgba(99, 102, 241, 0.1)' }}></div>
                <span>Current Question</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)' }}></div>
                <span>Unattempted Questions</span>
              </div>
            </div>

            <button
              onClick={() => submitQuiz(false)}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '24px' }}
            >
              <Send size={16} /> Submit Answers
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuizAttempt;
