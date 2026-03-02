import { CustomError } from './CustomError';
import { SerializedError } from '../types/error';

/**
 * Request timeout errors
 * For operations that exceed time limits
 */
export class TimeoutError extends CustomError {
  public statusCode = 408;
  public timeout: number;
  public operation: string;
  
  constructor(
    message: string = 'Request timeout',
    operation: string = 'unknown',
    timeout: number = 30000
  ) {
    super(message);
    this.operation = operation;
    this.timeout = timeout;
  }

  serializeErrors(): SerializedError[] {
    return [{
      message: this.message,
      operation: this.operation,
      timeout: this.timeout
    }];
  }
}