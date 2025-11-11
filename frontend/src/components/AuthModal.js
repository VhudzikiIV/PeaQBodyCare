import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const AuthModal = ({ setShowAuth, setUser, setMessage }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [authData, setAuthData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleAuthInput = (e) => {
    setAuthData({
      ...authData,
      [e.target.name]: e.target.value
    });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const response = await axios.post(`${API_BASE}${endpoint}`, authData);
      
      setMessage(response.data.message);
      
      if (isLogin) {
        setUser(response.data.user);
        setShowAuth(false);
      } else {
        setIsLogin(true);
        setAuthData({ firstName: '', lastName: '', email: '', password: '' });
        setMessage('Registration successful! Please login.');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAuthData({
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    });
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="auth-modal">
      <div className="auth-overlay" onClick={() => setShowAuth(false)}></div>
      <div className="auth-content">
        <button className="close-btn" onClick={() => setShowAuth(false)}>×</button>
        
        {/* Logo Section */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🌸</div>
          <div className="auth-logo-text">
            <h2>PeaQ Body Care</h2>
            <p>Feel fabulous</p>
          </div>
        </div>

        {/* Form Header */}
        <div className="auth-header">
          <h3>{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
          <p>{isLogin ? 'Sign in to your account' : 'Join our fragrance family'}</p>
        </div>

        <form onSubmit={handleAuthSubmit} className="auth-form">
          {!isLogin && (
            <div className="name-fields">
              <div className="form-group">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={authData.firstName}
                  onChange={handleAuthInput}
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={authData.lastName}
                  onChange={handleAuthInput}
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>
          )}
          
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={authData.email}
              onChange={handleAuthInput}
              required
              disabled={loading}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={authData.password}
              onChange={handleAuthInput}
              required
              disabled={loading}
              className="form-input"
              minLength="6"
            />
          </div>

          {!isLogin && (
            <div className="password-requirements">
              <p>Password must be at least 6 characters long</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className={`auth-submit-btn ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
            {!loading && (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              className="auth-switch-btn" 
              onClick={switchMode}
              disabled={loading}
              type="button"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
          
          {isLogin && (
            <div className="auth-features">
              <div className="feature-item">
                <span className="feature-icon">🛒</span>
                <span>Fast checkout</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">❤️</span>
                <span>Save favorites</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📧</span>
                <span>Order updates</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;