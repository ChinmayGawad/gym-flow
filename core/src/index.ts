import { z } from 'zod';

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'user',
}

export type Role = 'admin' | 'user';

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const createMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
