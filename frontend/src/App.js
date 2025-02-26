import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from './components/NavBar';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import AgentDashboard from './components/AgentDashboard';

function App() {
  const [role, setRole] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

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
      {role ? (
        <>
          <NavBar activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} />
          <div style={{ paddingTop: "70px" }}>
            {role === 'admin' && <AdminPanel activeTab={activeTab} />}
            {role === 'agent' && <AgentDashboard />}
          </div>
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
