'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ClientNavigationBanner() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const handleClick = () => {
      setIsVisible(prev => !prev);
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  
  return (
    <>
      {isVisible && (
        <div className="navigation-banner" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => router.push('/comics')}
            className="back-button"
          >
            ← Back
          </button>
        </div>
      )}
    </>
  );
} 