import express from 'express';
import {
  createCompanyController,
  updateCompanyController,
  uploadLogoController,
  getCompanyController,
  getCompanyBySlugController,
  getMyCompanyController,
  listCompaniesController,
  deleteCompanyController,
} from '../controllers/companies';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest';
import { authenticateToken, requireUserType, requireCompany } from '../middleware/auth';
import { validateEnvironment } from '../config/environment';
import { rateLimit, getKey } from '../middleware/rateLimit';
import { uploadSingle, handleMulterError } from '../middleware/upload';
import { cache, invalidateCache, CACHE_TTL } from '../middleware/cache';
import { trackUserAction } from '../middleware/observability';
import {
  createCompanySchema,
  updateCompanySchema,
  companyIdParamSchema,
  companySlugParamSchema,
  companyFiltersSchema,
} from '../schemas/companySchemas';
import { listJobsController } from '../controllers/jobs';
import { jobFiltersSchema } from '../schemas/jobSchemas';
import { getCompanyApplicationsController } from '../controllers/applications';

const companiesRouter = express.Router();
const env = validateEnvironment();

/**
 * GET /companies
 * List / search companies (public)
 */
companiesRouter.get('/',
  rateLimit({ max: 100, window: 15 * 60, getKey: getKey.byIP }),
  validateQuery(companyFiltersSchema),
  listCompaniesController
);

/**
 * POST /companies
 * Create a new company — employer onboarding
 * Auth required; user must be an employer without an existing company
 */
companiesRouter.post('/',
  authenticateToken(env),
  rateLimit({ max: 10, window: 60 * 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  validateBody(createCompanySchema),
  trackUserAction('company_created'),
  createCompanyController
);

/**
 * GET /companies/me
 * Get the authenticated employer's own company
 * Must be declared BEFORE /:id so it is not shadowed
 */
companiesRouter.get('/me',
  authenticateToken(env),
  rateLimit({ max: 60, window: 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  getMyCompanyController
);

/**
 * GET /companies/slug/:slug
 * Get company by URL slug (public)
 */
companiesRouter.get('/slug/:slug',
  rateLimit({ max: 100, window: 60, getKey: getKey.byIP }),
  validateParams(companySlugParamSchema),
  cache({
    key: 'company_slug',
    getId: (req) => Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug,
    ttl: CACHE_TTL.MEDIUM,
  }),
  getCompanyBySlugController
);

/**
 * GET /companies/:id/jobs
 * List active jobs for a specific company (public)
 * Uses the shared listJobs controller with company_id pre-injected from the route param
 */
companiesRouter.get('/:id/jobs',
  rateLimit({ max: 100, window: 60, getKey: getKey.byIP }),
  validateParams(companyIdParamSchema),
  (req, _res, next) => {
    // Inject the company_id into the query so the shared controller can filter
    req.query.company_id = req.params.id;
    next();
  },
  validateQuery(jobFiltersSchema),
  listJobsController
);

/**
 * GET /companies/:id/applications
 * List all applications for a company (auth, employer, must own company)
 */
companiesRouter.get('/:id/applications',
  authenticateToken(env),
  rateLimit({ max: 60, window: 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  validateParams(companyIdParamSchema),
  trackUserAction('company_applications_viewed', (req) => ({ companyId: req.params.id })),
  getCompanyApplicationsController
);

/**
 * GET /companies/:id
 * Get a company by UUID (public)
 */
companiesRouter.get('/:id',
  rateLimit({ max: 100, window: 60, getKey: getKey.byIP }),
  validateParams(companyIdParamSchema),
  cache({
    key: 'company',
    getId: (req) => Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    ttl: CACHE_TTL.MEDIUM,
  }),
  getCompanyController
);

/**
 * PATCH /companies/:id
 * Update company details (auth, employer, must own company)
 */
companiesRouter.patch('/:id',
  authenticateToken(env),
  rateLimit({ max: 30, window: 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  validateParams(companyIdParamSchema),
  validateBody(updateCompanySchema),
  invalidateCache({
    getKeys: (req) => [
      `company:${req.params.id}`,
      `company_slug:*`,
    ],
  }),
  trackUserAction('company_updated', (req) => ({ companyId: req.params.id })),
  updateCompanyController
);

/**
 * POST /companies/:id/logo
 * Upload / replace company logo (auth, employer, must own company)
 */
companiesRouter.post('/:id/logo',
  authenticateToken(env),
  rateLimit({ max: 10, window: 60 * 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  validateParams(companyIdParamSchema),
  uploadSingle('logo', 'image'),
  handleMulterError,
  invalidateCache({
    getKeys: (req) => [`company:${req.params.id}`],
  }),
  trackUserAction('company_logo_uploaded', (req) => ({ companyId: req.params.id })),
  uploadLogoController
);

/**
 * DELETE /companies/:id
 * Soft-delete a company (auth, employer, must own company)
 */
companiesRouter.delete('/:id',
  authenticateToken(env),
  rateLimit({ max: 5, window: 60 * 60, getKey: getKey.byUser }),
  requireUserType('employer'),
  validateParams(companyIdParamSchema),
  invalidateCache({
    getKeys: (req) => [`company:${req.params.id}`],
  }),
  trackUserAction('company_deleted', (req) => ({ companyId: req.params.id })),
  deleteCompanyController
);

export default companiesRouter;
