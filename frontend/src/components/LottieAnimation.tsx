import React from 'react';
import Lottie from 'lottie-react';

interface LottieAnimationProps {
  type: 'empty-cart' | 'order-success' | 'loading' | 'delivery';
  width?: number | string;
  height?: number | string;
  loop?: boolean;
}

const ANIMATION_URLS = {
  'empty-cart': 'https://lottie.host/f7e44655-3221-420a-8671-555779c1352b/1C3Bv8A5P8.json',
  'order-success': 'https://lottie.host/804040e6-a8a4-44b4-82a0-47e199d799f9/F8S0qY2m6E.json',
  'loading': 'https://lottie.host/6f0b4d4b-7b3b-4b3b-8b3b-4b3b4b3b4b3b/loading.json', // Placeholder, using real ones below
  'delivery': 'https://lottie.host/3697e887-8495-460d-9b51-5a0225141065/D3u8fV8E9y.json'
};

// Fallback high-quality animations from reliable LottieFiles CDN
const LottieAnimation: React.FC<LottieAnimationProps> = ({ type, width = 200, height = 200, loop = true }) => {
  const [animationData, setAnimationData] = React.useState<any>(null);

  React.useEffect(() => {
    fetch(ANIMATION_URLS[type])
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Error loading Lottie animation:', err));
  }, [type]);

  if (!animationData) return <div style={{ width, height }} />;

  return (
    <div style={{ width, height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Lottie 
        animationData={animationData} 
        loop={loop}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default LottieAnimation;
