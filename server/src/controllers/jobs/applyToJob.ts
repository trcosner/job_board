import { Request, Response } from 'express';
import { JobIdParams } from '../../schemas/jobSchemas';
import { jobApplications } from '../../config/metrics';

export const applyToJobController = async (req: Request, res: Response) => {
  const { id } = req.params as JobIdParams;
  // const userId = req.user!.id; // user is guaranteed by authenticateToken

  try {
    // TODO: Implement application logic
    // - Check if job exists and is active
    // - Check if user already applied
    // - Check if user is employer (can't apply to own jobs)
    // - Insert into applications table
    // - Send notification to employer
    // - Send confirmation email to applicant

    // Track successful application
    jobApplications.labels('success').inc();

    res.status(201).json({
      message: 'Job application endpoint - not yet implemented',
      jobId: id,
    });
  } catch (error) {
    // Track failed application
    jobApplications.labels('failure').inc();
    throw error;
  }
};
