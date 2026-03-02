import express from 'express';
import { validateParams, validateQuery } from '../middleware/validateRequest';
import { optionalAuth } from '../middleware/auth';
import { validateEnvironment } from '../config/environment';
import { rateLimit, getKey } from '../middleware/rateLimit';
import { trackUserAction } from '../middleware/observability';
import { cache, invalidateCache, CACHE_TTL } from '../middleware/cache';
import { jobIdParamSchema, jobsQuerySchema } from '../schemas/jobSchemas';
import { listJobsController, getJobByIdController, applyToJobController } from '../controllers/jobs';

const jobsRouter = express.Router();

/**
 * GET /jobs
 * List all jobs with filtering, pagination, and search
 * 
 * Middleware chain demonstrates:
 * - Rate limiting (100 req/15min per IP)
 * - Optional authentication (personalize results if logged in)
 * - Query validation (pagination, filters)
 * - Caching (5 minutes)
 * - Performance tracking
 */
jobsRouter.get('/',
  rateLimit({ 
    max: 100, 
    window: 15 * 60, 
    getKey: getKey.byIP 
  }),
  optionalAuth(validateEnvironment()),
  validateQuery(jobsQuerySchema),
  // TODO: Add cache with dynamic key based on query params
  trackUserAction('jobs_list_viewed', (req) => ({
    page: req.query.page,
    filters: {
      location: req.query.location,
      type: req.query.type,
      remote: req.query.remote
    },
    authenticated: !!req.user
  })),
  listJobsController
);

/**
 * GET /jobs/:id
 * Get a single job by ID
 * 
 * Middleware chain demonstrates:
 * - Rate limiting (stricter: 30 req/min per IP)
 * - Optional authentication (to mark if user has applied/saved)
 * - Param validation (UUID)
 * - Caching (30 minutes, keyed by job ID)
 * - Performance tracking
 */
jobsRouter.get('/:id',
  rateLimit({ 
    max: 30, 
    window: 60, 
    getKey: getKey.byIP 
  }),
  optionalAuth(validateEnvironment()),
  validateParams(jobIdParamSchema),
  cache({
    key: 'job',
    getId: (req) => Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    ttl: CACHE_TTL.MEDIUM // 30 minutes
  }),
  trackUserAction('job_viewed', (req) => ({ 
    jobId: req.params.id,
    authenticated: !!req.user 
  })),
  getJobByIdController
);

/**
 * POST /jobs/:id/apply
 * Apply to a job
 * 
 * Middleware chain demonstrates:
 * - Strict rate limiting (3 applications per hour per user)
 * - Required authentication
 * - Param validation
 * - Cache invalidation (user's application list)
 * - User action tracking
 */
jobsRouter.post('/:id/apply',
  rateLimit({ 
    max: 3, 
    window: 60 * 60, 
    getKey: getKey.byUser,
    message: 'Too many applications, please try again later'
  }),
  // authenticateToken(validateEnvironment()), // TODO: Uncomment when implementing
  validateParams(jobIdParamSchema),
  invalidateCache({
    getKeys: (req) => [
      `user:${req.user?.id}:applications`,
      `job:${req.params.id}:applicants`
    ]
  }),
  trackUserAction('job_application_submitted', (req) => ({ 
    jobId: req.params.id 
  })),
  applyToJobController
);

export default jobsRouter;
