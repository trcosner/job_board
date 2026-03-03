import { z } from 'zod';

/**
 * Application status enum schema
 */
export const applicationStatusSchema = z.enum([
  'applied',
  'reviewing',
  'interview',
  'offer',
  'hired',
  'rejected',
]);

/**
 * Create application validation schema (form fields only, resume handled separately)
 */
export const createApplicationSchema = z.object({
  cover_letter: z
    .string()
    .max(5000, 'Cover letter must be at most 5000 characters')
    .trim()
    .optional(),
  
  phone: z
    .string()
    .max(20, 'Phone number must be at most 20 characters')
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number format')
    .trim()
    .optional(),
  
  linkedin_url: z
    .string()
    .url('Must be a valid URL')
    .max(500, 'LinkedIn URL must be at most 500 characters')
    .optional(),
  
  portfolio_url: z
    .string()
    .url('Must be a valid URL')
    .max(500, 'Portfolio URL must be at most 500 characters')
    .optional(),
  
  years_experience: z
    .number()
    .int('Years of experience must be a whole number')
    .min(0, 'Years of experience cannot be negative')
    .max(70, 'Years of experience seems too high')
    .optional(),
  
  current_company: z
    .string()
    .max(255, 'Company name must be at most 255 characters')
    .trim()
    .optional(),
  
  current_title: z
    .string()
    .max(255, 'Job title must be at most 255 characters')
    .trim()
    .optional(),
  
  expected_salary: z
    .number()
    .int('Expected salary must be an integer')
    .min(0, 'Expected salary cannot be negative')
    .optional(),
  
  availability: z
    .string()
    .max(100, 'Availability must be at most 100 characters')
    .trim()
    .optional(),
});

/**
 * Update application status validation schema
 */
export const updateApplicationStatusSchema = z.object({
  status: applicationStatusSchema,
  notes: z
    .string()
    .max(5000, 'Notes must be at most 5000 characters')
    .trim()
    .optional(),
}).strict();

/**
 * Update application details schema (for applicant updates)
 */
export const updateApplicationSchema = z.object({
  cover_letter: z
    .string()
    .max(5000, 'Cover letter must be at most 5000 characters')
    .trim()
    .nullable()
    .optional(),
  
  phone: z
    .string()
    .max(20, 'Phone number must be at most 20 characters')
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number format')
    .trim()
    .nullable()
    .optional(),
  
  linkedin_url: z
    .string()
    .url('Must be a valid URL')
    .max(500, 'LinkedIn URL must be at most 500 characters')
    .nullable()
    .optional(),
  
  portfolio_url: z
    .string()
    .url('Must be a valid URL')
    .max(500, 'Portfolio URL must be at most 500 characters')
    .nullable()
    .optional(),
  
  years_experience: z
    .number()
    .int('Years of experience must be a whole number')
    .min(0, 'Years of experience cannot be negative')
    .max(70, 'Years of experience seems too high')
    .nullable()
    .optional(),
  
  current_company: z
    .string()
    .max(255, 'Company name must be at most 255 characters')
    .trim()
    .nullable()
    .optional(),
  
  current_title: z
    .string()
    .max(255, 'Job title must be at most 255 characters')
    .trim()
    .nullable()
    .optional(),
  
  expected_salary: z
    .number()
    .int('Expected salary must be an integer')
    .min(0, 'Expected salary cannot be negative')
    .nullable()
    .optional(),
  
  availability: z
    .string()
    .max(100, 'Availability must be at most 100 characters')
    .trim()
    .nullable()
    .optional(),
}).strict();

/**
 * Application filters query schema
 */
export const applicationFiltersSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),

  job_id: z.string().uuid('Invalid job ID').optional(),

  status: z.union([applicationStatusSchema, z.string()]).optional(),
  reviewed: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  
  date_from: z.string().datetime().transform((str) => new Date(str)).optional(),
  date_to: z.string().datetime().transform((str) => new Date(str)).optional(),
  
  search: z.string().max(200).trim().optional(), // Search applicant name
});

/**
 * Application ID parameter schema
 */
export const applicationIdParamSchema = z.object({
  id: z.string().uuid('Invalid application ID'),
});

/**
 * Job ID parameter schema (for getting job applications)
 */
export const jobIdParamSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
});

// Type exports
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ApplicationFiltersInput = z.infer<typeof applicationFiltersSchema>;
export type ApplicationIdParam = z.infer<typeof applicationIdParamSchema>;
export type JobIdParam = z.infer<typeof jobIdParamSchema>;

// Type aliases for controller usage
export type UpdateApplicationBody = UpdateApplicationInput;
