import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Edit, Trash2, Eye, EyeOff, ClipboardList, Clock, HelpCircle, Award } from 'lucide-react';
import api from '../api/axios.js';

const QuizManagement = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Modal visibility + details state
  const [showModal, setShowModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null); // null means create Mode
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    difficulty: 'EASY',
    duration: 30,
    maxAttempts: 3,
    passingScore: 50
  });

  useEffect(() => {
    fetchQuizzesAndCategories();
  }, []);

  const fetchQuizzesAndCategories = async () => {
    try {
      setLoading(true);
      const catRes = await api.get('/categories');
      setCategories(catRes.data);

      const quizRes = await api.get('/admin/quizzes');
      setQuizzes(quizRes.data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve assessment profiles list.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingQuiz(null);
    setFormData({
      title: '',
      description: '',
      categoryId: categories[0]?.id || '',
      difficulty: 'EASY',
      duration: 30,
      maxAttempts: 3,
      passingScore: 50
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      title: quiz.title,
      description: quiz.description || '',
      categoryId: quiz.categoryId,
      difficulty: quiz.difficulty,
      duration: quiz.duration,
      maxAttempts: quiz.maxAttempts,
      passingScore: quiz.passingScore
    });
    setError('');
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'maxAttempts' || name === 'passingScore'
        ? Number(value)
        : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryId) {
      setError('Please select a category first. Create one if none exist.');
      return;
    }

    try {
      setError('');
      if (editingQuiz) {
        // Edit Quiz
        const res = await api.put(`/quizzes/${editingQuiz.id}`, formData);
        setQuizzes(quizzes.map(q => q.id === editingQuiz.id ? res.data : q));
      } else {
        // Create Quiz
        const res = await api.post('/quizzes', formData);
        setQuizzes([...quizzes, res.data]);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save quiz information');
    }
  };

  const handleTogglePublish = async (quizId, currentPublishStatus) => {
    try {
      const targetState = !currentPublishStatus;
      const res = await api.patch(`/quizzes/${quizId}/publish`, { isPublished: targetState });
      
      // Update local state list
      setQuizzes(quizzes.map(q => q.id === quizId ? { ...q, isPublished: targetState } : q));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to toggle publication status');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to permanently delete this quiz? All nested questions and candidate attempts will be scrubbed.')) {
      return;
    }

    try {
      await api.delete(`/quizzes/${quizId}`);
      setQuizzes(quizzes.filter(q => q.id !== quizId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete quiz');
    }
  };

  return (
    <div className="main-content">
      
      {/* Title block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px' }}>Quizzes Management</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Build, publish, and maintain question pools for candidates.
          </p>
        </div>

        <button onClick={handleOpenCreateModal} className="btn btn-primary" style={{ padding: '12px 20px' }}>
          <Plus size={18} /> Create New Quiz
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

      {/* Main Quizzes list database logs */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving quizzes pools...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px', borderStyle: 'dashed' }}>
          <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No Quizzes Created</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '20px' }}>Set up your first exam by clicking above.</p>
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            Create Quiz
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Quiz Info</th>
                  <th>Category</th>
                  <th>Config Details</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.id}>
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{quiz.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                        {quiz.description || 'No description provided.'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{quiz.category.name}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {quiz.duration} min
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ClipboardList size={12} /> {quiz._count?.questions || 0} questions
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Award size={12} /> Target: {quiz.passingScore}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {quiz.isPublished ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={10} /> Live / Published
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <EyeOff size={10} /> Draft / Private
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        
                        <button
                          onClick={() => navigate(`/admin/quizzes/${quiz.id}/questions`)}
                          className="btn btn-primary"
                          style={{ padding: '8px 12px', fontSize: '12px' }}
                          title="Manage MCQ options and explanations"
                        >
                          <ClipboardList size={14} /> Questions
                        </button>

                        <button
                          onClick={() => handleTogglePublish(quiz.id, quiz.isPublished)}
                          className={quiz.isPublished ? "btn btn-secondary" : "btn btn-success"}
                          style={{ padding: '8px 12px', fontSize: '12px' }}
                          title={quiz.isPublished ? "Revoke quiz access" : "Publish quiz live"}
                        >
                          {quiz.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(quiz)}
                          className="btn btn-secondary"
                          style={{ padding: '8px', display: 'flex' }}
                          title="Edit Quiz properties"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="btn btn-danger"
                          style={{ padding: '8px', display: 'flex' }}
                          title="Delete quiz permanently"
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal for Creating/Editing properties */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', padding: '30px' }}>
            <h3 style={{ fontSize: '22px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '24px' }}>
              {editingQuiz ? 'Edit Quiz Parameters' : 'Create Assessment Environment'}
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
                <label className="form-label">Quiz Title</label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Quiz Topic Category</label>
                  <select
                    name="categoryId"
                    className="form-control"
                    value={formData.categoryId}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Duration (Mins)</label>
                  <input
                    type="number"
                    name="duration"
                    className="form-control"
                    value={formData.duration}
                    onChange={handleFormChange}
                    min={1}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Attempts</label>
                  <input
                    type="number"
                    name="maxAttempts"
                    className="form-control"
                    value={formData.maxAttempts}
                    onChange={handleFormChange}
                    min={1}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Passing Score (%)</label>
                  <input
                    type="number"
                    name="passingScore"
                    className="form-control"
                    value={formData.passingScore}
                    onChange={handleFormChange}
                    min={1}
                    max={100}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuizManagement;
