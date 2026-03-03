import { TypedRequest, TypedResponse } from '../../types/express.js';
import { Job } from '../../types/job.js';
import { UpdateJobBody } from '../../schemas/jobSchemas.js';
import { updateJob } from '../../services/JobService/index.js';

/**
 * Update a job posting
 * PATCH /api/jobs/:id
 */
export const updateJobController = async (
  req: TypedRequest<UpdateJobBody>,
  res: TypedResponse<Job>
) => {
  const userId = req.user!.id;
  const jobId = req.params.id as string;
  const updates = req.body;

  const job = await updateJob(userId, jobId, updates);

  res.status(200).json({ job });
};
