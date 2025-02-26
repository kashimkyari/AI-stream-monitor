import React from 'react';
import { FaTachometerAlt, FaTasks, FaUserFriends, FaVideo, FaFlag, FaSearch, FaEye } from 'react-icons/fa';
import './NavBar.css';

const NavBar = ({ activeTab, setActiveTab, handleLogout }) => {
  return (
    <nav className="navbar">
      <div className="nav-logo">StreamMonitor AI</div>
      <ul className="nav-tabs">
        <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
          <FaTachometerAlt /> Dashboard
        </li>
        <li className={activeTab === 'assign' ? 'active' : ''} onClick={() => setActiveTab('assign')}>
          <FaTasks /> Assignments
        </li>
        <li className={activeTab === 'agents' ? 'active' : ''} onClick={() => setActiveTab('agents')}>
          <FaUserFriends /> Agents
        </li>
        <li className={activeTab === 'streams' ? 'active' : ''} onClick={() => setActiveTab('streams')}>
          <FaVideo /> Streams
        </li>
        <li className={activeTab === 'flag' ? 'active' : ''} onClick={() => setActiveTab('flag')}>
          <FaFlag /> Flag Settings
        </li>
        <li className={activeTab === 'scraper' ? 'active' : ''} onClick={() => setActiveTab('scraper')}>
          <FaSearch /> Scraper
        </li>
        <li className={activeTab === 'visual' ? 'active' : ''} onClick={() => setActiveTab('visual')}>
          <FaEye /> Visual Test
        </li>
      </ul>
      <div className="nav-logout">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default NavBar;
