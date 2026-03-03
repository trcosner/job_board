import express from 'express';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest';
import { authenticateToken, optionalAuth, requireUserType, requireCompany } from '../middleware/auth';
import { validateEnvironment } from '../config/environment';
import { rateLimit, getKey } from '../middleware/rateLimit';
import { trackUserAction } from '../middleware/observability';
import { cache, invalidateCache, CACHE_TTL } from '../middleware/cache';
import { uploadSingle, handleMulterError } from '../middleware/upload';
import {
  jobIdParamSchema,
  jobFiltersSchema,
  createJobSchema,
  updateJobSchema,
} from '../schemas/jobSchemas';
import {
  applicationIdParamSchema,
  applicationFiltersSchema,
  updateApplicationStatusSchema,
} from '../schemas/applicationSchemas';
import {
  listJobsController,
  getJobByIdController,
  createJobController,
  updateJobController,
  updateJobStatusController,
  deleteJobController,
  getMyJobsController,
  applyToJobController,
} from '../controllers/jobs';
import { incrementViewCount } from '../services/JobService/index.js';
import {
  getJobApplicationsController,
  getJobApplicationStatsController,
  updateApplicationStatusController,
} from '../controllers/applications';

const jobsRouter = express.Router();
const env = validateEnvironment();

// ---------------------------------------------------------------------------
// Public / optionally-authenticated routes
// ---------------------------------------------------------------------------

/**
 * GET /jobs
 * List all jobs with filtering, pagination, and search
 */
jobsRouter.get('/',
  rateLimit({ max: 100, window: 15 * 60, getKey: getKey.byIP }),
  optionalAuth(env),
  validateQuery(jobFiltersSchema),
  trackUserAction('jobs_list_viewed', (req) => ({
    page: req.query.page,
    filters: {
      location: req.query.location,
      type: req.query.type,
      remote: req.query.remote,
    },
    authenticated: !!req.user,
  })),
  listJobsController
);

/**
 * GET /jobs/my-jobs
 * Employer dashboard — list jobs belonging to the current user's company
 * Must be declared BEFORE /:id to avoid the param swallowing "my-jobs"
 */
jobsRouter.get('/my-jobs',
  authenticateToken(env),
  rateLimit({ max: 60, window: 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  trackUserAction('my_jobs_viewed'),
  getMyJobsController
);

/**
 * GET /jobs/:id
 * Get a single job by UUID (public)
 */
jobsRouter.get('/:id',
  rateLimit({ max: 200, window: 60, getKey: getKey.byIP }),
  optionalAuth(env),
  validateParams(jobIdParamSchema),
  (req, _res, next) => { incrementViewCount(req.params.id).catch(() => {}); next(); },
  cache({
    key: 'job',
    getId: (req) => Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    ttl: CACHE_TTL.MEDIUM, // 30 minutes
  }),
  trackUserAction('job_viewed', (req) => ({
    jobId: req.params.id,
    authenticated: !!req.user,
  })),
  getJobByIdController
);

// ---------------------------------------------------------------------------
// Employer-only job management
// ---------------------------------------------------------------------------

/**
 * POST /jobs
 * Create a new job posting (auth, employer, must have a company)
 */
jobsRouter.post('/',
  authenticateToken(env),
  rateLimit({ max: 20, window: 60 * 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  requireCompany,
  validateBody(createJobSchema),
  invalidateCache({ getKeys: () => ['jobs_list'] }),
  trackUserAction('job_created'),
  createJobController
);

/**
 * PATCH /jobs/:id
 * Update a job posting (auth, employer, must own via company)
 */
jobsRouter.patch('/:id',
  authenticateToken(env),
  rateLimit({ max: 30, window: 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  validateParams(jobIdParamSchema),
  validateBody(updateJobSchema),
  invalidateCache({
    getKeys: (req) => [
      `job:${req.params.id}`,
      'jobs_list',
    ],
  }),
  trackUserAction('job_updated', (req) => ({ jobId: req.params.id })),
  updateJobController
);

/**
 * PATCH /jobs/:id/status
 * Change job status: active | draft | closed (auth, employer)
 */
jobsRouter.patch('/:id/status',
  authenticateToken(env),
  rateLimit({ max: 30, window: 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  validateParams(jobIdParamSchema),
  invalidateCache({
    getKeys: (req) => [
      `job:${req.params.id}`,
      'jobs_list',
    ],
  }),
  trackUserAction('job_status_updated', (req) => ({
    jobId: req.params.id,
    status: req.body.status,
  })),
  updateJobStatusController
);

/**
 * DELETE /jobs/:id
 * Soft-delete a job (auth, employer, must own via company)
 */
jobsRouter.delete('/:id',
  authenticateToken(env),
  rateLimit({ max: 10, window: 60 * 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  validateParams(jobIdParamSchema),
  invalidateCache({
    getKeys: (req) => [
      `job:${req.params.id}`,
      'jobs_list',
    ],
  }),
  trackUserAction('job_deleted', (req) => ({ jobId: req.params.id })),
  deleteJobController
);

// ---------------------------------------------------------------------------
// Application sub-routes (nested under /jobs/:id)
// ---------------------------------------------------------------------------

/**
 * POST /jobs/:id/apply
 * Submit a job application with resume upload (auth, job_seeker only)
 * Rate-limited to 3 applications per hour per user
 */
jobsRouter.post('/:id/apply',
  authenticateToken(env),
  rateLimit({
    max: 3,
    window: 60 * 60,
    getKey: getKey.byUser,
    message: 'Too many applications submitted, please try again later',
  }),
  requireUserType('job_seeker'),
  validateParams(jobIdParamSchema),
  uploadSingle('resume', 'resume'),
  handleMulterError,
  invalidateCache({
    getKeys: (req) => [
      `user:${req.user?.id}:applications`,
      `job:${req.params.id}:applicants`,
    ],
  }),
  trackUserAction('job_application_submitted', (req) => ({ jobId: req.params.id })),
  applyToJobController
);

/**
 * GET /jobs/:id/applications
 * List applications for a job (auth, employer who owns the job)
 */
jobsRouter.get('/:id/applications',
  authenticateToken(env),
  rateLimit({ max: 60, window: 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  validateParams(jobIdParamSchema),
  validateQuery(applicationFiltersSchema),
  trackUserAction('job_applications_viewed', (req) => ({ jobId: req.params.id })),
  getJobApplicationsController
);

/**
 * GET /jobs/:id/applications/stats
 * Aggregated stats for a job's applications (auth, employer who owns the job)
 */
jobsRouter.get('/:id/applications/stats',
  authenticateToken(env),
  rateLimit({ max: 60, window: 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  validateParams(jobIdParamSchema),
  getJobApplicationStatsController
);

export default jobsRouter;
