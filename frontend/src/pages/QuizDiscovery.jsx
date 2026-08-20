import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, BookOpen, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../api/axios.js';

const QuizDiscovery = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  useEffect(() => {
    fetchFiltersAndQuizzes();
  }, []);

  const fetchFiltersAndQuizzes = async () => {
    try {
      setLoading(true);
      // Fetch categories
      const catRes = await api.get('/categories');
      setCategories(catRes.data);

      // Fetch all published quizzes
      const quizRes = await api.get('/quizzes');
      setQuizzes(quizRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAndFilter = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const params = {};
      if (searchText) params.title = searchText;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;

      const res = await api.get('/quizzes', { params });
      setQuizzes(res.data);
    } catch (err) {
      console.error('Error filtering quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset all filters
  const handleReset = async () => {
    setSearchText('');
    setSelectedCategory('');
    setSelectedDifficulty('');
    try {
      setLoading(true);
      const res = await api.get('/quizzes');
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Run search when selection changes
  useEffect(() => {
    handleSearchAndFilter();
  }, [selectedCategory, selectedDifficulty]);

  return (
    <div className="main-content">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px' }}>Discover Quizzes</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Test your skills across various topics and difficulty levels.
        </p>
      </div>

      {/* Filter panel */}
      <form onSubmit={handleSearchAndFilter} className="glass-card" style={{ marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="form-label">Search Quizzes</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="form-label">Topic / Category</label>
          <select
            className="form-control"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="form-label">Difficulty</label>
          <select
            className="form-control"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            Search
          </button>
          <button type="button" onClick={handleReset} className="btn btn-secondary" style={{ padding: '12px 16px' }}>
            Reset
          </button>
        </div>
      </form>

      {/* Quizzes List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Searching available assessments...</div>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px', borderStyle: 'dashed' }}>
          <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16.px' }} />
          <h3>No Quizzes Found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Try resetting or modifying your search parameters.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <span className="badge badge-info">{quiz.category.name}</span>
                  <span className={`badge ${
                    quiz.difficulty === 'EASY' ? 'badge-success' :
                    quiz.difficulty === 'INTERMEDIATE' ? 'badge-warning' : 'badge-danger'
                  }`}>{quiz.difficulty}</span>
                </div>

                <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>{quiz.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {quiz.description || 'No description provided for this quiz.'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> {quiz.duration} mins
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <BookOpen size={14} /> {quiz._count?.questions || 0} questions
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={14} /> Pass: {quiz.passingScore}%
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/quizzes/${quiz.id}`)}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  View Details <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizDiscovery;
