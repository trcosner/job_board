import { SerializedError } from '../types/error';
import { CustomError } from './CustomError';

export class ConflictError extends CustomError {
    statusCode = 409;

    constructor(message: string = 'Resource already exists') {
        super(message);
    }

    serializeErrors(): SerializedError[] {
        return [{ message: this.message }];
    }
}