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
            className="py-2 px-4 bg-[#FFDD33] text-black font-medium rounded-full text-center transition-all duration-200 border-2 border-black hover:shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[-4px]"
          >
            ← Back
          </button>
        </div>
      )}
    </>
  );
}

// Componente per i controlli di navigazione
export function NavigationControls() {
  const router = useRouter();

  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 px-4 space-x-4">
      <button 
        onClick={() => router.back()}
        className="py-2 px-4 bg-[#FFDD33] text-black font-medium rounded-full text-center transition-all duration-200 border-2 border-black hover:shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[-4px]"
      >
        Back to Comics
      </button>
    </div>
  );
}

// Componente per la visualizzazione del messaggio di caricamento
export function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Loading comic...</h2>
        <p className="text-gray-600">Just a moment while we prepare your reading experience.</p>
      </div>
    </div>
  );
} 