import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VideoPlayer from './VideoPlayer';

const AgentDashboard = () => {
  const [dashboardData, setDashboardData] = useState({ ongoing_streams: 0, assignments: [] });
  const [selectedStreamUrl, setSelectedStreamUrl] = useState(null);
  
  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/agent/dashboard');
      setDashboardData(res.data);
    } catch (error) {
      console.error('Error fetching agent dashboard data:', error);
    }
  };

  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/logs');
      setLogs(res.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
    const dashboardInterval = setInterval(fetchDashboard, 10000);
    fetchLogs();
    const logsInterval = setInterval(fetchLogs, 10000);
    return () => {
      clearInterval(dashboardInterval);
      clearInterval(logsInterval);
    };
  }, []);

  const filteredLogs = logs.filter((log) =>
    log.stream_url.toLowerCase().includes(filter.toLowerCase()) ||
    log.event_type.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="agent-dashboard">
      <h2>Agent Dashboard</h2>
      <div className="dashboard-section">
        <h3>My Streams</h3>
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
                <p>Stream {assignment.stream_id}</p>
              </div>
            </div>
          ))}
        </div>
        <h4>Stream Player</h4>
        <VideoPlayer streamUrl={selectedStreamUrl} />
      </div>
      <div className="logs-section">
        <h3>Logs</h3>
        <div className="filter-container">
          <input
            type="text"
            placeholder="Filter logs by stream URL or event type"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="loading">Loading logs...</div>
        ) : filteredLogs.length > 0 ? (
          <table className="logs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Timestamp</th>
                <th>Stream URL</th>
                <th>Event Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.stream_url}</td>
                  <td>{log.event_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No logs found.</p>
        )}
      </div>
      <style jsx>{`
        .agent-dashboard {
          max-width: 1000px;
          margin: 40px auto;
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .dashboard-section {
          margin-bottom: 40px;
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
        .filter-container {
          margin-bottom: 20px;
          text-align: right;
        }
        .filter-container input {
          padding: 8px 12px;
          width: 300px;
          border: 1px solid #ccc;
          border-radius: 4px;
          transition: border-color 0.3s ease;
        }
        .filter-container input:focus {
          border-color: #007bff;
          outline: none;
        }
        .loading {
          text-align: center;
          font-size: 18px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px;
          border: 1px solid #ddd;
          text-align: left;
        }
        th {
          background: #f8f8f8;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
      `}</style>
    </div>
  );
};

export default AgentDashboard;

