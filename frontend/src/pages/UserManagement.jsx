import React, { useState, useEffect } from 'react';
import { Users, Search, Ban, CheckCircle, Trash2, X, Award, Eye, Calendar, Clock } from 'lucide-react';
import api from '../api/axios.js';

const UserManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  
  // Modal tracking state for viewing a specific student's attempt logs
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (studentId, currentIsActive) => {
    try {
      const targetState = !currentIsActive;
      await api.patch(`/admin/students/${studentId}/status`, { isActive: targetState });
      
      // Update local state list
      setStudents(students.map(s => s.id === studentId ? { ...s, isActive: targetState } : s));
    } catch (err) {
      console.error(err);
      alert('Failed to update student account status');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to permanently delete this student account? This will erase all their quiz attempts.')) {
      return;
    }

    try {
      await api.delete(`/admin/students/${studentId}`);
      setStudents(students.filter(s => s.id !== studentId));
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete student');
    }
  };

  // Pre-load student detailed exam attempts logs
  const handleViewHistory = async (student) => {
    setSelectedStudent(student);
    try {
      setModalLoading(true);
      const res = await api.get(`/admin/students/${student.id}/attempts`);
      setStudentHistory(res.data);
    } catch (err) {
      console.error(err);
      setStudentHistory([]);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchText.toLowerCase()) ||
    student.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="main-content">
      
      {/* Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px' }}>Student Profile Management</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Deactivate, delete, and evaluate attempts score history logs of registered students.
        </p>
      </div>

      {/* Control bar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
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

      {/* Grid listing / Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving student profiles...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px', borderStyle: 'dashed' }}>
          <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No students found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>No accounts matched your search terms.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{student.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{student.email}</div>
                    </td>
                    <td>
                      {student.isActive ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={10} /> Active
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Ban size={10} /> Blocked / Suspended
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleViewHistory(student)}
                          className="btn btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '12px' }}
                          title="View Exam Attempts History"
                        >
                          <Eye size={14} /> Profile & History
                        </button>
                        
                        <button
                          onClick={() => handleToggleStatus(student.id, student.isActive)}
                          className={student.isActive ? "btn btn-secondary" : "btn btn-success"}
                          style={{ padding: '8px 12px', fontSize: '12px' }}
                        >
                          {student.isActive ? (
                            <>
                              <Ban size={14} /> Suspend
                            </>
                          ) : (
                            <>
                              <CheckCircle size={14} /> Activate
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="btn btn-danger"
                          style={{ padding: '8px', display: 'flex' }}
                          title="Delete User permanently"
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

      {/* History attempts Modal wrapper */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '20px' }}>Student Profile Info</h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedStudent.name} • {selectedStudent.email}</span>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Submissions & Attempts Log
            </h4>

            {modalLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>Compiling profile attempts history...</p>
            ) : studentHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
                No exam attempts logged for this student yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '6px' }}>
                {studentHistory.map(att => (
                  <div key={att.id} style={{
                    background: 'var(--bg-glass)',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{att.quiz.title}</div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} /> {new Date(att.completedAt || att.startedAt).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {Math.floor(att.timeTaken / 60)}m {att.timeTaken % 60}s
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <Award size={16} /> {att.percentage}%
                      </div>
                      <span className={`badge ${att.status === 'PASSED' ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: '4px', fontSize: '9px' }}>
                        {att.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
              <button onClick={() => setSelectedStudent(null)} className="btn btn-secondary">
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
