import React from 'react';
import '../css/skeleton.css';

interface SkeletonProps {
  type: 'card' | 'text' | 'circle' | 'profile-card' | 'banner';
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({ type, count = 1, className = "", style }) => {
  const items = Array.from({ length: count });

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`skeleton-card ${className}`} style={style}>
            <div className="skeleton-image shimmer" />
            <div className="skeleton-info">
              <div className="skeleton-title shimmer" />
              <div className="skeleton-text shimmer" />
              <div className="skeleton-button shimmer" />
            </div>
          </div>
        );
      case 'profile-card':
        return (
          <div className={`skeleton-profile-card ${className}`} style={style}>
            <div className="skeleton-header">
              <div className="skeleton-avatar shimmer" />
              <div className="skeleton-header-info">
                <div className="skeleton-title shimmer" />
                <div className="skeleton-text shimmer" />
              </div>
            </div>
            <div className="skeleton-divider" />
            <div className="skeleton-row shimmer" />
            <div className="skeleton-row shimmer" />
            <div className="skeleton-footer shimmer" />
          </div>
        );
      case 'text':
        return <div className={`skeleton-text-line shimmer ${className}`} style={style} />;
      case 'circle':
        return <div className={`skeleton-circle shimmer ${className}`} style={style} />;
      case 'banner':
        return <div className={`skeleton-banner shimmer ${className}`} style={style} />;
      default:
        return null;
    }
  };

  return (
    <div className="skeleton-container">
      {items.map((_, i) => (
        <React.Fragment key={i}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Skeleton;
