import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Both fields are required!');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/login', { username, password });
      onLogin(res.data.role);
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Welcome Back</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <style jsx>{`
        .login-container {
          max-width: 400px;
          margin: 80px auto;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border-radius: 8px;
          background-color: #ffffff;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .login-container:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        }
        .login-form h2 {
          text-align: center;
          margin-bottom: 20px;
          font-family: 'Arial', sans-serif;
          color: #333;
        }
        .form-group {
          margin-bottom: 15px;
          display: flex;
          flex-direction: column;
        }
        .form-group label {
          margin-bottom: 5px;
          font-weight: 600;
          color: #555;
        }
        .form-group input {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .form-group input:focus {
          border-color: #007bff;
          box-shadow: 0 0 5px rgba(0,123,255,0.5);
          outline: none;
        }
        .error-message {
          color: #d9534f;
          text-align: center;
          margin-bottom: 10px;
        }
        .login-button {
          width: 100%;
          padding: 10px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .login-button:disabled {
          background-color: #aaa;
          cursor: not-allowed;
        }
        .login-button:hover:not(:disabled) {
          background-color: #0056b3;
        }
      `}</style>
    </div>
  );
};

export default Login;

