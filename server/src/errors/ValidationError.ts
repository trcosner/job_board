import { ZodError } from 'zod';
import { SerializedError } from '../types/error';
import { CustomError } from './CustomError';

export class ValidationError extends CustomError {
    statusCode = 400;

    constructor(private zodError: ZodError) {
        super('Validation failed');
    }

    serializeErrors(): SerializedError[] {
        return this.zodError.issues.map(err => {
            return {
                message: err.message,
                field: err.path.join('.')
            };
        });
    }
}