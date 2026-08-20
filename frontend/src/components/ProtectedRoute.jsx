import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('quiz_token');
  const userJson = localStorage.getItem('quiz_user');
  
  if (!token || !userJson) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(userJson);
  } catch (e) {
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If Admin wants to go to Student routes or vice versa, redirect appropriately
    return user.role === 'ADMIN' 
      ? <Navigate to="/admin/dashboard" replace /> 
      : <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
