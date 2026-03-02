import { CustomError } from './CustomError';
import { SerializedError } from '../types/error';

/**
 * Database operation errors
 * For connection failures, constraint violations, etc.
 */
export class DatabaseError extends CustomError {
  public statusCode = 500;
  public operation: string;
  public constraint?: string;
  
  constructor(
    message: string = 'Database operation failed',
    operation: string = 'unknown',
    constraint?: string
  ) {
    super(message);
    this.operation = operation;
    this.constraint = constraint;
  }

  serializeErrors(): SerializedError[] {
    return [{
      message: this.message,
      operation: this.operation,
      constraint: this.constraint
    }];
  }
}