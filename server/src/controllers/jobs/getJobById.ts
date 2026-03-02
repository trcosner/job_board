import { Request, Response } from 'express';
import { JobIdParams } from '../../schemas/jobSchemas';

export const getJobByIdController = async (req: Request, res: Response) => {
  const { id } = req.params as JobIdParams;
  const userId = req.user?.id;

  // TODO: Implement job detail logic
  // - SELECT * FROM jobs WHERE id = $1 AND deleted_at IS NULL
  // - JOIN with companies table
  // - If userId: check if user has applied (applications table)
  // - If userId: check if user has saved (saved_jobs table)
  // - Increment view count
  // - Return job details

  // Simulate job not found
  // throw new NotFoundError('Job not found');

  res.status(200).json({
    job: {
      id,
      title: 'Senior Software Engineer',
      company: 'Example Corp',
      // ... other fields
      userHasApplied: false, // Set from DB if userId exists
      userHasSaved: false, // Set from DB if userId exists
    },
    message: 'Job detail endpoint - not yet implemented',
  });
};
