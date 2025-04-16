import { getDatabase } from '../mongodb';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export class UserService {
  private static async getCollection() {
    const db = await getDatabase();
    return db.collection<User>('users');
  }

  static async createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const collection = await this.getCollection();
    
    // Hash della password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const newUser: User = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false,
      verificationToken: null,
      role: 'user'
    };

    const result = await collection.insertOne(newUser);
    return { ...newUser, _id: result.insertedId };
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const collection = await this.getCollection();
    return collection.findOne({ email });
  }

  static async findUserById(id: string): Promise<User | null> {
    const collection = await this.getCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  static async updateUser(id: string, updateData: Partial<User>): Promise<User | null> {
    const collection = await this.getCollection();
    
    // Se viene aggiornata la password, hashala
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    return result;
  }

  static async verifyUser(token: string): Promise<User | null> {
    const collection = await this.getCollection();
    const result = await collection.findOneAndUpdate(
      { verificationToken: token },
      { 
        $set: { 
          isVerified: true,
          verificationToken: null,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    return result;
  }

  static async setResetPasswordToken(email: string, token: string, expires: Date): Promise<User | null> {
    const collection = await this.getCollection();
    const result = await collection.findOneAndUpdate(
      { email },
      { 
        $set: { 
          resetPasswordToken: token,
          resetPasswordExpires: expires,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    return result;
  }

  static async resetPassword(token: string, newPassword: string): Promise<User | null> {
    const collection = await this.getCollection();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await collection.findOneAndUpdate(
      { 
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      },
      { 
        $set: { 
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    return result;
  }
} 