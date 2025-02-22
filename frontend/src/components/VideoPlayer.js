import React from 'react';

const VideoPlayer = ({ room_url, streamer_username }) => {
  if (!room_url || !streamer_username) {
    return <div>Please select a stream to view.</div>;
  }
  // Build embed URL dynamically using the streamer name.
  const embedUrl = `https://cbxyz.com/in/?tour=SHBY&campaign=GoTLr&track=embed&room=${streamer_username}`;
  
  return (
    <div className="video-player">
      <iframe
        src={embedUrl}
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="Livestream Preview"
      />
      <style jsx>{`
        .video-player {
          width: 100%;
          height: 0;
          padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
          position: relative;
          margin-top: 20px;
          animation: fadeIn 0.5s ease-in-out;
        }
        .video-player iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
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

