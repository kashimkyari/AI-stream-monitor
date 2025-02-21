import React from 'react';

const VideoPlayer = ({ streamUrl }) => {
  if (!streamUrl) {
    return <div>Please select a stream to view.</div>;
  }
  return (
    <div className="video-player">
      <video width="100%" height="auto" controls autoPlay>
        <source src={streamUrl} type="application/x-mpegURL" />
        Your browser does not support the video tag.
      </video>
      <style jsx>{`
        .video-player {
          margin-top: 20px;
          animation: fadeIn 0.5s ease-in-out;
        }
        video {
          max-width: 100%;
          border: 1px solid #ccc;
          border-radius: 8px;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;

