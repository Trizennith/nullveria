import { z } from 'zod';
export const SessionData = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const LoginResponseDtoSchema = z.object({
  status: z.object({
    code: z.number(),
    message: z.string(),
    description: z.string().optional(),
  }),
  data: z.object({
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string(),
    role: z.enum(['user', 'admin', 'super_admin']),
    isActive: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    sessionData: SessionData,
  }),
});

export type SessionData = z.infer<typeof SessionData>;
export type LoginResponseDto = z.infer<typeof LoginResponseDtoSchema>;
