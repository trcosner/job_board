import { Request, Response } from 'express';
import { getResumeDownloadUrl } from '../../services/ApplicationService/index.js';

/**
 * Get resume download URL (signed S3 URL)
 * GET /api/applications/:id/resume
 */
export const getResumeController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const applicationId = req.params.id as string;
  const userType = req.user!.userType as 'employer' | 'applicant';

  const url = await getResumeDownloadUrl(userId, applicationId, userType);

  res.status(200).json({ resumeUrl: url });
};
