import { z } from 'zod';

/**
 * Company size enum schema
 */
export const companySizeSchema = z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']);

/**
 * URL slug validation (lowercase, alphanumeric with hyphens)
 */
export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(255, 'Slug must be at most 255 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), {
    message: 'Slug cannot start or end with a hyphen',
  });

/**
 * Website URL validation
 */
export const websiteSchema = z
  .string()
  .url('Must be a valid URL')
  .max(500, 'Website URL must be at most 500 characters')
  .optional();

/**
 * Create company validation schema
 */
export const createCompanySchema = z.object({
  name: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(255, 'Company name must be at most 255 characters')
    .trim(),
  
  description: z
    .string()
    .max(5000, 'Description must be at most 5000 characters')
    .trim()
    .optional(),
  
  website: websiteSchema,
  
  industry: z
    .string()
    .max(100, 'Industry must be at most 100 characters')
    .trim()
    .optional(),
  
  company_size: companySizeSchema.optional(),
  
  location: z
    .string()
    .max(255, 'Location must be at most 255 characters')
    .trim()
    .optional(),
});

/**
 * Update company validation schema (all fields optional)
 */
export const updateCompanySchema = z.object({
  name: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(255, 'Company name must be at most 255 characters')
    .trim()
    .optional(),
  
  description: z
    .string()
    .max(5000, 'Description must be at most 5000 characters')
    .trim()
    .nullable()
    .optional(),
  
  website: websiteSchema.nullable().optional(),
  
  industry: z
    .string()
    .max(100, 'Industry must be at most 100 characters')
    .trim()
    .nullable()
    .optional(),
  
  company_size: companySizeSchema.nullable().optional(),
  
  location: z
    .string()
    .max(255, 'Location must be at most 255 characters')
    .trim()
    .nullable()
    .optional(),
}).strict(); // Reject unknown fields

/**
 * Company slug param validation
 */
export const companySlugParamSchema = z.object({
  slug: slugSchema,
});

/**
 * Company ID param validation
 */
export const companyIdParamSchema = z.object({
  id: z.string().uuid('Invalid company ID'),
});

/**
 * Generate slug from company name
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Infer types from schemas
 */
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanySlugParam = z.infer<typeof companySlugParamSchema>;
export type CompanyIdParam = z.infer<typeof companyIdParamSchema>;

// Type aliases for controller usage
export type CreateCompanyBody = CreateCompanyInput;
export type UpdateCompanyBody = UpdateCompanyInput;

/**
 * Company filters query schema
 */
export const companyFiltersSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  
  search: z.string().max(200).trim().optional(),
  company_size: companySizeSchema.optional(),
  location: z.string().max(255).trim().optional(),
  industry: z.string().max(100).trim().optional(),
});

export type CompanyFiltersQuery = z.infer<typeof companyFiltersSchema>;
