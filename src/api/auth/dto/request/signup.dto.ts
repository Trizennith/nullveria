import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  username: z.string().min(1, 'Username is required'),
  phoneNumber: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export type RegisterDtoSchema = z.infer<typeof RegisterDto>;
