import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { createHash } from 'crypto';

export default class Generator {
  static hash(context: string): string {
    return createHash('sha256').update(context).digest('hex');
  }

  static generateUserContext(): string {
    return crypto.randomBytes(32).toString('hex'); // 64-char random string
  }

  static generateUniqueID(): string {
    return uuidv4();
  }
  /**
   * Generates a random string of the specified length.
   * @param length - The length of the random string to generate.
   * @returns A random string of the specified length.
   */
  static generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
  }
}
