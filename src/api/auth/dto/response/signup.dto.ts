import { z } from 'zod';

export const RegisterDtoSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(1, 'Username is required'),
  phoneNumber: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;
