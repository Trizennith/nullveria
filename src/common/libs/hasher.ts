import bcrypt from 'bcrypt';

export async function authPasswordHasher(password: string) {
  return await bcrypt.hash(password, 10);
}
