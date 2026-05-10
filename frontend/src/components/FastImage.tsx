import React, { useState, useEffect } from 'react';
import '../css/fast-image.css';

interface FastImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

/**
 * FastImage - A high-performance image component for Web.
 * Mimics react-native-fast-image by caching images in the browser's Cache Storage.
 */
const FastImage: React.FC<FastImageProps> = ({ src, alt, className, ...props }) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      if (!src) return;

      try {
        const cache = await caches.open('ktm-bites-image-cache');
        const cachedResponse = await cache.match(src);

        if (cachedResponse) {
          // Found in cache!
          const blob = await cachedResponse.blob();
          if (isMounted) {
            setImgSrc(URL.createObjectURL(blob));
            setStatus('loaded');
          }
        } else {
          // Not in cache, fetch it manually to store it
          const response = await fetch(src, { mode: 'cors' });
          if (response.ok) {
            // Store a clone in cache
            cache.put(src, response.clone());
            
            const blob = await response.blob();
            if (isMounted) {
              setImgSrc(URL.createObjectURL(blob));
              setStatus('loaded');
            }
          } else {
            throw new Error('Fetch failed');
          }
        }
      } catch (err) {
        // Fallback to standard <img> loading if Cache API or Fetch fails (e.g. CORS issues)
        if (isMounted) {
          setImgSrc(src);
          // status will be set to 'loaded' by the <img> onLoad handler
        }
      }
    }

    loadImage();

    return () => {
      isMounted = false;
      // Clean up object URLs to prevent memory leaks
      if (imgSrc && imgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imgSrc);
      }
    };
  }, [src]);

  return (
    <div className={`fast-image-wrapper ${status} ${className || ''}`}>
      {status === 'loading' && <div className="fast-image-skeleton" />}
      <img
        src={imgSrc || src}
        alt={alt}
        className={`fast-image-el ${status}`}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        {...props}
      />
    </div>
  );
};

export default FastImage;
