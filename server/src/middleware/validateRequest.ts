import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/ValidationError';

/**
 * Generic validation middleware factory
 * Single Responsibility: Validate request data against Zod schemas
 * Open/Closed: Extensible for body, query, params validation
 */

type RequestPart = 'body' | 'query' | 'params';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;  
  params?: ZodSchema;
}

/**
 * Comprehensive request validation middleware
 * Validates body, query, and params against provided Zod schemas
 */
export const validateRequest = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate each part of the request
      for (const [part, schema] of Object.entries(schemas) as [RequestPart, ZodSchema][]) {
        if (schema) {
          // Parse and validate the data
          const validatedData = await schema.parseAsync(req[part]);
          
          // Replace request data with validated/transformed data
          (req as any)[part] = validatedData;
        }
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError(error));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Convenience functions for common validation patterns
 */

// Validate only request body
export const validateBody = (schema: ZodSchema) => 
  validateRequest({ body: schema });

// Validate only query parameters  
export const validateQuery = (schema: ZodSchema) =>
  validateRequest({ query: schema });

// Validate only route parameters
export const validateParams = (schema: ZodSchema) =>
  validateRequest({ params: schema });

/**
 * Input sanitization middleware
 * Protects against XSS and other injection attacks
 * Note: In Express 5+, req.query and req.params are getters and cannot be reassigned
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Recursively sanitize all string values
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .trim()
        .replace(/[<>\"'&]/g, (char) => {
          const map: { [key: string]: string } = {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '&': '&amp;'
          };
          return map[char];
        });
    }
    
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    
    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    
    return value;
  };

  // Helper to sanitize object properties in place (for getters)
  const sanitizeObjectInPlace = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key of Object.keys(obj)) {
      obj[key] = sanitizeValue(obj[key]);
    }
  };

  // Sanitize body (can be reassigned)
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  
  // Sanitize query and params in place (getters in Express 5+)
  sanitizeObjectInPlace(req.query);
  sanitizeObjectInPlace(req.params);

  next();
};

export default validateRequest;