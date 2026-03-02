import { Request, Response, NextFunction } from "express";
import { CustomError } from "../errors/CustomError";
import { RateLimitError } from "../errors/RateLimitError";
import logger from "../utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle rate limit errors with special headers
  if (err instanceof RateLimitError) {
    logger.warn('Rate limit exceeded', {
      error: err.message,
      retryAfter: err.retryAfter,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    res.set('Retry-After', err.retryAfter.toString());
    return res.status(err.statusCode).send({ errors: err.serializeErrors() });
  }

  if (err instanceof CustomError && typeof err.serializeErrors === 'function') {
    // Log custom errors at warn level with context
    logger.warn('Custom error occurred', {
      error: err.message,
      statusCode: err.statusCode,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    return res.status(err.statusCode).send({ errors: err.serializeErrors() });
  }

  // Log unexpected errors at error level with full context
  logger.error('Unhandled error occurred', {
    error: err?.message || 'Unknown error',
    stack: err?.stack || 'No stack trace',
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent') || 'Unknown',
    ip: req.ip || 'Unknown',
    body: req.body || {},
    params: req.params || {},
    query: req.query || {}
  });

  
  return res
    .status(500)
    .send({ 
      errors: [{ 
        message: err.message
      }] 
    });
};