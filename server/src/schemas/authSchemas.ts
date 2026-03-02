import { z } from 'zod';
import { UserType, RegistrationRequestParams, LoginRequestParams } from '../types/auth';

// Schema for user types enum - ensures type safety with your UserType
const userTypeSchema = z.enum(['job_seeker', 'employer'], {
    message: 'User type must be either job_seeker or employer'
}) satisfies z.ZodType<UserType>;

// Reusable field schemas for other validation needs
export const emailSchema = z.string()
    .email('Invalid email format')
    .max(254, 'Email is too long');

export const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    );

export const nameSchema = z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Registration body schema (for use with validateBody)
export const registerBodySchema = z.object({
    email: emailSchema,
    password:passwordSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    userType: userTypeSchema
}) satisfies z.ZodType<RegistrationRequestParams>;

// Login body schema (for use with validateBody)
export const loginBodySchema = z.object({
    email: emailSchema,
    password: passwordSchema
}) satisfies z.ZodType<LoginRequestParams>;

// Legacy schemas for backward compatibility
export const registerSchema = z.object({
    body: registerBodySchema
});

export const loginSchema = z.object({
    body: loginBodySchema
});

// Extract types - these now match your interface types exactly
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

// Body-only types for easier use in controllers
export type RegisterRequestBody = z.infer<typeof registerBodySchema>;
export type LoginRequestBody = z.infer<typeof loginBodySchema>;

