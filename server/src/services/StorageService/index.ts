import { IFileStorage, StorageConfig } from '../../types/storage.js';
import { S3StorageService } from './S3StorageService.js';
import logger from '../../utils/logger.js';

/**
 * Storage service factory
 * Implements Factory Pattern for creating storage instances
 * Follows Open/Closed Principle - open for extension, closed for modification
 */
class StorageServiceFactory {
  private static instance: IFileStorage | null = null;

  /**
   * Get or create storage service instance (Singleton)
   */
  static getInstance(config: StorageConfig): IFileStorage {
    if (!this.instance) {
      this.instance = this.createStorage(config);
    }
    return this.instance;
  }

  /**
   * Create a new storage service instance
   * Can be extended to support multiple providers (GCS, Azure, etc.)
   */
  private static createStorage(config: StorageConfig): IFileStorage {
    switch (config.provider) {
      case 's3':
        return new S3StorageService(config);

      // Future providers can be added here:
      // case 'gcs': return new GCSStorageService(config);
      // case 'azure': return new AzureStorageService(config);
      // case 'local': return new LocalStorageService(config);

      default:
        throw new Error(`Unsupported storage provider: ${config.provider}`);
    }
  }

  /**
   * Reset instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}

/**
 * Get the configured storage service instance.
 * Main entry point for consuming storage in services.
 */
export function getStorageService(): IFileStorage {
  const config: StorageConfig = {
    provider: 's3',
    bucket: process.env.S3_BUCKET || 'job-board-uploads',
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    publicUrl: process.env.S3_PUBLIC_URL,
  };

  return StorageServiceFactory.getInstance(config);
}

/**
 * Initialize storage service — call during application startup.
 */
export async function initializeStorage(): Promise<void> {
  try {
    logger.info('Initializing storage service...');
    const storage = getStorageService();
    await storage.initialize();
    logger.info('Storage service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize storage service', { error });
    throw error;
  }
}

export { StorageServiceFactory };
export { S3StorageService };
