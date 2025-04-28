import { ObjectId } from 'mongodb';

export interface CensorInfo {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  emoji: string;
}

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
  censors?: CensorInfo[]; // Censure opzionali per questa immagine
} 