import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, CheckCircle, 
  HelpCircle, Trash, Award, ListPlus, ToggleLeft 
} from 'lucide-react';
import api from '../api/axios.js';

const QuestionList = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null); // null means create mode
  const [formData, setFormData] = useState({
    questionText: '',
    marks: 1.0,
    explanation: '',
    difficulty: 'INTERMEDIATE',
    options: [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false }
    ]
  });

  useEffect(() => {
    fetchQuizAndQuestions();
  }, [quizId]);

  const fetchQuizAndQuestions = async () => {
    try {
      setLoading(true);
      
      // Get parent Quiz details
      const quizRes = await api.get(`/quizzes/${quizId}`);
      setQuiz(quizRes.data);

      // Get quiz questions
      const questionRes = await api.get(`/quizzes/${quizId}/questions`);
      setQuestions(questionRes.data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve questions parameters.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    setFormData({
      questionText: '',
      marks: 1.0,
      explanation: '',
      difficulty: 'INTERMEDIATE',
      options: [
        { optionText: '', isCorrect: true }, // Default first correct
        { optionText: '', isCorrect: false }
      ]
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (q) => {
    setEditingQuestion(q);
    setFormData({
      questionText: q.questionText,
      marks: q.marks,
      explanation: q.explanation || '',
      difficulty: q.difficulty,
      options: q.options.map(opt => ({
        optionText: opt.optionText,
        isCorrect: opt.isCorrect
      }))
    });
    setError('');
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'marks' ? Number(value) : value
    }));
  };

  // Options dynamic inputs management
  const handleOptionTextChange = (index, value) => {
    const updatedOptions = [...formData.options];
    updatedOptions[index].optionText = value;
    setFormData(prev => ({ ...prev, options: updatedOptions }));
  };

  const handleOptionCorrectChange = (index) => {
    const updatedOptions = formData.options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === index // Radio behave
    }));
    setFormData(prev => ({ ...prev, options: updatedOptions }));
  };

  const handleAddOptionField = () => {
    if (formData.options.length >= 6) {
      alert('Maximum of 6 MCQ options allowed');
      return;
    }
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { optionText: '', isCorrect: false }]
    }));
  };

  const handleRemoveOptionField = (index) => {
    if (formData.options.length <= 2) {
      alert('A question must have at least 2 options');
      return;
    }
    const updatedOptions = formData.options.filter((_, idx) => idx !== index);
    
    // Ensure at least one is correct if we removed correct one
    const hasCorrect = updatedOptions.some(opt => opt.isCorrect);
    if (!hasCorrect && updatedOptions.length > 0) {
      updatedOptions[0].isCorrect = true;
    }

    setFormData(prev => ({ ...prev, options: updatedOptions }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.questionText.trim()) {
      setError('Question text is required');
      return;
    }

    const hasEmptyOption = formData.options.some(opt => !opt.optionText.trim());
    if (hasEmptyOption) {
      setError('All option labels must contain text');
      return;
    }

    const hasCorrect = formData.options.some(opt => opt.isCorrect);
    if (!hasCorrect) {
      setError('Please mark at least one option as the correct key answer');
      return;
    }

    try {
      setError('');
      if (editingQuestion) {
        // Edit Endpoint
        const res = await api.put(`/questions/${editingQuestion.id}`, formData);
        setQuestions(questions.map(q => q.id === editingQuestion.id ? res.data : q));
      } else {
        // Add Endpoint
        const res = await api.post(`/quizzes/${quizId}/questions`, formData);
        setQuestions([...questions, res.data]);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to sync question to database');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question permanently? Attempt statistics will be revised.')) {
      return;
    }

    try {
      await api.delete(`/questions/${qId}`);
      setQuestions(questions.filter(q => q.id !== qId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete question');
    }
  };

  if (loading && !quiz) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving question pool...</p>
      </div>
    );
  }

  return (
    <div className="main-content">
      
      {/* Return Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/admin/quizzes" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Quizzes
        </Link>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Quiz: <strong>{quiz?.title}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px' }}>Question Builder</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Build unique multiple choice questions, specify weights, and add explanation key reviews.
          </p>
        </div>

        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          <Plus size={18} /> Add New Question
        </button>
      </div>

      {error && !showModal && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: 'var(--color-danger)',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {/* Renders list of questions in feed format */}
      {questions.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px', borderStyle: 'dashed' }}>
          <HelpCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No Questions Created</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '20px' }}>Setup questions for your students to attempt.</p>
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            Add Question
          </button>
        </div>
      ) : (
        <div>
          {questions.map((q, index) => (
            <div key={q.id} className="glass-card" style={{ marginBottom: '24px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: '800', fontSize: '18px', color: 'var(--color-primary)' }}>
                    #{index + 1}
                  </span>
                  <span className={`badge ${
                    q.difficulty === 'EASY' ? 'badge-success' :
                    q.difficulty === 'INTERMEDIATE' ? 'badge-warning' : 'badge-danger'
                  }`}>{q.difficulty}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={10} /> Marks: {q.marks}
                  </span>

                  <button
                    onClick={() => handleOpenEditModal(q)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '11px', display: 'flex' }}
                  >
                    <Edit size={12} /> Edit
                  </button>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="btn btn-danger"
                    style={{ padding: '6px', display: 'flex' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '18px', marginBottom: '20px', lineHeight: '1.4', fontWeight: '600' }}>
                {q.questionText}
              </h3>

              {/* Renders answer options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {q.options.map(opt => (
                  <div 
                    key={opt.id} 
                    className={`question-option ${opt.isCorrect ? 'correct' : ''}`}
                    style={{ cursor: 'default', marginBottom: 0 }}
                  >
                    {opt.isCorrect ? (
                      <CheckCircle size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
                    ) : (
                      <div className="radio-circle" />
                    )}
                    <span style={{ fontSize: '14px' }}>{opt.optionText}</span>
                  </div>
                ))}
              </div>

              {/* Explanation block */}
              {q.explanation && (
                <div style={{
                  padding: '16px',
                  background: 'var(--bg-glass)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--color-primary)',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Explanation Insight:</strong>
                  <span style={{ color: 'var(--text-muted)' }}>{q.explanation}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Renders Form Modal for Adding/Editing Question */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', padding: '30px', maxWidth: '640px' }}>
            <h3 style={{ fontSize: '22px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '24px' }}>
              {editingQuestion ? 'Edit Question Entry' : 'Add MCQ Question'}
            </h3>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--color-danger)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                marginBottom: '20px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              
              <div className="form-group">
                <label className="form-label">Question Stem</label>
                <textarea
                  name="questionText"
                  className="form-control"
                  value={formData.questionText}
                  onChange={handleFormChange}
                  rows={3}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Marks Value</label>
                  <input
                    type="number"
                    name="marks"
                    className="form-control"
                    value={formData.marks}
                    onChange={handleFormChange}
                    min={0.1}
                    step={0.1}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Difficulty Tier</label>
                  <select
                    name="difficulty"
                    className="form-control"
                    value={formData.difficulty}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="EASY">Easy</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              {/* MCQ Options list Builder */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="form-label">Multiple-Choice Options</label>
                  <button 
                    type="button" 
                    onClick={handleAddOptionField} 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ListPlus size={12} /> Add option row
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {formData.options.map((opt, index) => (
                    <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      
                      {/* Check radio for correct key */}
                      <input
                        type="radio"
                        name="correct-option-radio"
                        checked={opt.isCorrect}
                        onChange={() => handleOptionCorrectChange(index)}
                        style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                        title="Mark as correct answer"
                      />

                      <input
                        type="text"
                        value={opt.optionText}
                        onChange={(e) => handleOptionTextChange(index, e.target.value)}
                        className="form-control"
                        style={{ padding: '10px 14px' }}
                        required
                      />

                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(index)}
                          className="btn btn-danger"
                          style={{ padding: '10px', display: 'flex' }}
                          title="Remove option row"
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Explanation Key (Review Mode)</label>
                <textarea
                  name="explanation"
                  className="form-control"
                  value={formData.explanation}
                  onChange={handleFormChange}
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Question
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuestionList;
