import React from 'react';
import logoAnimation from '../assets/logo_animation.mp4';
import '../css/loading.css';

interface LoadingAnimationProps {
  message?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ message = "Loading..." }) => {
  return (
    <div className="loading-animation-container">
      <video
        src={logoAnimation}
        autoPlay
        loop
        muted
        playsInline
        className="loading-video"
      />
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingAnimation;
