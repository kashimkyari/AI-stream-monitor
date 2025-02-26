import React from 'react';

const VideoPlayer = ({ room_url, streamer_username }) => {
  if (!room_url || !streamer_username) {
    return <div>Please select a stream to view.</div>;
  }
  // If the URL is from Chaturbate, render an embed iframe using the streamer's username.
  if (room_url.includes("chaturbate.com")) {
    const username = streamer_username;
    // Construct an embed URL following Chaturbate's embed style.
    const embedUrl = `https://chaturbate.com/in/?room=${username}`;
    return (
      <div className="video-player">
        <iframe 
          src={embedUrl}
          width="100%"
          height="480"
          style={{ border: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Chaturbate Stream"
        />
        <style jsx>{`
          .video-player {
            width: 100%;
            margin: 10px 0;
          }
        `}</style>
      </div>
    );
  }
  // Otherwise, use a standard video player.
  return (
    <div className="video-player">
      <video width="100%" height="auto" controls>
        <source src={room_url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <style jsx>{`
        .video-player {
          width: 100%;
          margin: 10px 0;
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;
