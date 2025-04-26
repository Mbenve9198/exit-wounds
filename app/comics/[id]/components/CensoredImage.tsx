'use client';

import { useState, useEffect } from 'react';
import { CensorInfo } from '@/lib/models/Comic';

interface CensoredImageProps {
  imageUrl: string;
  censors: CensorInfo[];
  altText: string;
}

export function CensoredImage({ imageUrl, censors, altText }: CensoredImageProps) {
  // Stato per tenere traccia delle censure sbloccate
  const [unlockedCensors, setUnlockedCensors] = useState<{[key: string]: boolean}>({});
  
  // Carica lo stato di sblocco precedente dal localStorage al montaggio del componente
  useEffect(() => {
    try {
      const savedUnlocks = localStorage.getItem(`unlocked-censors-${imageUrl}`);
      if (savedUnlocks) {
        setUnlockedCensors(JSON.parse(savedUnlocks));
      }
    } catch (error) {
      console.error('Errore nel recupero degli sblocchi salvati:', error);
    }
  }, [imageUrl]);
  
  // Salva lo stato di sblocco nel localStorage quando cambia
  useEffect(() => {
    if (Object.keys(unlockedCensors).length > 0) {
      try {
        localStorage.setItem(`unlocked-censors-${imageUrl}`, JSON.stringify(unlockedCensors));
      } catch (error) {
        console.error('Errore nel salvataggio degli sblocchi:', error);
      }
    }
  }, [unlockedCensors, imageUrl]);
  
  // Funzione per sbloccare una censura
  const unlockCensor = (censorId: string) => {
    if (confirm('Vuoi sbloccare questa censura?')) {
      setUnlockedCensors({
        ...unlockedCensors,
        [censorId]: true
      });
    }
  };
  
  // Funzione per reimpostare tutte le censure
  const resetAllCensors = () => {
    if (confirm('Vuoi reimpostare tutte le censure?')) {
      setUnlockedCensors({});
      localStorage.removeItem(`unlocked-censors-${imageUrl}`);
    }
  };
  
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
      
      {/* Controllo per reimpostare tutte le censure */}
      {Object.keys(unlockedCensors).length > 0 && (
        <button
          className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm"
          onClick={resetAllCensors}
        >
          Ripristina censure
        </button>
      )}
    </div>
  );
} 