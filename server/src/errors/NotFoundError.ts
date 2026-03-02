import { SerializedError } from '../types/error';
import { CustomError } from './CustomError';

export class NotFoundError extends CustomError {
    statusCode = 404;

    constructor(){
        super("Not Found")
    }

    serializeErrors(): SerializedError[] {
        return [{ message: "Not Found" }];
    }
}