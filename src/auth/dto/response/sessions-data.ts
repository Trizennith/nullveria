import { z } from 'zod';
export const UserSessionsResponseDtoSchema = z.object({
  status: z.object({
    code: z.number(),
    message: z.string(),
    description: z.string().optional(),
  }),
  data: z.object({
    lastLoginAt: z.date().optional().nullable(),
    loginCount: z.number().optional().nullable(),
    userAgent: z.string().optional().nullable(),
    totalActiveLogin: z.number().optional().nullable(),
    loginData: z
      .array(
        z.object({
          loginAt: z.date(),
          refreshTokenExpiry: z.date(),
          logoutTime: z.date().optional().nullable(),
          metadata: z
            .object({
              ipAddress: z.string().optional().nullable(),
              userAgent: z.string().optional().nullable(),
              location: z.string().optional().nullable(),
              additionalInfo: z.object({}).optional().nullable(),
            })
            .optional(),
        }),
      )
      .optional()
      .nullable(),
  }),
});

export type UserSessionsResponseDto = z.infer<typeof UserSessionsResponseDtoSchema>;
