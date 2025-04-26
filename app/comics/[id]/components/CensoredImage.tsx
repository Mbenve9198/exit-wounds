'use client';

import { useState, useEffect } from 'react';
import { CensorInfo } from '@/lib/models/Comic';

interface CensoredImageProps {
  imageUrl: string;
  censors: CensorInfo[];
  altText: string;
  comicTitle?: string;
}

export function CensoredImage({ imageUrl, censors, altText, comicTitle }: CensoredImageProps) {
  // Stato per tenere traccia delle censure sbloccate
  const [unlockedCensors, setUnlockedCensors] = useState<{[key: string]: boolean}>({});
  // Stato per l'avviso iniziale
  const [showInitialWarning, setShowInitialWarning] = useState(false);
  // Stato per tracciare se questa immagine è stata visitata
  const [hasVisited, setHasVisited] = useState(false);
  
  // Prefisso per lo storage key basato sul titolo del fumetto o URL dell'immagine
  const storageKeyPrefix = comicTitle || imageUrl;
  const storageKey = `unlocked-censors-${storageKeyPrefix}`;
  const visitedKey = `visited-censored-${storageKeyPrefix}`;
  
  // Carica lo stato di sblocco e visita precedente dal localStorage al montaggio del componente
  useEffect(() => {
    try {
      // Carica stato di sblocco
      const savedUnlocks = localStorage.getItem(storageKey);
      if (savedUnlocks) {
        setUnlockedCensors(JSON.parse(savedUnlocks));
      }
      
      // Carica stato di visita
      const visited = localStorage.getItem(visitedKey);
      if (!visited) {
        // Se è la prima visita, mostra l'avviso
        setShowInitialWarning(true);
        // Imposta questa pagina come visitata
        localStorage.setItem(visitedKey, 'true');
      }
      
      setHasVisited(!!visited);
    } catch (error) {
      console.error('Error retrieving saved state:', error);
    }
  }, [storageKey, visitedKey]);
  
  // Salva lo stato di sblocco nel localStorage quando cambia
  useEffect(() => {
    if (Object.keys(unlockedCensors).length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(unlockedCensors));
      } catch (error) {
        console.error('Error saving unlock state:', error);
      }
    }
  }, [unlockedCensors, storageKey]);
  
  // Funzione per sbloccare una censura specifica
  const unlockCensor = (censorId: string) => {
    // In realtà sbloccheremo tutte le censure
    unlockAllCensors();
  };
  
  // Funzione per sbloccare tutte le censure
  const unlockAllCensors = () => {
    if (confirm("Oh dear, you've stumbled upon some censored content. Are you sure you want to unlock ALL of this potentially traumatizing material? I mean, it's your eyes, not mine... 👀")) {
      const allUnlocked = censors.reduce((acc, censor) => {
        acc[censor.id] = true;
        return acc;
      }, {} as {[key: string]: boolean});
      
      setUnlockedCensors(allUnlocked);
    }
  };
  
  // Funzione per reimpostare tutte le censure
  const resetAllCensors = () => {
    if (confirm("Want to re-traumatize yourself by putting the censors back? Go ahead, we all make questionable decisions sometimes...")) {
      setUnlockedCensors({});
      localStorage.removeItem(storageKey);
    }
  };
  
  // Verifica se ci sono censure ancora attive (non sbloccate)
  const hasActiveCensors = censors.some(censor => !unlockedCensors[censor.id]);
  
  return (
    <div className="relative w-full">
      {/* Immagine di base */}
      <img 
        src={imageUrl} 
        alt={altText}
        className="fullscreen-image"
        loading="lazy"
      />
      
      {/* Layer di censura */}
      <div className="absolute inset-0 pointer-events-none">
        {censors.map((censor) => {
          // Se la censura è sbloccata, non mostrare nulla
          if (unlockedCensors[censor.id]) {
            return null;
          }
          
          return (
            <div
              key={censor.id}
              className="absolute flex items-center justify-center cursor-pointer pointer-events-auto"
              style={{
                left: `${censor.x}%`,
                top: `${censor.y}%`,
                width: `${censor.width}%`,
                height: `${censor.height}%`,
                fontSize: `${Math.min(censor.width, censor.height) * 0.8}vw`,
              }}
              onClick={() => unlockCensor(censor.id)}
            >
              <span>{censor.emoji}</span>
            </div>
          );
        })}
      </div>
      
      {/* Avviso iniziale per nuovo visitatore */}
      {showInitialWarning && hasActiveCensors && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold mb-3">Censored Content Alert</h3>
            <p className="mb-4">Well, well, well... look what we have here. Some of this comic's content has been censored for your own good (or maybe for my legal protection, who knows).</p>
            <p className="mb-4">Click on any emoji to reveal all the possibly traumatizing content behind it. Or don't. I'm not your therapist.</p>
            
            <div className="flex justify-between">
              <button 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowInitialWarning(false)}
              >
                Maybe Later
              </button>
              <button 
                className="px-4 py-2 bg-black text-white rounded hover:bg-opacity-80"
                onClick={() => {
                  unlockAllCensors();
                  setShowInitialWarning(false);
                }}
              >
                Reveal Everything
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Pulsante per sbloccare tutte le censure (visibile solo se ci sono censure attive) */}
      {hasActiveCensors && !showInitialWarning && (
        <button
          className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm"
          onClick={unlockAllCensors}
        >
          Unlock all censored content
        </button>
      )}
      
      {/* Controllo per reimpostare tutte le censure (visibile solo se alcune censure sono state sbloccate) */}
      {!hasActiveCensors && (
        <button
          className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm"
          onClick={resetAllCensors}
        >
          Restore censors
        </button>
      )}
    </div>
  );
} 