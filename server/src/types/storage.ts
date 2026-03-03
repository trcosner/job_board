/**
 * Storage-related type definitions
 * Provides SOLID interfaces for file storage operations
 */

/**
 * Represents a file to be uploaded
 */
export interface FileUpload {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

/**
 * Result of a successful file upload
 */
export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
  mimeType: string;
}

/**
 * Options for generating signed URLs
 */
export interface SignedUrlOptions {
  expiresIn?: number; // seconds
  responseContentDisposition?: string;
  responseContentType?: string;
}

/**
 * Configuration for file upload validation
 */
export interface FileValidationConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions?: string[];
}

/**
 * Options for file upload operation
 */
export interface UploadOptions {
  folder?: string;
  acl?: 'private' | 'public-read' | 'public-read-write';
  metadata?: Record<string, string>;
  contentType?: string;
}

/**
 * Options for file deletion
 */
export interface DeleteOptions {
  softDelete?: boolean;
}

/**
 * Abstract interface for file storage operations
 * Follows Dependency Inversion Principle - depend on abstraction, not concretion
 * 
 * This allows swapping storage providers (S3, GCS, Azure, local filesystem)
 * without changing dependent code
 */
export interface IFileStorage {
  /**
   * Upload a file to storage
   */
  upload(file: FileUpload, options?: UploadOptions): Promise<UploadResult>;

  /**
   * Upload a file from a stream
   */
  uploadStream(
    stream: NodeJS.ReadableStream,
    key: string,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Delete a file from storage
   */
  delete(key: string, options?: DeleteOptions): Promise<void>;

  /**
   * Delete multiple files from storage
   */
  deleteMany(keys: string[], options?: DeleteOptions): Promise<void>;

  /**
   * Generate a signed URL for secure access to a private file
   */
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;

  /**
   * Get a public URL for a file (if publicly accessible)
   */
  getPublicUrl(key: string): string;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get file metadata
   */
  getMetadata(key: string): Promise<{
    size: number;
    mimeType: string;
    lastModified: Date;
  }>;

  /**
   * Copy a file within storage
   */
  copy(sourceKey: string, destinationKey: string): Promise<void>;

  /**
   * Initialize storage (create buckets, etc.)
   */
  initialize(): Promise<void>;
}

/**
 * Storage provider types
 */
export type StorageProvider = 's3' | 'local' | 'gcs' | 'azure';

/**
 * Storage configuration
 */
export interface StorageConfig {
  provider: StorageProvider;
  bucket: string;
  region?: string;
  endpoint?: string; // For LocalStack or custom endpoints
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrl?: string; // Base URL for public access
}
