import { EventEmitter } from 'events';
import logger from '../utils/logger';

/**
 * Simple in-memory background task processor
 * KISS Principle: Keep It Simple
 * 
 * Perfect for:
 * - Sending emails (welcome, notifications)
 * - Logging analytics events  
 * - Non-critical background tasks
 * - Single-server deployments
 * 
 * When to upgrade to Redis Queue (Bull/BullMQ):
 * - Multi-server deployment needing distributed processing
 * - Jobs must survive server restarts
 * - Heavy CPU tasks requiring separate worker processes
 * - Need job monitoring/dashboard
 * 
 * Current approach: Simple, reliable, no external dependencies
 */

interface BackgroundJob {
  id: string;
  type: string;
  data: any;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}

type JobProcessor = (data: any) => Promise<void>;

class BackgroundTaskService extends EventEmitter {
  private processors: Map<string, JobProcessor> = new Map();
  private processing = false;

  /**
   * Register a job processor
   */
  register(jobType: string, processor: JobProcessor): void {
    this.processors.set(jobType, processor);
    logger.info('Job processor registered', { jobType });
  }

  /**
   * Enqueue a background job
   * Fire-and-forget: Job runs async but doesn't block
   */
  async enqueue(jobType: string, data: any): Promise<void> {
    const job: BackgroundJob = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: jobType,
      data,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    };

    // Process immediately in the background
    this.processJob(job).catch(error => {
      logger.error('Background job failed', {
        jobId: job.id,
        jobType: job.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });

    logger.debug('Job enqueued', { jobId: job.id, jobType });
  }

  /**
   * Process a job with retry logic
   */
  private async processJob(job: BackgroundJob): Promise<void> {
    const processor = this.processors.get(job.type);
    
    if (!processor) {
      logger.warn('No processor found for job type', { jobType: job.type });
      this.emit('job:unhandled', job);
      return;
    }

    try {
      await processor(job.data);
      this.emit('job:completed', job);
      logger.debug('Job completed', { jobId: job.id, jobType: job.type });
    } catch (error) {
      job.attempts++;
      
      if (job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        const delay = Math.pow(2, job.attempts) * 1000; // 2s, 4s, 8s
        logger.warn('Job failed, retrying', {
          jobId: job.id,
          jobType: job.type,
          attempt: job.attempts,
          delay
        });
        
        setTimeout(() => {
          this.processJob(job).catch(() => {
            // Already logged in processJob
          });
        }, delay);
      } else {
        // Permanent failure
        this.emit('job:failed', job, error);
        logger.error('Job failed permanently', {
          jobId: job.id,
          jobType: job.type,
          attempts: job.attempts,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Schedule a delayed job
   */
  async schedule(jobType: string, data: any, delayMs: number): Promise<void> {
    setTimeout(() => {
      this.enqueue(jobType, data).catch(() => {
        // Already logged in enqueue
      });
    }, delayMs);

    logger.debug('Job scheduled', { jobType, delayMs });
  }
}

// Singleton instance
export const backgroundTasks = new BackgroundTaskService();

/**
 * Example usage in your application:
 * 
 * import { backgroundTasks } from './services/BackgroundTaskService';
 * 
 * // Register processors at startup
 * backgroundTasks.register('send_welcome_email', async (data) => {
 *   await emailService.send(data.email, 'Welcome!', data.template);
 * });
 * 
 * backgroundTasks.register('log_analytics', async (data) => {
 *   await analyticsService.log(data.event, data.properties);
 * });
 * 
 * // Use in routes
 * app.post('/register', async (req, res) => {
 *   const user = await createUser(req.body);
 *   
 *   // Fire-and-forget background tasks
 *   await backgroundTasks.enqueue('send_welcome_email', {
 *     email: user.email,
 *     name: user.name
 *   });
 *   
 *   await backgroundTasks.enqueue('log_analytics', {
 *     event: 'user_registered',
 *     properties: { userId: user.id }
 *   });
 *   
 *   res.json({ message: 'User registered', user });
 * });
 */
