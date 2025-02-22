import React, { useState } from 'react';
import axios from 'axios';

const ScraperPage = () => {
  const [roomUrl, setRoomUrl] = useState('');
  const [scrapeResult, setScrapeResult] = useState(null);
  const [bufferUrl, setBufferUrl] = useState('');
  const [addMsg, setAddMsg] = useState('');
  const [error, setError] = useState('');

  const handleScrape = async () => {
    setError('');
    setScrapeResult(null);
    if (!roomUrl.trim()) {
      setError('Please enter a room URL.');
      return;
    }
    try {
      const res = await axios.post('/api/scrape', { room_url: roomUrl });
      setScrapeResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error scraping the URL.');
    }
  };

  const handleAddStream = async () => {
    setError('');
    setAddMsg('');
    if (!bufferUrl.trim()) {
      setError('Please enter a buffer URL.');
      return;
    }
    if (!scrapeResult) {
      setError('No scraped data available.');
      return;
    }
    try {
      const payload = {
        room_url: scrapeResult.room_url,
        url: bufferUrl.trim(),
        platform: 'Chaturbate'
      };
      const res = await axios.post('/api/streams', payload);
      setAddMsg(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding stream.');
    }
  };

  return (
    <div className="scraper-page">
      <h2>Chaturbate Scraper</h2>
      <div className="scrape-form">
        <input
          type="text"
          placeholder="Enter Chaturbate room URL (e.g., https://chaturbate.com/caylin/)"
          value={roomUrl}
          onChange={(e) => setRoomUrl(e.target.value)}
        />
        <button onClick={handleScrape}>Scrape</button>
      </div>
      {error && <p className="error">{error}</p>}
      {scrapeResult && (
        <div className="scrape-result">
          <p><strong>Room URL:</strong> {scrapeResult.room_url}</p>
          <p><strong>Streamer Username:</strong> {scrapeResult.streamer_username}</p>
          <p><strong>Page Title:</strong> {scrapeResult.page_title}</p>
          <div className="buffer-form">
            <input
              type="text"
              placeholder="Enter Buffer URL (blob:...)"
              value={bufferUrl}
              onChange={(e) => setBufferUrl(e.target.value)}
            />
            <button onClick={handleAddStream}>Add Stream</button>
          </div>
          {addMsg && <p className="success">{addMsg}</p>}
        </div>
      )}
      <style jsx>{`
        .scraper-page {
          max-width: 600px;
          margin: 40px auto;
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          animation: fadeIn 0.5s ease-in-out;
        }
        .scrape-form, .buffer-form {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }
        input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        button {
          padding: 10px 20px;
          background: #007bff;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        button:hover {
          background: #0056b3;
        }
        .error {
          color: #d9534f;
          text-align: center;
        }
        .success {
          color: #28a745;
          text-align: center;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ScraperPage;

