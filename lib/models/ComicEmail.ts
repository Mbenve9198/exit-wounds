import { ObjectId } from 'mongodb';

export interface ComicEmail {
  _id?: ObjectId;
  comicId: string;
  emailSubject: string;
  textBefore: string;
  textAfter: string;
  createdAt: Date;
  sentAt?: Date | null;
  recipients?: number;
} 