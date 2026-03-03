import { SerializedError } from '../types/error.js';
import { CustomError } from './CustomError.js';

/**
 * Bad Request Error (400)
 * Use for client-side errors like invalid file uploads, malformed input, etc.
 * For Zod validation errors, use ValidationError instead
 */
export class BadRequestError extends CustomError {
  statusCode = 400;

  constructor(public message: string) {
    super(message);
  }

  serializeErrors(): SerializedError[] {
    return [
      {
        message: this.message,
      },
    ];
  }
}
