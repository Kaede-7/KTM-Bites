import React from 'react';
import '../css/loading.css';

interface LoadingAnimationProps {
  message?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ message = "Loading..." }) => {
  return (
    <div className="loading-container">
      <div className="loading-utensil"><span className="material-symbols-rounded">restaurant</span></div>
      <div className="loading-dots">
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingAnimation;
