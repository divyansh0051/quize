import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT Token from LocalStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('quiz_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept responses to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect if session expire
      localStorage.removeItem('quiz_token');
      localStorage.removeItem('quiz_user');
      window.dispatchEvent(new Event('auth_change')); // notify tabs/components
    }
    return Promise.reject(error);
  }
);

export default api;
