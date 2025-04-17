import { ObjectId } from 'mongodb';

export interface Comic {
  _id?: ObjectId;
  title: string;
  chapter: number;
  description: string;
  pdfUrl: string;
  fileId: string;
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
  sentAt?: Date | null;
  recipients?: number;
} 