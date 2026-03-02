import { z } from 'zod';

/**
 * Job listing query parameters schema
 */
export const jobsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  location: z.string().optional(),
  type: z.enum(['full_time', 'part_time', 'contract', 'internship']).optional(),
  remote: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  salary_min: z.string().transform(Number).optional(),
  salary_max: z.string().transform(Number).optional(),
  search: z.string().max(200).optional()
});

/**
 * Job ID parameter schema
 */
export const jobIdParamSchema = z.object({
  id: z.string().uuid('Invalid job ID format')
});

// Type exports
export type JobsQueryParams = z.infer<typeof jobsQuerySchema>;
export type JobIdParams = z.infer<typeof jobIdParamSchema>;
