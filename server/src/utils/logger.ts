import winston from 'winston';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

// Define log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: combine(
    errors({ stack: true }), // Handle error objects
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json() // Always use JSON for structured logging (easier for Loki to parse)
  ),
  transports: [
    // File output for production
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
  
  // Only handle exceptions in production
  ...(process.env.NODE_ENV === 'production' && {
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' })
    ],
  }),
});

// Add console transport with environment-specific formatting
const consoleFormat = process.env.NODE_ENV === 'production' 
  ? combine(json()) // JSON format for production
  : combine(
      colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let output = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          output += `\n${JSON.stringify(meta, null, 2)}`;
        }
        return output;
      })
    );

logger.add(new winston.transports.Console({
  format: consoleFormat
}));

export default logger;