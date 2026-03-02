import { SerializedError } from "../types/error";

export abstract class CustomError extends Error {
    abstract statusCode: number;

    constructor(message: string) {
        super(message);
        
        // Ensure proper inheritance in ES modules
        Object.setPrototypeOf(this, new.target.prototype);
    }

    abstract serializeErrors(): SerializedError[];
}