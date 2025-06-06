import { MongoClient, ObjectId } from 'mongodb';
import { User } from '../models/User';
import { getDatabase } from '../mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class UserService {
  private static async getCollection() {
    try {
      const db = await getDatabase();
      return db.collection<User>('users');
    } catch (error) {
      console.error('Error connecting to database:', error);
      throw new Error(`Errore nella connessione al database: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
  }

  static async createUser(userData: Omit<User, '_id'>): Promise<User> {
    try {
      const collection = await this.getCollection();
      
      // Verifica se l'utente esiste già
      const existingUser = await this.findUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email già registrata');
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = { 
        ...userData, 
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        isVerified: false
      };
      
      const result = await collection.insertOne(user as User);
      console.log('User created successfully:', result.insertedId);
      return { ...user, _id: result.insertedId };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Errore nella creazione dell'utente: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
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

  static async setResetPasswordToken(email: string, token: string, expires: Date): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { email },
        { 
          $set: { 
            resetPasswordToken: token,
            resetPasswordExpires: expires
          } 
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error setting reset password token:', error);
      throw error;
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<User | null> {
    try {
      const collection = await this.getCollection();
      
      // Trova l'utente con il token valido e non scaduto
      const user = await collection.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });
      
      if (!user) {
        return null;
      }
      
      // Hash della nuova password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Aggiorna la password e rimuovi i token di reset
      const result = await collection.updateOne(
        { _id: user._id },
        {
          $set: { password: hashedPassword },
          $unset: { resetPasswordToken: "", resetPasswordExpires: "" }
        }
      );
      
      return result.modifiedCount > 0 ? user : null;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  // Genera un token casuale per unsubscribe
  static async generateUnsubscribeToken(email: string): Promise<string> {
    try {
      const collection = await this.getCollection();
      const token = crypto.randomBytes(32).toString('hex');
      
      // Aggiorna il record dell'utente con il token
      await collection.updateOne(
        { email },
        { $set: { unsubscribeToken: token } }
      );
      
      return token;
    } catch (error) {
      console.error('Error generating unsubscribe token:', error);
      throw error;
    }
  }
  
  // Trova un utente tramite il token di unsubscribe
  static async findUserByUnsubscribeToken(token: string): Promise<User | null> {
    try {
      const collection = await this.getCollection();
      return await collection.findOne({ unsubscribeToken: token });
    } catch (error) {
      console.error('Error finding user by unsubscribe token:', error);
      return null;
    }
  }
  
  // Aggiorna lo stato di unsubscribe dell'utente
  static async updateUnsubscribeStatus(email: string, unsubscribed: boolean): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { email },
        { $set: { unsubscribed } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating unsubscribe status:', error);
      return false;
    }
  }

  // Aggiorna lo stato di verifica dell'utente
  static async updateVerificationStatus(email: string, isVerified: boolean): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { email },
        { $set: { isVerified } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating verification status:', error);
      return false;
    }
  }
} 