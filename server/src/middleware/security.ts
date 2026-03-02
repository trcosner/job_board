import helmet from 'helmet';
import cors from 'cors';

/**
 * ESSENTIAL: Security headers middleware
 * Single Responsibility: HTTP security headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
});

/**
 * ESSENTIAL: CORS configuration
 * Single Responsibility: Cross-origin request handling
 * 
 * Security notes:
 * - Development: Allows localhost origins for local FE development
 * - Production: ONLY allows FRONTEND_URL from environment
 * - Never allows localhost in production
 */
const getAllowedOrigins = (): string[] => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const frontendUrl = process.env.FRONTEND_URL;
  
  if (isDevelopment) {
    // Development: Allow localhost ports for local dev
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      frontendUrl
    ].filter(Boolean) as string[];
  }
  
  // Production: ONLY allow explicit frontend URL
  if (!frontendUrl) {
    console.warn('FRONTEND_URL not set in production - CORS will block all requests!');
    return [];
  }
  
  return [frontendUrl];
};

const allowedOrigins = getAllowedOrigins();

export const corsHandler = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
});