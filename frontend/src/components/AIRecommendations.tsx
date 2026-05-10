import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/ai-recommendations.css';
import FastImage from './FastImage';
import { getAIRecommendations, type RecommendedItem } from '../api/ai';
import { addToCart } from '../api/cart';
import { isLoggedIn } from '../api/auth';

const SkeletonCard: React.FC = () => (
  <div className="ai-rec-skeleton">
    <div className="ai-rec-skeleton-img" />
    <div className="ai-rec-skeleton-body">
      <div className="ai-rec-skeleton-line medium" />
      <div className="ai-rec-skeleton-line short" />
      <div className="ai-rec-skeleton-line medium" />
    </div>
  </div>
);

const AIRecommendations: React.FC = () => {
  const [items, setItems] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [contextLabel, setContextLabel] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 11) setContextLabel('Good morning picks ☀️');
    else if (hour < 15) setContextLabel('Lunch favourites 🍱');
    else if (hour < 18) setContextLabel('Afternoon snacks ☕');
    else setContextLabel('Dinner tonight 🌙');

    if (!isLoggedIn()) { setNotLoggedIn(true); setLoading(false); return; }

    getAIRecommendations()
      .then(res => setItems(res.recommendations.slice(0, 3)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.MouseEvent, item: RecommendedItem) => {
    e.preventDefault();
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    try {
      await addToCart(item.id, 1);
      setAddedItems(prev => new Set(prev).add(item.id));
      setTimeout(() => setAddedItems(prev => {
        const next = new Set(prev); next.delete(item.id); return next;
      }), 2000);
    } catch { /* silent */ }
  };

  const header = (
    <div className="ai-recs-header">
      <span className="ai-recs-badge">
        <span className="material-symbols-rounded">auto_awesome</span>
        AI Picks
      </span>
      <h2>Recommended For You</h2>
      <span className="ai-recs-subtitle">{contextLabel}</span>
    </div>
  );

  // Not logged in — show sign-in prompt
  if (!loading && notLoggedIn) return (
    <div className="ai-recs">
      {header}
      <div className="ai-recs-login-prompt">
        <span className="material-symbols-rounded">lock</span>
        <p>AI recommendations are only available after <a href="/login">signing in</a>.</p>
      </div>
    </div>
  );

  // Graceful error fallback — section stays visible
  if (!loading && error) return (
    <div className="ai-recs">
      {header}
      <p style={{ color: '#8b7d72', fontSize: '13px', marginTop: '4px' }}>
        AI recommendations are unavailable right now — try refreshing.
      </p>
    </div>
  );

  // Empty result fallback
  if (!loading && items.length === 0) return null;

  return (
    <div className="ai-recs">
      {header}
      <div className="ai-recs-grid">
        {loading
          ? [1, 2, 3].map(k => <SkeletonCard key={k} />)
          : items.map(item => (
            <Link to={`/menu/${item.id}`} key={item.id} className="ai-rec-card">
              <div className="ai-rec-img-wrap">
                <FastImage src={item.image} alt={item.name} />
                <div className="ai-rec-img-overlay" />
              </div>
              <div className="ai-rec-body">
                <div className="ai-rec-name">{item.name}</div>
                <div className="ai-rec-price">Rs. {item.price}</div>
                {item.reason && (
                  <div className="ai-rec-reason">
                    <span className="material-symbols-rounded">tips_and_updates</span>
                    {item.reason}
                  </div>
                )}
                <div className="ai-rec-footer">
                  <button
                    className={`ai-rec-add-btn ${addedItems.has(item.id) ? 'added' : ''}`}
                    onClick={e => handleAdd(e, item)}
                    aria-label={`Add ${item.name} to cart`}
                  >
                    <span className="material-symbols-rounded">
                      {addedItems.has(item.id) ? 'check' : 'add_shopping_cart'}
                    </span>
                    {addedItems.has(item.id) ? 'Added!' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
};

export default AIRecommendations;
