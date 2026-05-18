import React from 'react';
import Lottie from 'lottie-react';
import '../css/lottie-fallback.css';

interface LottieAnimationProps {
  type: 'empty-cart' | 'order-success' | 'loading' | 'delivery';
  width?: number | string;
  height?: number | string;
  loop?: boolean;
}

const ANIMATION_URLS = {
  'empty-cart': 'https://lottie.host/f7e44655-3221-420a-8671-555779c1352b/1C3Bv8A5P8.json',
  'order-success': 'https://lottie.host/804040e6-a8a4-44b4-82a0-47e199d799f9/F8S0qY2m6E.json',
  'loading': 'https://lottie.host/6f0b4d4b-7b3b-4b3b-8b3b-4b3b4b3b4b3b/loading.json',
  'delivery': 'https://lottie.host/3697e887-8495-460d-9b51-5a0225141065/D3u8fV8E9y.json'
};

const LottieAnimation: React.FC<LottieAnimationProps> = ({ type, width = 200, height = 200, loop = true }) => {
  const [animationData, setAnimationData] = React.useState<any>(null);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setHasError(false);
    setAnimationData(null);

    fetch(ANIMATION_URLS[type])
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new TypeError("Received non-JSON content. Safe-aborting parse to prevent SyntaxError.");
        }
        return res.json();
      })
      .then(data => {
        if (active) {
          setAnimationData(data);
        }
      })
      .catch(err => {
        if (active) {
          console.warn(`Lottie '${type}' failed to load from remote CDN. Using premium CSS fallback.`, err.message);
          setHasError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [type]);

  const renderFallback = () => {
    switch (type) {
      case 'empty-cart':
        return (
          <div className="lottie-fallback-empty-cart">
            <div className="lottie-empty-cart-glow" />
            <span className="lottie-empty-cart-item pizza">🍕</span>
            <span className="lottie-empty-cart-item burger">🍔</span>
            <span className="lottie-empty-cart-item cookie">🍪</span>
            <span className="lottie-empty-cart-item donut">🍩</span>
            <svg className="lottie-empty-cart-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        );
      case 'order-success':
        return (
          <div className="lottie-fallback-success">
            <div className="lottie-success-ring">
              <svg className="lottie-success-checkmark" viewBox="0 0 52 52">
                <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <div className="lottie-success-confetti c1" />
            <div className="lottie-success-confetti c2" />
            <div className="lottie-success-confetti c3" />
            <div className="lottie-success-confetti c4" />
            <div className="lottie-success-confetti c5" />
            <div className="lottie-success-confetti c6" />
          </div>
        );
      case 'loading':
        return (
          <div className="lottie-fallback-loading">
            <div className="lottie-loader-spinner">
              <div className="lottie-loader-inner">🍴</div>
            </div>
          </div>
        );
      case 'delivery':
        return (
          <div className="lottie-fallback-delivery">
            <div className="lottie-delivery-speed-line l1" />
            <div className="lottie-delivery-speed-line l2" />
            <div className="lottie-delivery-speed-line l3" />
            <div className="lottie-delivery-wrapper">
              <svg className="lottie-delivery-scooter" viewBox="0 0 100 80" fill="none">
                <path d="M20 50h25c3 0 5-2 6-5l4-12c1-3 3-5 6-5h10c3 0 5 2 5 5v15c0 3-2 5-5 5H45" stroke="#f28b46" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M68 33l5-15h-8" stroke="#f28b46" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="15" y="28" width="22" height="22" rx="4" fill="#f28b46" />
                <path d="M26 28v22M15 39h22" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="65" cy="18" r="2" fill="#2a2420" />
                <path d="M38 43c0-3 2-5 5-5h12c3 0 5 2 5 5v2H38v-2z" fill="#2a2420" />
                <g className="lottie-delivery-wheel" style={{ transformOrigin: '28px 62px' }}>
                  <circle cx="28" cy="62" r="10" fill="#2a2420" />
                  <circle cx="28" cy="62" r="5" fill="#d2c7bf" />
                  <line x1="28" y1="52" x2="28" y2="72" stroke="#2a2420" strokeWidth="2" />
                  <line x1="18" y1="62" x2="38" y2="62" stroke="#2a2420" strokeWidth="2" />
                </g>
                <g className="lottie-delivery-wheel" style={{ transformOrigin: '72px 62px' }}>
                  <circle cx="72" cy="62" r="10" fill="#2a2420" />
                  <circle cx="72" cy="62" r="5" fill="#d2c7bf" />
                  <line x1="72" y1="52" x2="72" y2="72" stroke="#2a2420" strokeWidth="2" />
                  <line x1="62" y1="62" x2="82" y2="62" stroke="#2a2420" strokeWidth="2" />
                </g>
              </svg>
              <div className="lottie-delivery-cloud s1" />
              <div className="lottie-delivery-cloud s2" />
            </div>
            <div className="lottie-delivery-road" />
          </div>
        );
      default:
        return null;
    }
  };

  const containerStyle = {
    width,
    height,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  if (hasError) {
    return (
      <div className="lottie-fallback-container" style={containerStyle}>
        {renderFallback()}
      </div>
    );
  }

  if (!animationData) {
    return <div style={containerStyle} />;
  }

  return (
    <div style={containerStyle}>
      <Lottie 
        animationData={animationData} 
        loop={loop}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default LottieAnimation;

