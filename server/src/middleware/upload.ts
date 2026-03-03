import multer, { StorageEngine, FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/BadRequestError.js';
import { FileValidationConfig } from '../types/storage.js';
import logger from '../utils/logger.js';

/**
 * File upload validation and error handling middleware
 * Follows Single Responsibility Principle - handles only file upload concerns
 */

/**
 * Supported MIME types for resume uploads
 */
export const RESUME_MIME_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
] as const;

/**
 * Supported MIME types for image uploads (logos, etc.)
 */
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/**
 * Default file size limits (in bytes)
 */
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * File validation configuration presets
 */
export const FILE_VALIDATION_PRESETS: Record<string, FileValidationConfig> = {
  resume: {
    maxSizeBytes: DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes: [...RESUME_MIME_TYPES],
    allowedExtensions: ['pdf', 'doc', 'docx'],
  },
  image: {
    maxSizeBytes: IMAGE_MAX_FILE_SIZE,
    allowedMimeTypes: [...IMAGE_MIME_TYPES],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
};

/**
 * Extract file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Create a file filter function with validation
 * Implements Strategy Pattern for validation logic
 */
function createFileFilter(config: FileValidationConfig) {
  return (req: Request, file: Express.Multer.File, callback: FileFilterCallback): void => {
    // Validate MIME type
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      logger.warn('File upload rejected: invalid MIME type', {
        filename: file.originalname,
        mimeType: file.mimetype,
        allowed: config.allowedMimeTypes,
      });
      
      return callback(
        new BadRequestError(
          `Invalid file type. Allowed types: ${config.allowedMimeTypes.join(', ')}`
        )
      );
    }

    // Validate file extension if configured
    if (config.allowedExtensions && config.allowedExtensions.length > 0) {
      const extension = getFileExtension(file.originalname);
      
      if (!config.allowedExtensions.includes(extension)) {
        logger.warn('File upload rejected: invalid file extension', {
          filename: file.originalname,
          extension,
          allowed: config.allowedExtensions,
        });
        
        return callback(
          new BadRequestError(
            `Invalid file extension. Allowed extensions: ${config.allowedExtensions.join(', ')}`
          )
        );
      }
    }

    // File passes validation
    callback(null, true);
  };
}

/**
 * Create multer upload middleware with validation
 * Uses memory storage for streaming directly to S3
 */
function createUploadMiddleware(config: FileValidationConfig, fieldName: string, maxCount: number = 1) {
  return multer({
    storage: multer.memoryStorage(), // Store in memory for S3 streaming
    limits: {
      fileSize: config.maxSizeBytes,
      files: maxCount,
    },
    fileFilter: createFileFilter(config),
  });
}

/**
 * Error handler for multer errors
 * Converts multer errors to application-specific errors
 */
export function handleMulterError(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    logger.warn('Multer error during file upload', { error: err.message, code: err.code });

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new BadRequestError('File size exceeds maximum allowed size'));
      
      case 'LIMIT_FILE_COUNT':
        return next(new BadRequestError('Too many files uploaded'));
      
      case 'LIMIT_UNEXPECTED_FILE':
        return next(new BadRequestError('Unexpected field name in form data'));
      
      case 'LIMIT_PART_COUNT':
        return next(new BadRequestError('Too many parts in multipart form'));
      
      case 'LIMIT_FIELD_KEY':
        return next(new BadRequestError('Field name too long'));
      
      case 'LIMIT_FIELD_VALUE':
        return next(new BadRequestError('Field value too long'));
      
      case 'LIMIT_FIELD_COUNT':
        return next(new BadRequestError('Too many fields'));
      
      default:
        return next(new BadRequestError(`File upload error: ${err.message}`));
    }
  }

  // Pass other errors to next middleware
  next(err);
}

/**
 * Middleware factory for single file upload with validation
 * 
 * @param fieldName - Form field name for the file
 * @param preset - Validation preset ('resume', 'image', or custom config)
 * 
 * @example
 * router.post('/upload', uploadSingle('resume', 'resume'), handleMulterError, controller)
 */
export function uploadSingle(
  fieldName: string,
  preset: keyof typeof FILE_VALIDATION_PRESETS | FileValidationConfig
) {
  const config = typeof preset === 'string' ? FILE_VALIDATION_PRESETS[preset] : preset;
  
  if (!config) {
    throw new Error(`Unknown file validation preset: ${preset}`);
  }

  const upload = createUploadMiddleware(config, fieldName, 1);
  return upload.single(fieldName);
}

/**
 * Middleware factory for multiple file upload with validation
 * 
 * @param fieldName - Form field name for the files
 * @param maxCount - Maximum number of files allowed
 * @param preset - Validation preset or custom config
 * 
 * @example
 * router.post('/upload', uploadMultiple('documents', 5, 'resume'), handleMulterError, controller)
 */
export function uploadMultiple(
  fieldName: string,
  maxCount: number,
  preset: keyof typeof FILE_VALIDATION_PRESETS | FileValidationConfig
) {
  const config = typeof preset === 'string' ? FILE_VALIDATION_PRESETS[preset] : preset;
  
  if (!config) {
    throw new Error(`Unknown file validation preset: ${preset}`);
  }

  const upload = createUploadMiddleware(config, fieldName, maxCount);
  return upload.array(fieldName, maxCount);
}

/**
 * Middleware factory for multiple different files with validation
 * 
 * @param fields - Array of field configurations
 * 
 * @example
 * router.post('/upload', uploadFields([
 *   { name: 'resume', maxCount: 1, preset: 'resume' },
 *   { name: 'logo', maxCount: 1, preset: 'image' }
 * ]), handleMulterError, controller)
 */
export function uploadFields(
  fields: Array<{
    name: string;
    maxCount: number;
    preset: keyof typeof FILE_VALIDATION_PRESETS | FileValidationConfig;
  }>
) {
  // For multiple fields with different validations, we use a more permissive approach
  // and validate each field type in the controller
  const maxFileSize = Math.max(
    ...fields.map(f => {
      const config = typeof f.preset === 'string' ? FILE_VALIDATION_PRESETS[f.preset] : f.preset;
      return config.maxSizeBytes;
    })
  );

  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxFileSize,
      files: fields.reduce((sum, f) => sum + f.maxCount, 0),
    },
  }).fields(fields.map(f => ({ name: f.name, maxCount: f.maxCount })));
}

/**
 * Middleware to ensure file was uploaded
 * Use after multer middleware to validate file presence
 */
export function requireFile(fieldName: string = 'file') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file && (!req.files || (Array.isArray(req.files) && req.files.length === 0))) {
      logger.warn('Required file not provided', { fieldName });
      return next(new BadRequestError(`File '${fieldName}' is required`));
    }
    next();
  };
}

/**
 * Middleware to validate uploaded file meets additional criteria
 * Use after multer middleware for additional custom validation
 */
export function validateFile(
  validator: (file: Express.Multer.File) => boolean | Promise<boolean>,
  errorMessage: string
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      return next();
    }

    try {
      const isValid = await validator(req.file);
      
      if (!isValid) {
        logger.warn('File failed custom validation', { filename: req.file.originalname });
        return next(new BadRequestError(errorMessage));
      }
      
      next();
    } catch (error) {
      logger.error('Error during file validation', { error, filename: req.file?.originalname });
      next(error);
    }
  };
}

/**
 * Type guard to check if req.file exists
 */
export function hasUploadedFile(req: Request): req is Request & { file: Express.Multer.File } {
  return !!req.file;
}

/**
 * Type guard to check if req.files exists (array format)
 */
export function hasUploadedFiles(req: Request): req is Request & { files: Express.Multer.File[] } {
  return !!req.files && Array.isArray(req.files);
}
