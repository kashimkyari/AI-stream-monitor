import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VideoPlayer from './VideoPlayer';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard data (assignments with details)
  const [dashboardData, setDashboardData] = useState({ ongoing_streams: 0, assignments: [] });
  const [selectedStreamUrl, setSelectedStreamUrl] = useState(null);

  // For assignment dropdowns
  const [agentList, setAgentList] = useState([]);
  const [streamList, setStreamList] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedStreamId, setSelectedStreamId] = useState('');

  // For Agents management
  const [agents, setAgents] = useState([]);
  const [newAgent, setNewAgent] = useState({ username: '', password: '' });
  const [agentMsg, setAgentMsg] = useState('');
  const [agentError, setAgentError] = useState('');
  
  // For Streams management
  const [streams, setStreams] = useState([]);
  const [newStream, setNewStream] = useState({ url: '' });
  const [streamMsg, setStreamMsg] = useState('');
  const [streamError, setStreamError] = useState('');
  
  // For Flag Settings (Chat Keywords)
  const [chatKeywords, setChatKeywords] = useState([]);
  const [newChatKeyword, setNewChatKeyword] = useState('');
  const [keywordMsg, setKeywordMsg] = useState('');
  const [keywordError, setKeywordError] = useState('');

  // For Flag Settings (Flagged Objects)
  const [flaggedObjects, setFlaggedObjects] = useState([]);
  const [newFlaggedObject, setNewFlaggedObject] = useState('');
  const [objectMsg, setObjectMsg] = useState('');
  const [objectError, setObjectError] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/dashboard');
      setDashboardData(res.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await axios.get('/api/agents');
      setAgents(res.data);
      setAgentList(res.data);
      if (res.data.length > 0 && !selectedAgentId) {
        setSelectedAgentId(res.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchStreams = async () => {
    try {
      const res = await axios.get('/api/streams');
      setStreams(res.data);
      setStreamList(res.data);
      if (res.data.length > 0 && !selectedStreamId) {
        setSelectedStreamId(res.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
    }
  };

  const fetchKeywords = async () => {
    try {
      const res = await axios.get('/api/keywords');
      setChatKeywords(res.data);
    } catch (error) {
      console.error('Error fetching keywords:', error);
    }
  };

  const fetchObjects = async () => {
    try {
      const res = await axios.get('/api/objects');
      setFlaggedObjects(res.data);
    } catch (error) {
      console.error('Error fetching objects:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedAgentId || !selectedStreamId) {
      alert('Both Agent and Stream must be selected.');
      return;
    }
    try {
      const res = await axios.post('/api/assign', { agent_id: selectedAgentId, stream_id: selectedStreamId });
      alert(res.data.message);
      fetchDashboard();
    } catch (err) {
      alert(err.response.data.message || 'Assignment failed.');
    }
  };

  const handleCreateAgent = async () => {
    setAgentError('');
    setAgentMsg('');
    if (!newAgent.username.trim() || !newAgent.password.trim()) {
      setAgentError('Username and password are required.');
      return;
    }
    try {
      const res = await axios.post('/api/agents', newAgent);
      setAgentMsg(res.data.message);
      setNewAgent({ username: '', password: '' });
      fetchAgents();
    } catch (error) {
      setAgentError(error.response?.data.message || 'Error creating agent.');
    }
  };

  const handleEditAgentName = async (agentId, currentName) => {
    const newUsername = prompt("Enter new username:", currentName);
    if (newUsername && newUsername.trim() !== currentName) {
      try {
        await axios.put(`/api/agents/${agentId}`, { username: newUsername });
        fetchAgents();
      } catch (error) {
        console.error('Error updating agent name:', error);
      }
    }
  };

  const handleEditAgentPassword = async (agentId) => {
    const newPassword = prompt("Enter new password:");
    if (newPassword && newPassword.trim()) {
      try {
        await axios.put(`/api/agents/${agentId}`, { password: newPassword });
        fetchAgents();
      } catch (error) {
        console.error('Error updating agent password:', error);
      }
    }
  };

  const handleDeleteAgent = async (agentId) => {
    try {
      await axios.delete(`/api/agents/${agentId}`);
      fetchAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const handleCreateStream = async () => {
    setStreamError('');
    setStreamMsg('');
    if (!newStream.url.trim()) {
      setStreamError('Stream URL is required.');
      return;
    }
    try {
      const res = await axios.post('/api/streams', newStream);
      setStreamMsg(res.data.message);
      setNewStream({ url: '' });
      fetchStreams();
    } catch (error) {
      setStreamError(error.response?.data.message || 'Error creating stream.');
    }
  };

  const handleEditStreamUrl = async (streamId, currentUrl) => {
    const newUrl = prompt("Enter new stream URL:", currentUrl);
    if (newUrl && newUrl.trim() !== currentUrl) {
      try {
        await axios.put(`/api/streams/${streamId}`, { url: newUrl });
        fetchStreams();
      } catch (error) {
        console.error('Error updating stream URL:', error);
      }
    }
  };

  const handleDeleteStream = async (streamId) => {
    try {
      await axios.delete(`/api/streams/${streamId}`);
      fetchStreams();
    } catch (error) {
      console.error('Error deleting stream:', error);
    }
  };

  const handleCreateKeyword = async () => {
    setKeywordError('');
    setKeywordMsg('');
    if (!newChatKeyword.trim()) {
      setKeywordError('Keyword is required.');
      return;
    }
    try {
      const res = await axios.post('/api/keywords', { keyword: newChatKeyword });
      setKeywordMsg(res.data.message);
      setNewChatKeyword('');
      fetchKeywords();
    } catch (error) {
      setKeywordError(error.response?.data.message || 'Error adding keyword.');
    }
  };

  const handleUpdateKeyword = async (keywordId, currentKeyword) => {
    const newKeyword = prompt("Enter new keyword:", currentKeyword);
    if (newKeyword && newKeyword.trim() !== currentKeyword) {
      try {
        await axios.put(`/api/keywords/${keywordId}`, { keyword: newKeyword });
        fetchKeywords();
      } catch (error) {
        console.error('Error updating keyword:', error);
      }
    }
  };

  const handleDeleteKeyword = async (keywordId) => {
    try {
      await axios.delete(`/api/keywords/${keywordId}`);
      fetchKeywords();
    } catch (error) {
      console.error('Error deleting keyword:', error);
    }
  };

  const handleCreateObject = async () => {
    setObjectError('');
    setObjectMsg('');
    if (!newFlaggedObject.trim()) {
      setObjectError('Object name is required.');
      return;
    }
    try {
      const res = await axios.post('/api/objects', { object_name: newFlaggedObject });
      setObjectMsg(res.data.message);
      setNewFlaggedObject('');
      fetchObjects();
    } catch (error) {
      setObjectError(error.response?.data.message || 'Error adding object.');
    }
  };

  const handleUpdateObject = async (objectId, currentName) => {
    const newName = prompt("Enter new object name:", currentName);
    if (newName && newName.trim() !== currentName) {
      try {
        await axios.put(`/api/objects/${objectId}`, { object_name: newName });
        fetchObjects();
      } catch (error) {
        console.error('Error updating object:', error);
      }
    }
  };

  const handleDeleteObject = async (objectId) => {
    try {
      await axios.delete(`/api/objects/${objectId}`);
      fetchObjects();
    } catch (error) {
      console.error('Error deleting object:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
      const interval = setInterval(fetchDashboard, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'agents') {
      fetchAgents();
    }
    if (activeTab === 'streams') {
      fetchStreams();
    }
    if (activeTab === 'assign') {
      fetchAgents();
      fetchStreams();
    }
    if (activeTab === 'flag') {
      fetchKeywords();
      fetchObjects();
    }
  }, [activeTab]);

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      <div className="tabs">
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>Dashboard</button>
        <button onClick={() => setActiveTab('assign')} className={activeTab === 'assign' ? 'active' : ''}>Assignments</button>
        <button onClick={() => setActiveTab('agents')} className={activeTab === 'agents' ? 'active' : ''}>Agents</button>
        <button onClick={() => setActiveTab('streams')} className={activeTab === 'streams' ? 'active' : ''}>Streams</button>
        <button onClick={() => setActiveTab('flag')} className={activeTab === 'flag' ? 'active' : ''}>Flag Settings</button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="tab-content">
          <h3>Dashboard</h3>
          <div className="dashboard-info">
            <p><strong>Ongoing Streams:</strong> {dashboardData.ongoing_streams}</p>
            <div className="assignment-grid">
              {dashboardData.assignments.map((assignment) => (
                <div key={assignment.assignment_id} className="assignment-card" onClick={() => setSelectedStreamUrl(assignment.stream_url)}>
                  <video
                    src={assignment.stream_url}
                    muted
                    loop
                    playsInline
                    width="150"
                    height="150"
                    style={{ borderRadius: "4px", objectFit: "cover" }}
                  />
                  <div className="assignment-details">
                    <p><strong>Stream:</strong> {assignment.stream_id}</p>
                    <p><strong>Agent:</strong> {assignment.agent_username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <h4>Stream Player</h4>
          <VideoPlayer streamUrl={selectedStreamUrl} />
        </div>
      )}

      {activeTab === 'assign' && (
        <div className="tab-content">
          <h3>Assign Stream</h3>
          <div className="form-container">
            <select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}>
              {agentList.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.username}</option>
              ))}
            </select>
            <select value={selectedStreamId} onChange={(e) => setSelectedStreamId(e.target.value)}>
              {streamList.map((stream) => (
                <option key={stream.id} value={stream.id}>ID: {stream.id} - {stream.url}</option>
              ))}
            </select>
            <button onClick={handleAssign}>Assign</button>
          </div>
        </div>
      )}

      {activeTab === 'agents' && (
        <div className="tab-content">
          <h3>Manage Agents</h3>
          <div className="form-container">
            <input
              type="text"
              placeholder="New Agent Username"
              value={newAgent.username}
              onChange={(e) => setNewAgent({ ...newAgent, username: e.target.value })}
            />
            <input
              type="password"
              placeholder="New Agent Password"
              value={newAgent.password}
              onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
            />
            <button onClick={handleCreateAgent}>Create Agent</button>
          </div>
          {agentError && <div className="error">{agentError}</div>}
          {agentMsg && <div className="message">{agentMsg}</div>}
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td>{agent.id}</td>
                  <td>{agent.username}</td>
                  <td>
                    <button onClick={() => handleEditAgentName(agent.id, agent.username)}>Edit Name</button>
                    <button onClick={() => handleEditAgentPassword(agent.id)}>Edit Password</button>
                    <button onClick={() => handleDeleteAgent(agent.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'streams' && (
        <div className="tab-content">
          <h3>Manage Streams</h3>
          <div className="form-container">
            <input
              type="text"
              placeholder="New Stream URL"
              value={newStream.url}
              onChange={(e) => setNewStream({ url: e.target.value })}
            />
            <button onClick={handleCreateStream}>Create Stream</button>
          </div>
          {streamError && <div className="error">{streamError}</div>}
          {streamMsg && <div className="message">{streamMsg}</div>}
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>URL</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {streams.map((stream) => (
                <tr key={stream.id}>
                  <td>{stream.id}</td>
                  <td>{stream.url}</td>
                  <td>
                    <button onClick={() => handleEditStreamUrl(stream.id, stream.url)}>Edit URL</button>
                    <button onClick={() => handleDeleteStream(stream.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'flag' && (
        <div className="tab-content">
          <h3>Flag Settings</h3>
          <div className="flag-section">
            <h4>Chat Keywords</h4>
            <div className="form-container">
              <input
                type="text"
                placeholder="New Keyword"
                value={newChatKeyword}
                onChange={(e) => setNewChatKeyword(e.target.value)}
              />
              <button onClick={handleCreateKeyword}>Add Keyword</button>
            </div>
            {keywordError && <div className="error">{keywordError}</div>}
            {keywordMsg && <div className="message">{keywordMsg}</div>}
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Keyword</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {chatKeywords.map((kw) => (
                  <tr key={kw.id}>
                    <td>{kw.id}</td>
                    <td>{kw.keyword}</td>
                    <td>
                      <button onClick={() => handleUpdateKeyword(kw.id, kw.keyword)}>Edit</button>
                      <button onClick={() => handleDeleteKeyword(kw.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flag-section">
            <h4>Flagged Objects</h4>
            <div className="form-container">
              <input
                type="text"
                placeholder="New Object Name"
                value={newFlaggedObject}
                onChange={(e) => setNewFlaggedObject(e.target.value)}
              />
              <button onClick={handleCreateObject}>Add Object</button>
            </div>
            {objectError && <div className="error">{objectError}</div>}
            {objectMsg && <div className="message">{objectMsg}</div>}
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Object Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {flaggedObjects.map((obj) => (
                  <tr key={obj.id}>
                    <td>{obj.id}</td>
                    <td>{obj.object_name}</td>
                    <td>
                      <button onClick={() => handleUpdateObject(obj.id, obj.object_name)}>Edit</button>
                      <button onClick={() => handleDeleteObject(obj.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-panel {
          max-width: 900px;
          margin: 40px auto;
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .tabs button {
          padding: 10px 20px;
          border: none;
          background: #eee;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        .tabs button.active, .tabs button:hover {
          background: #007bff;
          color: #fff;
        }
        .tab-content {
          margin-top: 20px;
        }
        .form-container {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 15px;
        }
        .form-container input, .form-container select {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          flex: 1;
          min-width: 150px;
        }
        .form-container button {
          padding: 10px 20px;
          background: #007bff;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        .form-container button:hover {
          background: #0056b3;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        table th, table td {
          padding: 12px;
          border: 1px solid #ddd;
          text-align: left;
        }
        .error {
          color: #d9534f;
          text-align: center;
          margin: 10px 0;
        }
        .message {
          color: #28a745;
          text-align: center;
          margin: 10px 0;
        }
        .dashboard-info {
          margin: 20px 0;
        }
        .assignment-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .assignment-card {
          width: 150px;
          cursor: pointer;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 5px;
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .assignment-card:hover {
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transform: scale(1.03);
        }
        .assignment-details {
          text-align: center;
          font-size: 12px;
          margin-top: 5px;
        }
        .flag-section {
          margin-bottom: 30px;
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;

