import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VisualTestPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [galleryUrl, setGalleryUrl] = useState('');
  const [audioFlagsUrl, setAudioFlagsUrl] = useState('');
  const [thumbnails, setThumbnails] = useState([]);
  const [audioFlags, setAudioFlags] = useState({});
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a video file.');
      return;
    }
    setError('');
    const formData = new FormData();
    formData.append('video', selectedFile);
    try {
      const res = await axios.post('/api/test/visual/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setVideoUrl(res.data.video_url);
      setGalleryUrl(res.data.gallery_url);
      setAudioFlagsUrl(res.data.audio_flags_url);
      pollThumbnails(res.data.gallery_url);
      pollAudioFlags(res.data.audio_flags_url);
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading file.');
    }
  };

  const pollThumbnails = (galleryEndpoint) => {
    const intervalId = setInterval(async () => {
      try {
        const res = await axios.get(galleryEndpoint);
        setThumbnails(res.data.thumbnails);
      } catch (err) {
        console.error('Error polling thumbnails:', err);
      }
    }, 2000);
    return () => clearInterval(intervalId);
  };

  const pollAudioFlags = (audioEndpoint) => {
    const intervalId = setInterval(async () => {
      try {
        const res = await axios.get(audioEndpoint);
        setAudioFlags(res.data.audio_flags);
      } catch (err) {
        console.error('Error polling audio flags:', err);
      }
    }, 2000);
    return () => clearInterval(intervalId);
  };

  return (
    <div className="visual-test-page">
      <h2>Real-Time Visual & Audio Detection Test</h2>
      <p>
        Upload a video to see real-time object detection and transcription. The video will play normally below, and a gallery of unique detected objects (with video and real-world timestamps) will update dynamically. Any flagged audio keywords are also listed.
      </p>
      <div className="upload-form">
        <input type="file" accept="video/*" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload and Test</button>
      </div>
      {error && <p className="error">{error}</p>}
      {videoUrl && (
        <div className="video-player">
          <video width="640" height="360" controls>
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      {thumbnails.length > 0 && (
        <div className="gallery">
          <h3>Detected Objects Gallery</h3>
          <div className="thumbs">
            {thumbnails.map((thumb, index) => (
              <div key={index} className="thumb-item">
                <img src={thumb.thumb_url} alt={`${thumb.class} detected`} />
                <div className="thumb-info">
                  <p>{thumb.class}</p>
                  <p>Video: {thumb.video_timestamp.toFixed(2)} s</p>
                  <p>{thumb.realworld_timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {Object.keys(audioFlags).length > 0 && (
        <div className="audio-flags">
          <h3>Flagged Audio Transcriptions</h3>
          <ul>
            {Object.entries(audioFlags).map(([keyword, details], index) => (
              <li key={index}>
                <strong>{keyword}:</strong> "{details.phrase}" at {details.audio_timestamp.toFixed(2)} s ({details.realworld_timestamp})
              </li>
            ))}
          </ul>
        </div>
      )}
      <style jsx>{`
        .visual-test-page {
          max-width: 800px;
          margin: 40px auto;
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .upload-form {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          align-items: center;
        }
        input[type='file'] {
          flex: 1;
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
        .video-player {
          margin-top: 20px;
        }
        .gallery {
          margin-top: 20px;
        }
        .thumbs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .thumb-item {
          width: 120px;
          text-align: center;
        }
        .thumb-item img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .thumb-info {
          font-size: 10px;
          margin-top: 5px;
        }
        .audio-flags {
          margin-top: 20px;
          background: #f9f9f9;
          padding: 10px;
          border-radius: 4px;
        }
        .audio-flags ul {
          list-style-type: none;
          padding: 0;
        }
        .audio-flags li {
          margin: 5px 0;
          font-size: 12px;
        }
        .error {
          color: #d9534f;
          text-align: center;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default VisualTestPage;
