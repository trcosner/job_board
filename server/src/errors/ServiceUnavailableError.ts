import { CustomError } from './CustomError';
import { SerializedError } from '../types/error';

/**
 * Service unavailable errors
 * For external service failures, maintenance mode, etc.
 */
export class ServiceUnavailableError extends CustomError {
  public statusCode = 503;
  public service: string;
  public retryAfter?: number;
  
  constructor(
    message: string = 'Service temporarily unavailable',
    service: string = 'unknown',
    retryAfter?: number
  ) {
    super(message);
    this.service = service;
    this.retryAfter = retryAfter;
  }

  serializeErrors(): SerializedError[] {
    return [{
      message: this.message,
      service: this.service,
      retryAfter: this.retryAfter
    }];
  }
}