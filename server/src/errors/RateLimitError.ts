import { CustomError } from './CustomError';
import { SerializedError } from '../types/error';

export class RateLimitError extends CustomError {
  public statusCode = 429;
  public retryAfter: number;
  public limit: number;
  public remaining: number;
  
  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter: number,
    limit: number,
    remaining: number = 0
  ) {
    super(message);
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
  }

  serializeErrors(): SerializedError[] {
    return [{
      message: this.message,
      field: undefined,
      retryAfter: this.retryAfter,
      limit: this.limit,
      remaining: this.remaining
    }];
  }
}