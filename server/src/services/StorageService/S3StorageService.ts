import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  ObjectCannedACL,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import logger from '../../utils/logger.js';
import type {
  IFileStorage,
  FileUpload,
  UploadResult,
  UploadOptions,
  DeleteOptions,
  SignedUrlOptions,
  StorageConfig,
} from '../../types/storage.js';

/**
 * S3-compatible storage service implementation
 * Implements IFileStorage interface following Single Responsibility Principle
 * 
 * Works with AWS S3, LocalStack, MinIO, or any S3-compatible API
 */
export class S3StorageService implements IFileStorage {
  private client: S3Client;
  private bucket: string;
  private region: string;
  private publicUrl?: string;
  private initialized: boolean = false;

  constructor(config: StorageConfig) {
    if (config.provider !== 's3') {
      throw new Error(`S3StorageService requires provider 's3', got '${config.provider}'`);
    }

    this.bucket = config.bucket;
    this.region = config.region || 'us-east-1';
    this.publicUrl = config.publicUrl;

    // Configure S3 client
    this.client = new S3Client({
      region: this.region,
      endpoint: config.endpoint,
      credentials: config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined,
      forcePathStyle: !!config.endpoint,
    });

    logger.info('S3StorageService initialized', {
      bucket: this.bucket,
      region: this.region,
      endpoint: config.endpoint || 'AWS S3',
    });
  }

  /**
   * Initialize storage - create bucket if it doesn't exist
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      logger.info('S3 bucket exists', { bucket: this.bucket });
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        logger.info('Creating S3 bucket', { bucket: this.bucket });
        try {
          await this.client.send(
            new CreateBucketCommand({
              Bucket: this.bucket,
              CreateBucketConfiguration:
                this.region !== 'us-east-1'
                  ? { LocationConstraint: this.region as any }
                  : undefined,
            })
          );
          logger.info('S3 bucket created successfully', { bucket: this.bucket });
        } catch (createError: any) {
          if (createError.name !== 'BucketAlreadyOwnedByYou' && createError.name !== 'BucketAlreadyExists') {
            throw createError;
          }
        }
      } else {
        logger.error('Failed to check S3 bucket', { error, bucket: this.bucket });
        throw error;
      }
    }

    this.initialized = true;
  }

  /**
   * Upload a file from buffer
   */
  async upload(file: FileUpload, options: UploadOptions = {}): Promise<UploadResult> {
    await this.ensureInitialized();

    const key = this.generateKey(file.originalName, options.folder);

    try {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: options.contentType || file.mimeType,
          ACL: options.acl as ObjectCannedACL,
          Metadata: options.metadata,
        },
      });

      await upload.done();

      const url = this.publicUrl ? `${this.publicUrl}/${key}` : this.getAwsUrl(key);

      logger.info('File uploaded successfully', { key, size: file.size, bucket: this.bucket });

      return {
        url,
        key,
        bucket: this.bucket,
        size: file.size,
        mimeType: file.mimeType,
      };
    } catch (error) {
      logger.error('Failed to upload file', { error, key, bucket: this.bucket });
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a file from a readable stream
   */
  async uploadStream(stream: NodeJS.ReadableStream, key: string, options: UploadOptions = {}): Promise<UploadResult> {
    await this.ensureInitialized();

    try {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: stream as Readable,
          ContentType: options.contentType,
          ACL: options.acl as ObjectCannedACL,
          Metadata: options.metadata,
        },
      });

      await upload.done();

      const url = this.publicUrl ? `${this.publicUrl}/${key}` : this.getAwsUrl(key);

      logger.info('Stream uploaded successfully', { key, bucket: this.bucket });

      return {
        url,
        key,
        bucket: this.bucket,
        size: 0,
        mimeType: options.contentType || 'application/octet-stream',
      };
    } catch (error) {
      logger.error('Failed to upload stream', { error, key, bucket: this.bucket });
      throw new Error(`Failed to upload stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a single file
   */
  async delete(key: string, options: DeleteOptions = {}): Promise<void> {
    await this.ensureInitialized();

    if (options.softDelete) {
      logger.warn('Soft delete not supported for S3, performing hard delete', { key });
    }

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );

      logger.info('File deleted successfully', { key, bucket: this.bucket });
    } catch (error) {
      logger.error('Failed to delete file', { error, key, bucket: this.bucket });
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete multiple files efficiently
   */
  async deleteMany(keys: string[], options: DeleteOptions = {}): Promise<void> {
    await this.ensureInitialized();

    if (keys.length === 0) {
      return;
    }

    const batches = this.chunkArray(keys, 1000);

    try {
      for (const batch of batches) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
              Objects: batch.map((key) => ({ Key: key })),
              Quiet: true,
            },
          })
        );
      }

      logger.info('Files deleted successfully', { count: keys.length, bucket: this.bucket });
    } catch (error) {
      logger.error('Failed to delete files', { error, count: keys.length, bucket: this.bucket });
      throw new Error(`Failed to delete files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a signed URL for temporary secure access
   */
  async getSignedUrl(key: string, options: SignedUrlOptions = {}): Promise<string> {
    await this.ensureInitialized();

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: options.responseContentDisposition,
        ResponseContentType: options.responseContentType,
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: options.expiresIn || 3600,
      });

      logger.debug('Generated signed URL', { key, expiresIn: options.expiresIn || 3600 });

      return url;
    } catch (error) {
      logger.error('Failed to generate signed URL', { error, key, bucket: this.bucket });
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    return this.getAwsUrl(key);
  }

  /**
   * Check if a file exists
   */
  async exists(key: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      logger.error('Failed to check file existence', { error, key, bucket: this.bucket });
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(key: string): Promise<{ size: number; mimeType: string; lastModified: Date }> {
    await this.ensureInitialized();

    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );

      return {
        size: response.ContentLength || 0,
        mimeType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
      };
    } catch (error) {
      logger.error('Failed to get file metadata', { error, key, bucket: this.bucket });
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Copy a file within the same bucket
   */
  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${sourceKey}`,
          Key: destinationKey,
        })
      );

      logger.info('File copied successfully', { sourceKey, destinationKey, bucket: this.bucket });
    } catch (error) {
      logger.error('Failed to copy file', { error, sourceKey, destinationKey, bucket: this.bucket });
      throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateKey(originalName: string, folder?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const sanitizedName = this.sanitizeFilename(originalName);
    
    const key = `${timestamp}-${random}-${sanitizedName}`;
    
    return folder ? `${folder}/${key}` : key;
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')
      .replace(/^\.+/, '')
      .substring(0, 100);
  }

  private getAwsUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
