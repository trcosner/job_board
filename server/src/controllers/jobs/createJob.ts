import { TypedRequest, TypedResponse } from '../../types/express.js';
import { Job } from '../../types/job.js';
import { CreateJobBody } from '../../schemas/jobSchemas.js';
import { createJob } from '../../services/JobService/index.js';

/**
 * Create a new job posting
 * POST /api/jobs
 */
export const createJobController = async (
  req: TypedRequest<CreateJobBody>,
  res: TypedResponse<Job>
) => {
  const userId = req.user!.id;
  const companyId = (req as any).companyId as string;
  const jobData = { ...req.body, company_id: companyId };

  const job = await createJob(userId, jobData);

  res.status(201).json({ job });
};
