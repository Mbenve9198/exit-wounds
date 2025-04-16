import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  nickname: string;
  verificationToken?: string | null;
  isVerified: boolean;
  isApproved: boolean;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  role?: 'user' | 'admin';
  lastLogin?: Date;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
} 