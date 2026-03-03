import { z } from 'zod';

/**
 * Job status enum schema
 */
export const jobStatusSchema = z.enum(['active', 'closed', 'draft']);

/**
 * Job type enum schema
 */
export const jobTypeSchema = z.enum(['full_time', 'part_time', 'contract', 'internship']);

/**
 * Experience level enum schema
 */
export const experienceLevelSchema = z.enum(['entry', 'mid', 'senior', 'lead', 'executive']);

/**
 * Create job validation schema
 */
export const createJobSchema = z.object({
  title: z
    .string()
    .min(5, 'Job title must be at least 5 characters')
    .max(255, 'Job title must be at most 255 characters')
    .trim(),
  
  description: z
    .string()
    .min(50, 'Job description must be at least 50 characters')
    .max(10000, 'Job description must be at most 10000 characters')
    .trim(),
  
  location: z
    .string()
    .max(255, 'Location must be at most 255 characters')
    .trim()
    .optional(),
  
  job_type: jobTypeSchema.default('full_time'),
  
  remote: z.boolean().default(false),
  
  salary_min: z
    .number()
    .int('Salary must be an integer')
    .min(0, 'Minimum salary cannot be negative')
    .optional(),
  
  salary_max: z
    .number()
    .int('Salary must be an integer')
    .min(0, 'Maximum salary cannot be negative')
    .optional(),
  
  required_skills: z
    .array(z.string().trim())
    .max(20, 'Maximum 20 skills allowed')
    .optional()
    .default([]),
  
  experience_level: experienceLevelSchema.optional(),
  
  application_deadline: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .optional(),
  
  is_featured: z.boolean().default(false).optional(),
  
  status: jobStatusSchema.default('draft').optional(),
}).refine(
  (data) => {
    // Ensure salary_max >= salary_min if both are provided
    if (data.salary_min !== undefined && data.salary_max !== undefined) {
      return data.salary_max >= data.salary_min;
    }
    return true;
  },
  {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salary_max'],
  }
);

/**
 * Update job validation schema (all fields optional)
 */
export const updateJobSchema = z.object({
  title: z
    .string()
    .min(5, 'Job title must be at least 5 characters')
    .max(255, 'Job title must be at most 255 characters')
    .trim()
    .optional(),
  
  description: z
    .string()
    .min(50, 'Job description must be at least 50 characters')
    .max(10000, 'Job description must be at most 10000 characters')
    .trim()
    .optional(),
  
  location: z
    .string()
    .max(255, 'Location must be at most 255 characters')
    .trim()
    .nullable()
    .optional(),
  
  job_type: jobTypeSchema.optional(),
  
  remote: z.boolean().optional(),
  
  salary_min: z
    .number()
    .int('Salary must be an integer')
    .min(0, 'Minimum salary cannot be negative')
    .nullable()
    .optional(),
  
  salary_max: z
    .number()
    .int('Salary must be an integer')
    .min(0, 'Maximum salary cannot be negative')
    .nullable()
    .optional(),
  
  required_skills: z
    .array(z.string().trim())
    .max(20, 'Maximum 20 skills allowed')
    .optional(),
  
  experience_level: experienceLevelSchema.nullable().optional(),
  
  application_deadline: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .nullable()
    .optional(),
  
  is_featured: z.boolean().optional(),
  
  status: jobStatusSchema.optional(),
}).strict().refine(
  (data) => {
    // Ensure salary_max >= salary_min if both are provided
    if (data.salary_min !== undefined && data.salary_min !== null &&
        data.salary_max !== undefined && data.salary_max !== null) {
      return data.salary_max >= data.salary_min;
    }
    return true;
  },
  {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salary_max'],
  }
);

/**
 * Job listing query parameters schema (for searching/filtering)
 */
export const jobFiltersSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  
  search: z.string().max(200).trim().optional(),
  location: z.string().max(255).trim().optional(),
  job_type: z.union([jobTypeSchema, z.array(jobTypeSchema), z.string(), z.array(z.string())]).optional(),
  remote: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  experience_level: z.union([experienceLevelSchema, z.array(experienceLevelSchema), z.string(), z.array(z.string())]).optional(),
  
  skills: z.union([z.string(), z.array(z.string())]).optional(),
  
  salary_min: z.string().transform(Number).optional(),
  salary_max: z.string().transform(Number).optional(),
  
  company_id: z.string().uuid().optional(),
  status: z.union([jobStatusSchema, z.string()]).optional(),
  is_featured: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});

/**
 * Job ID parameter schema
 */
export const jobIdParamSchema = z.object({
  id: z.string().uuid('Invalid job ID format')
});

// Type exports
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobFiltersInput = z.infer<typeof jobFiltersSchema>;
export type JobIdParams = z.infer<typeof jobIdParamSchema>;

// Type aliases for controller usage
export type CreateJobBody = CreateJobInput;
export type UpdateJobBody = UpdateJobInput;
export type JobsFiltersQuery = JobFiltersInput;
