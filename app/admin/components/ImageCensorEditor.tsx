'use client';

import { useState, useRef, useEffect } from 'react';
import { CensorInfo } from '@/lib/models/Comic';

// Lista di emoji disponibili per la censura
const AVAILABLE_EMOJIS = [
  '🔞', '🙈', '❌', '⚠️', '🫣', '😱', '🤫', '🧠',
  '❤️', '💀', '🔥', '🫧', '🌟', '✨', '💣', '🔫',
];

// Dimensione predefinita delle emoji
const DEFAULT_EMOJI_SIZE = 10; // 10% della dimensione dell'immagine

interface ImageCensorEditorProps {
  imageUrl: string;
  censors: CensorInfo[];
  onChange: (censors: CensorInfo[]) => void;
}

export default function ImageCensorEditor({ imageUrl, censors, onChange }: ImageCensorEditorProps) {
  const [activeCensor, setActiveCensor] = useState<CensorInfo | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState(AVAILABLE_EMOJIS[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Carica le dimensioni dell'immagine al montaggio del componente
  useEffect(() => {
    const loadImageSize = () => {
      if (imageRef.current) {
        setImageSize({
          width: imageRef.current.offsetWidth,
          height: imageRef.current.offsetHeight
        });
      }
    };
    
    loadImageSize();
    window.addEventListener('resize', loadImageSize);
    
    // Assicurati che l'immagine sia caricata
    if (imageRef.current) {
      imageRef.current.onload = loadImageSize;
    }
    
    return () => window.removeEventListener('resize', loadImageSize);
  }, [imageUrl]);
  
  // Genera un ID univoco per la censura
  const generateId = () => `censor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Aggiunge una nuova censura
  const addCensor = () => {
    const newCensor: CensorInfo = {
      id: generateId(),
      type: 'emoji',
      emoji: selectedEmoji,
      x: 50 - DEFAULT_EMOJI_SIZE / 2, // Centra orizzontalmente
      y: 50 - DEFAULT_EMOJI_SIZE / 2, // Centra verticalmente
      width: DEFAULT_EMOJI_SIZE,
      height: DEFAULT_EMOJI_SIZE,
      isLocked: true // Di default, la censura è bloccata
    };
    
    onChange([...censors, newCensor]);
    setActiveCensor(newCensor);
  };
  
  // Rimuove una censura
  const removeCensor = (id: string) => {
    const updatedCensors = censors.filter(censor => censor.id !== id);
    onChange(updatedCensors);
    
    if (activeCensor && activeCensor.id === id) {
      setActiveCensor(null);
    }
  };
  
  // Aggiorna una censura
  const updateCensor = (updatedCensor: CensorInfo) => {
    const updatedCensors = censors.map(censor => 
      censor.id === updatedCensor.id ? updatedCensor : censor
    );
    onChange(updatedCensors);
    
    if (activeCensor && activeCensor.id === updatedCensor.id) {
      setActiveCensor(updatedCensor);
    }
  };
  
  // Gestisce l'inizio del trascinamento
  const handleDragStart = (e: React.MouseEvent, censor: CensorInfo) => {
    e.preventDefault();
    
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setDragOffset({
        x: x - censor.x,
        y: y - censor.y
      });
    }
    
    setActiveCensor(censor);
    setIsDragging(true);
  };
  
  // Gestisce il movimento durante il trascinamento
  const handleDragMove = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isDragging && activeCensor && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      
      // Calcola la nuova posizione in percentuale
      let newX = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x;
      let newY = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y;
      
      // Limita la posizione all'interno dell'immagine
      newX = Math.max(0, Math.min(100 - activeCensor.width, newX));
      newY = Math.max(0, Math.min(100 - activeCensor.height, newY));
      
      const updatedCensor = {
        ...activeCensor,
        x: newX,
        y: newY
      };
      
      updateCensor(updatedCensor);
    }
  };
  
  // Gestisce il rilascio dopo il trascinamento
  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };
  
  // Gestisce il ridimensionamento di una censura
  const handleResize = (censor: CensorInfo, newSize: { width?: number, height?: number }) => {
    const updatedCensor = {
      ...censor,
      ...newSize,
    };
    
    // Assicurati che la censura non esca dai bordi
    if (updatedCensor.x + updatedCensor.width > 100) {
      updatedCensor.x = 100 - updatedCensor.width;
    }
    if (updatedCensor.y + updatedCensor.height > 100) {
      updatedCensor.y = 100 - updatedCensor.height;
    }
    
    updateCensor(updatedCensor);
  };
  
  // Cambia l'emoji di una censura
  const changeEmoji = (censor: CensorInfo, emoji: string) => {
    updateCensor({
      ...censor,
      emoji
    });
  };
  
  // Gestisce i movimenti del mouse sul canvas
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e as unknown as React.MouseEvent);
      const handleMouseUp = () => handleDragEnd();
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, activeCensor]);
  
  return (
    <div className="relative border rounded-lg overflow-hidden shadow-md">
      {/* Area di lavoro per l'editing */}
      <div 
        ref={canvasRef}
        className="relative w-full cursor-move"
        onMouseUp={handleDragEnd}
      >
        {/* Immagine di sfondo */}
        <img 
          ref={imageRef}
          src={imageUrl} 
          alt="Immagine da censurare" 
          className="w-full h-auto block"
        />
        
        {/* Layer di censura */}
        <div className="absolute inset-0">
          {censors.map(censor => (
            <div
              key={censor.id}
              className={`absolute cursor-move ${activeCensor?.id === censor.id ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                left: `${censor.x}%`,
                top: `${censor.y}%`,
                width: `${censor.width}%`,
                height: `${censor.height}%`,
                fontSize: `${Math.min(censor.width, censor.height) * 0.8}vw`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseDown={(e) => handleDragStart(e, censor)}
            >
              <div className="flex items-center justify-center w-full h-full">
                <span>{censor.emoji}</span>
              </div>
              
              {/* Mostra i controlli solo per la censura attiva */}
              {activeCensor?.id === censor.id && (
                <>
                  {/* Maniglia per il ridimensionamento */}
                  <div 
                    className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startWidth = censor.width;
                      const startHeight = censor.height;
                      
                      const handleResizeMove = (moveEvent: MouseEvent) => {
                        moveEvent.preventDefault();
                        if (canvasRef.current) {
                          const rect = canvasRef.current.getBoundingClientRect();
                          const deltaX = moveEvent.clientX - startX;
                          const deltaY = moveEvent.clientY - startY;
                          
                          const newWidth = Math.max(5, startWidth + (deltaX / rect.width) * 100);
                          const newHeight = Math.max(5, startHeight + (deltaY / rect.height) * 100);
                          
                          handleResize(censor, { width: newWidth, height: newHeight });
                        }
                      };
                      
                      const handleResizeEnd = () => {
                        document.removeEventListener('mousemove', handleResizeMove);
                        document.removeEventListener('mouseup', handleResizeEnd);
                      };
                      
                      document.addEventListener('mousemove', handleResizeMove);
                      document.addEventListener('mouseup', handleResizeEnd);
                    }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Pannello di controllo */}
      <div className="bg-white border-t p-3">
        <div className="flex flex-wrap items-center justify-between mb-2">
          <div>
            <button
              type="button"
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
              onClick={addCensor}
            >
              Aggiungi Censura
            </button>
            
            {activeCensor && (
              <button
                type="button"
                className="ml-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                onClick={() => removeCensor(activeCensor.id)}
              >
                Rimuovi
              </button>
            )}
          </div>
          
          {/* Informazione sulla censura */}
          {activeCensor && (
            <div className="text-sm text-gray-500">
              Censura attiva: {activeCensor.emoji}
            </div>
          )}
        </div>
        
        {/* Selezione emoji */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scegli Emoji
          </label>
          <div className="grid grid-cols-8 gap-1">
            {AVAILABLE_EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                className={`p-1 text-xl ${selectedEmoji === emoji ? 'bg-gray-200 rounded' : ''}`}
                onClick={() => {
                  setSelectedEmoji(emoji);
                  if (activeCensor) {
                    changeEmoji(activeCensor, emoji);
                  }
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        
        {/* Opzioni della censura attiva */}
        {activeCensor && (
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimensione Emoji
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={activeCensor.width}
                onChange={(e) => {
                  const size = parseFloat(e.target.value);
                  handleResize(activeCensor, { width: size, height: size });
                }}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="lockCensor"
                checked={activeCensor.isLocked}
                onChange={(e) => {
                  updateCensor({
                    ...activeCensor,
                    isLocked: e.target.checked
                  });
                }}
                className="mr-2"
              />
              <label htmlFor="lockCensor" className="text-sm text-gray-700">
                Censura bloccata di default (richiede sblocco)
              </label>
            </div>
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-500">
          <p>Posiziona le emoji sulle parti dell'immagine che vuoi censurare.</p>
          <p>Gli utenti potranno sbloccare queste censure per visualizzare il contenuto completo.</p>
        </div>
      </div>
    </div>
  );
} 