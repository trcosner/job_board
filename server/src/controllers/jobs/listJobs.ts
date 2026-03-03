import { Request, Response } from 'express';
import { JobsFiltersQuery } from '../../schemas/jobSchemas.js';
import { searchJobs } from '../../services/JobService/index.js';

/**
 * List/search jobs with filters
 * GET /api/jobs
 */
export const listJobsController = async (req: Request, res: Response) => {
  const query = req.query as unknown as JobsFiltersQuery;

  const filters = {
    search: query.search,
    location: query.location,
    job_type: query.job_type as any,
    remote: query.remote,
    experience_level: query.experience_level as any,
    skills: query.skills,
    salary_min: query.salary_min,
    salary_max: query.salary_max,
    company_id: query.company_id,
    status: (query.status || 'active') as any,
  };

  const pagination = {
    page: query.page || 1,
    limit: query.limit || 20,
  };

  const results = await searchJobs(filters, pagination);

  res.status(200).json(results);
};
