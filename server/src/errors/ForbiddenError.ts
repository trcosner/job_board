import { SerializedError } from '../types/error';
import { CustomError } from './CustomError';

export class ForbiddenError extends CustomError {
    statusCode = 403;

    constructor(message: string = 'Forbidden') {
        super(message);
    }

    serializeErrors(): SerializedError[] {
        return [{ message: this.message }];
    }
}