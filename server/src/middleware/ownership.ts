import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/ForbiddenError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { BadRequestError } from '../errors/BadRequestError.js';

/**
 * Verify the authenticated user owns the company identified by req.params.id or req.params.companyId.
 * Must be used AFTER requireAuth.
 *
 * Sets req.company and req.companyId on the request for downstream use.
 *
 * Usage:
 *   router.patch('/companies/:id', requireAuth(env), requireEmployer, verifyCompanyOwnership, updateCompanyController)
 */
export const verifyCompanyOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const companyId = (req.params.id || req.params.companyId) as string;
  if (!companyId) {
    return next(new BadRequestError('Company ID is required'));
  }

  try {
    const { findById } = await import('../repositories/CompanyRepository/index.js');
    const company = await findById(companyId);

    if (!company) {
      return next(new NotFoundError('Company not found'));
    }

    if (company.user_id !== req.user.id) {
      return next(new ForbiddenError('You do not own this company'));
    }

    // Attach for downstream use
    (req as any).company = company;
    (req as any).companyId = company.id;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify the authenticated employer owns the job identified by req.params.id or req.params.jobId.
 * Ownership is determined by checking that the job's company_id matches the employer's company.
 * Must be used AFTER requireAuth and requireEmployer.
 *
 * Sets req.job, req.company, and req.companyId on the request for downstream use.
 *
 * Usage:
 *   router.patch('/jobs/:id', requireAuth(env), requireEmployer, verifyJobOwnership, updateJobController)
 */
export const verifyJobOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const jobId = (req.params.id || req.params.jobId) as string;
  if (!jobId) {
    return next(new BadRequestError('Job ID is required'));
  }

  try {
    const [JobRepo, CompanyRepo] = await Promise.all([
      import('../repositories/JobRepository/index.js'),
      import('../repositories/CompanyRepository/index.js'),
    ]);

    const [job, company] = await Promise.all([
      JobRepo.findById(jobId),
      CompanyRepo.findByUserId(req.user.id),
    ]);

    if (!job) {
      return next(new NotFoundError('Job not found'));
    }

    if (!company) {
      return next(new ForbiddenError('You must create a company before managing job postings'));
    }

    if (job.company_id !== company.id) {
      return next(new ForbiddenError('You do not own this job posting'));
    }

    // Attach for downstream use
    (req as any).job = job;
    (req as any).company = company;
    (req as any).companyId = company.id;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify the authenticated user has access to the application identified by req.params.id
 * or req.params.applicationId.
 *
 * Access rules:
 *  - job_seeker: must be the applicant (application.user_id === req.user.id)
 *  - employer: must own the company that posted the job (job.company_id === user's company.id)
 *
 * Must be used AFTER requireAuth.
 *
 * Sets req.application (and req.companyId for employers) on the request for downstream use.
 *
 * Usage:
 *   router.get('/applications/:id', requireAuth(env), verifyApplicationAccess, getApplicationController)
 */
export const verifyApplicationAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const applicationId = (req.params.id || req.params.applicationId) as string;
  if (!applicationId) {
    return next(new BadRequestError('Application ID is required'));
  }

  try {
    const { findByIdWithDetails } = await import('../repositories/ApplicationRepository/index.js');
    const application = await findByIdWithDetails(applicationId);

    if (!application) {
      return next(new NotFoundError('Application not found'));
    }

    const { userType } = req.user;

    if (userType === 'job_seeker') {
      if (application.user_id !== req.user.id) {
        return next(new ForbiddenError('You do not have access to this application'));
      }
    } else if (userType === 'employer') {
      const { findByUserId } = await import('../repositories/CompanyRepository/index.js');
      const company = await findByUserId(req.user.id);

      if (!company || application.job.company_id !== company.id) {
        return next(new ForbiddenError('You do not have access to this application'));
      }

      (req as any).companyId = company.id;
    } else {
      return next(new ForbiddenError('Access denied'));
    }

    // Attach application for downstream use
    (req as any).application = application;
    next();
  } catch (error) {
    next(error);
  }
};
