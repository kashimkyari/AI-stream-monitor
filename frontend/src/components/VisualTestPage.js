import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const VisualTestPage = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
  const [detections, setDetections] = useState([]);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  // Handle file selection and set video URL for playback
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setVideoURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Capture current frame from video and send for detection
  const captureFrameAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const formData = new FormData();
      formData.append('frame', blob, 'frame.jpg');
      try {
        const res = await axios.post('/api/test/visual/frame', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setDetections(res.data.results);
      } catch (err) {
        console.error("Detection error:", err);
      }
    }, 'image/jpeg');
  };

  // Start capturing frames when video plays
  const startDetection = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(captureFrameAndDetect, 1000); // capture every second
  };

  // Stop capturing frames when video is paused or ended
  const stopDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (videoURL) URL.revokeObjectURL(videoURL);
    };
  }, [videoURL]);

  return (
    <div className="visual-test-page">
      <h2>Real-Time Visual Detection Test</h2>
      <div>
        <input type="file" accept="video/*" onChange={handleFileChange} />
      </div>
      {videoURL && (
        <div className="video-container">
          <video
            ref={videoRef}
            src={videoURL}
            controls
            onPlay={startDetection}
            onPause={stopDetection}
            onEnded={stopDetection}
            style={{ width: "100%" }}
          />
          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <div className="detections">
        <h3>Detection Results:</h3>
        {detections && detections.length > 0 ? (
          <ul>
            {detections.map((det, index) => (
              <li key={index}>
                <strong>Class:</strong> {det.class} | <strong>Confidence:</strong> {(det.confidence * 100).toFixed(2)}%
              </li>
            ))}
          </ul>
        ) : (
          <p>No detections yet...</p>
        )}
      </div>
      <style jsx>{`
        .visual-test-page {
          max-width: 600px;
          margin: 40px auto;
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .video-container {
          margin-top: 20px;
        }
        .detections {
          margin-top: 20px;
          background: #f8f8f8;
          padding: 10px;
          border-radius: 4px;
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

