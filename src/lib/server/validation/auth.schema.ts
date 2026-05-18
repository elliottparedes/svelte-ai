import { z } from 'zod';

const passwordField = z.string().min(6, 'Password must be at least 6 characters');

export const loginSchema = z.object({
	email: z.string().email(),
	password: passwordField
});

export const signupSchema = z.object({
	email: z.string().email(),
	password: passwordField,
	name: z.string().max(255).optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
