import { SerializedError } from '../types/error';
import { CustomError } from './CustomError';

export class UnauthorizedError extends CustomError {
    statusCode = 401;

    constructor(message: string = 'Not authorized') {
        super(message);
    }

    serializeErrors(): SerializedError[] {
        return [{ message: this.message }];
    }
}