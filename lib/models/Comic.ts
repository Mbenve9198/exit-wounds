import { ObjectId } from 'mongodb';

export interface Comic {
  _id?: ObjectId;
  title: string;
  description: string;
  images: ImageInfo[]; // Array di immagini
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
  sentAt?: Date | null;
  recipients?: number;
}

export interface ImageInfo {
  url: string;
  cloudinaryId: string;
  order: number; // Per mantenere l'ordine delle immagini
  censors?: CensorInfo[]; // Informazioni sulla censura
}

// Interfaccia per la censura
export interface CensorInfo {
  id: string;       // ID univoco della censura
  type: 'emoji';    // Tipo di censura (per ora solo emoji, potrebbe essere esteso)
  emoji: string;    // L'emoji da utilizzare
  x: number;        // Posizione X (percentuale della larghezza dell'immagine)
  y: number;        // Posizione Y (percentuale dell'altezza dell'immagine)
  width: number;    // Larghezza (percentuale della larghezza dell'immagine)
  height: number;   // Altezza (percentuale dell'altezza dell'immagine)
  isLocked: boolean; // Se la censura è bloccata o sbloccata
} 