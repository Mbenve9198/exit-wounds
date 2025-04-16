import { MongoClient, ObjectId } from 'mongodb';
import { User } from '../models/User';
import { getDatabase } from '../mongodb';
import bcrypt from 'bcryptjs';

export class UserService {
  private static async getCollection() {
    try {
      const db = await getDatabase();
      return db.collection<User>('users');
    } catch (error) {
      console.error('Error connecting to database:', error);
      throw error;
    }
  }

  static async createUser(userData: Omit<User, '_id'>): Promise<User> {
    try {
      const collection = await this.getCollection();
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = { ...userData, password: hashedPassword };
      const result = await collection.insertOne(user as User);
      console.log('User created successfully:', result.insertedId);
      return { ...user, _id: result.insertedId };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    try {
      const collection = await this.getCollection();
      return await collection.findOne({ email });
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findUserById(id: string): Promise<User | null> {
    try {
      const collection = await this.getCollection();
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    try {
      const collection = await this.getCollection();
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: userData },
        { returnDocument: 'after' }
      );
      console.log('User updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      console.log('User deleted successfully:', result.deletedCount);
      return result.deletedCount === 1;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
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