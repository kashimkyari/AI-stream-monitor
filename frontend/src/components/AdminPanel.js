import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VideoPlayer from './VideoPlayer';
import ScraperPage from './ScraperPage';
import VisualTestPage from './VisualTestPage';

const AdminPanel = ({ activeTab }) => {
  const [dashboardData, setDashboardData] = useState({ ongoing_streams: 0, streams: [] });
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // (Agent, stream, keyword, and flagged object management functions are assumed to be implemented similarly as before.)
  // For brevity, only the dashboard and tab rendering are shown.

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/dashboard');
      setDashboardData(res.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
      const interval = setInterval(fetchDashboard, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const closeModal = () => setSelectedAssignment(null);

  return (
    <div className="admin-panel-content">
      {activeTab === 'dashboard' && (
        <div className="tab-content">
          <h3>Dashboard</h3>
          <div className="dashboard-info">
            <p><strong>Ongoing Streams:</strong> {dashboardData.ongoing_streams}</p>
            <div className="assignment-grid">
              {dashboardData.streams.map((stream) => (
                <div key={stream.stream_id} className="assignment-card" onClick={() => setSelectedAssignment(stream)}>
                  <VideoPlayer room_url={stream.room_url} streamer_username={stream.streamer_username} />
                  <div className="assignment-details">
                    <p><strong>Stream:</strong> {stream.stream_id}</p>
                    <p><strong>Agent:</strong> {stream.agent_username}</p>
                    <p><strong>Streamer:</strong> {stream.streamer_username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'assign' && (
        <div className="tab-content">
          <h3>Assign Stream</h3>
          {/* Assignment form goes here */}
        </div>
      )}
      {activeTab === 'agents' && (
        <div className="tab-content">
          <h3>Manage Agents</h3>
          {/* Agent management form and table go here */}
        </div>
      )}
      {activeTab === 'streams' && (
        <div className="tab-content">
          <h3>Manage Streams</h3>
          {/* Stream management form and table go here */}
        </div>
      )}
      {activeTab === 'flag' && (
        <div className="tab-content">
          <h3>Flag Settings</h3>
          {/* Flag settings forms go here */}
        </div>
      )}
      {activeTab === 'scraper' && (
        <div className="tab-content">
          <h3>Scraper</h3>
          <ScraperPage />
        </div>
      )}
      {activeTab === 'visual' && (
        <div className="tab-content">
          <h3>Visual Test</h3>
          <VisualTestPage />
        </div>
      )}
      {selectedAssignment && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeModal}>X</button>
            <h3>Stream Details</h3>
            <p><strong>Stream ID:</strong> {selectedAssignment.stream_id}</p>
            <p><strong>Agent:</strong> {selectedAssignment.agent_username}</p>
            <p><strong>Platform:</strong> {selectedAssignment.platform || 'Chaturbate'}</p>
            <p><strong>Streamer:</strong> {selectedAssignment.streamer_username}</p>
            <VideoPlayer room_url={selectedAssignment.room_url} streamer_username={selectedAssignment.streamer_username} />
          </div>
        </div>
      )}
      <style jsx>{`
        .admin-panel-content {
          padding: 20px;
          margin-top: 70px;
        }
        .tab-content {
          margin-bottom: 40px;
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
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          position: relative;
          animation: zoomIn 0.3s ease;
        }
        @keyframes zoomIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .close-button {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #007bff;
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          cursor: pointer;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
