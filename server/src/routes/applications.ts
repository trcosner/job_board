import express from 'express';
import {
  getApplicationController,
  getMyApplicationsController,
  getJobApplicationsController,
  updateApplicationStatusController,
  updateApplicationController,
  withdrawApplicationController,
  deleteApplicationController,
  getResumeController,
  getJobApplicationStatsController,
  getMyApplicationStatsController,
  getApplicationHistoryController,
} from '../controllers/applications';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest';
import { authenticateToken, requireUserType } from '../middleware/auth';
import { validateEnvironment } from '../config/environment';
import { rateLimit, getKey } from '../middleware/rateLimit';
import { invalidateCache } from '../middleware/cache';
import { trackUserAction } from '../middleware/observability';
import {
  applicationIdParamSchema,
  applicationFiltersSchema,
  updateApplicationStatusSchema,
  updateApplicationSchema,
} from '../schemas/applicationSchemas';

const applicationsRouter = express.Router();
const env = validateEnvironment();

/**
 * GET /applications/me
 * List the authenticated job seeker's own applications (paginated, filterable)
 */
applicationsRouter.get('/me',
  authenticateToken(env),
  rateLimit({ max: 60, window: 60, getKey: getKey.byUser }),
  requireUserType('job_seeker'),
  validateQuery(applicationFiltersSchema),
  trackUserAction('my_applications_viewed'),
  getMyApplicationsController
);

/**
 * GET /applications/stats/me
 * Summary statistics for the authenticated job seeker's applications
 */
applicationsRouter.get('/stats/me',
  authenticateToken(env),
  rateLimit({ max: 60, window: 60, getKey: getKey.byUser }),
  requireUserType('job_seeker'),
  getMyApplicationStatsController
);

/**
 * GET /applications/:id
 * Get a single application (auth required; seeker owns it OR employer owns the job)
 */
applicationsRouter.get('/:id',
  authenticateToken(env),
  rateLimit({ max: 60, window: 60, getKey: getKey.byUser }),
  validateParams(applicationIdParamSchema),
  trackUserAction('application_viewed', (req) => ({ applicationId: req.params.id })),
  getApplicationController
);

/**
 * GET /applications/:id/history
 * Status-change history for an application
 */
applicationsRouter.get('/:id/history',
  authenticateToken(env),
  rateLimit({ max: 60, window: 60, getKey: getKey.byUser }),
  validateParams(applicationIdParamSchema),
  getApplicationHistoryController
);

/**
 * GET /applications/:id/resume
 * Download / get signed URL for the applicant's resume
 */
applicationsRouter.get('/:id/resume',
  authenticateToken(env),
  rateLimit({ max: 30, window: 60, getKey: getKey.byUser }),
  validateParams(applicationIdParamSchema),
  trackUserAction('resume_downloaded', (req) => ({ applicationId: req.params.id })),
  getResumeController
);

/**
 * PATCH /applications/:id
 * Update application details (auth, job_seeker owns application)
 * Allows the applicant to edit supplementary info before first review
 */
applicationsRouter.patch('/:id',
  authenticateToken(env),
  rateLimit({ max: 10, window: 60, getKey: getKey.byUser }),
  requireUserType('job_seeker'),
  validateParams(applicationIdParamSchema),
  validateBody(updateApplicationSchema),
  invalidateCache({
    getKeys: (req) => [`application:${req.params.id}`],
  }),
  trackUserAction('application_updated', (req) => ({ applicationId: req.params.id })),
  updateApplicationController
);

/**
 * PATCH /applications/:id/status
 * Move application through the hiring pipeline (auth, employer owns the job)
 */
applicationsRouter.patch('/:id/status',
  authenticateToken(env),
  rateLimit({ max: 30, window: 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  validateParams(applicationIdParamSchema),
  validateBody(updateApplicationStatusSchema),
  invalidateCache({
    getKeys: (req) => [`application:${req.params.id}`],
  }),
  trackUserAction('application_status_updated', (req) => ({
    applicationId: req.params.id,
    newStatus: req.body.status,
  })),
  updateApplicationStatusController
);

/**
 * DELETE /applications/:id
 * Withdraw an application (auth, job_seeker owns application)
 * Soft-deletes / marks as withdrawn; only allowed pre-interview
 */
applicationsRouter.delete('/:id',
  authenticateToken(env),
  rateLimit({ max: 10, window: 60 * 60, getKey: getKey.byUser }),
  requireUserType('job_seeker'),
  validateParams(applicationIdParamSchema),
  invalidateCache({
    getKeys: (req) => [`application:${req.params.id}`],
  }),
  trackUserAction('application_withdrawn', (req) => ({ applicationId: req.params.id })),
  withdrawApplicationController
);

export default applicationsRouter;
