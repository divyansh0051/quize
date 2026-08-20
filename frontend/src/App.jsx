import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import QuizDiscovery from './pages/QuizDiscovery.jsx';
import QuizDetails from './pages/QuizDetails.jsx';
import QuizAttempt from './pages/QuizAttempt.jsx';
import QuizResult from './pages/QuizResult.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import Leaderboard from './pages/Leaderboard.jsx';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard.jsx';
import UserManagement from './pages/UserManagement.jsx';
import CategoriesManagement from './pages/CategoriesManagement.jsx';
import QuizManagement from './pages/QuizManagement.jsx';
import QuestionList from './pages/QuestionList.jsx';

// Root gate component to route user to correct dashboard if logged in
const RootGate = () => {
  const token = localStorage.getItem('quiz_token');
  const userJson = localStorage.getItem('quiz_user');

  if (!token || !userJson) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userJson);
    return user.role === 'ADMIN' 
      ? <Navigate to="/admin/dashboard" replace /> 
      : <Navigate to="/quizzes" replace />;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        
        <Routes>
          {/* Public / Entry Routes */}
          <Route path="/" element={<RootGate />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Routes */}
          <Route 
            path="/quizzes" 
            element={
              <ProtectedRoute allowedRole="STUDENT">
                <QuizDiscovery />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/quizzes/:id" 
            element={
              <ProtectedRoute allowedRole="STUDENT">
                <QuizDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/quizzes/:id/attempt" 
            element={
              <ProtectedRoute allowedRole="STUDENT">
                <QuizAttempt />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/attempts/:id" 
            element={
              <ProtectedRoute allowedRole="STUDENT">
                <QuizResult />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRole="STUDENT">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leaderboard" 
            element={
              <ProtectedRoute allowedRole="STUDENT">
                <Leaderboard />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/categories" 
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <CategoriesManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/quizzes" 
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <QuizManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/quizzes/:quizId/questions" 
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <QuestionList />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
