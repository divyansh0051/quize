import React, { useState, useEffect } from 'react';
import { FolderHeart, Plus, Edit3, Trash2, X, Check } from 'lucide-react';
import api from '../api/axios.js';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [error, setError] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve topics list');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setError('');
      const res = await api.post('/categories', { name: newCatName.trim() });
      setCategories([...categories, res.data]);
      setNewCatName('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create category');
    }
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (catId) => {
    if (!editingName.trim()) return;

    try {
      setError('');
      const res = await api.put(`/categories/${catId}`, { name: editingName.trim() });
      setCategories(categories.map(c => c.id === catId ? res.data : c));
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to edit category');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Deleting this category will un-categorize associated quizzes. Are you sure you want to delete?')) {
      return;
    }

    try {
      setError('');
      await api.delete(`/categories/${catId}`);
      setCategories(categories.filter(c => c.id !== catId));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to delete category');
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px' }}>Categories Management</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Organize assessments topics by defining category schemas below.
        </p>
      </div>

      {error && (
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

      {/* Grid: Create Form on Left, List on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 2fr', gap: '30px' }}>
        
        {/* Left Side: Create form card */}
        <div>
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} style={{ color: 'var(--color-primary)' }} /> Add Category
            </h3>
            
            <form onSubmit={handleAddCategory}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Create Category
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Category records logs table */}
        <div>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Retrieving categories lists...</p>
            ) : categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No categories defined. Use the creation card to start.
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Topic Name</th>
                      <th>Quizzes Count</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => {
                      const isEditing = editingId === cat.id;
                      
                      return (
                        <tr key={cat.id}>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="form-control"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                style={{ padding: '8px 12px' }}
                              />
                            ) : (
                              <div style={{ fontWeight: '700', fontSize: '15px' }}>{cat.name}</div>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {cat._count?.quizzes || 0}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(cat.id)}
                                    className="btn btn-success"
                                    style={{ padding: '6px 10px', fontSize: '11px', display: 'flex' }}
                                    title="Save modification"
                                  >
                                    <Check size={12} /> Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="btn btn-secondary"
                                    style={{ padding: '6px 10px', fontSize: '11px', display: 'flex' }}
                                  >
                                    <X size={12} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(cat)}
                                    className="btn btn-secondary"
                                    style={{ padding: '6px 10px', fontSize: '11px', display: 'flex' }}
                                  >
                                    <Edit3 size={12} /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="btn btn-danger"
                                    style={{ padding: '6px', display: 'flex' }}
                                    disabled={cat._count?.quizzes > 0}
                                    title={cat._count?.quizzes > 0 ? "Cannot delete category containing quizzes" : "Delete category"}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default CategoriesManagement;
