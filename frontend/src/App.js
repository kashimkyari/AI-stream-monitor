import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import AgentDashboard from './components/AgentDashboard';

function App() {
  const [role, setRole] = useState(null);

  const checkSession = async () => {
    try {
      const res = await axios.get('/api/session');
      if (res.data.logged_in) {
        setRole(res.data.user.role);
      }
    } catch (error) {
      console.log("No active session.");
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogin = (role) => {
    setRole(role);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setRole(null);
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  return (
    <div>
      {role && (
        <header style={{ padding: "10px", textAlign: "right", background: "#eee" }}>
          <button onClick={handleLogout}>Logout</button>
        </header>
      )}
      {!role && <Login onLogin={handleLogin} />}
      {role === 'admin' && <AdminPanel />}
      {role === 'agent' && <AgentDashboard />}
    </div>
  );
}

export default App;

