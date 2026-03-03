import { Request, Response } from 'express';
import { createApplication } from '../../services/ApplicationService/index.js';
import { jobApplications } from '../../config/metrics.js';

/**
 * Apply to a job (creates application)
 * POST /api/jobs/:id/apply
 * Requires resume file upload
 */
export const applyToJobController = async (req: Request, res: Response) => {
  const jobId = req.params.id as string;
  const userId = req.user!.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'Resume file is required' });
  }

  try {
    const applicationData = {
      job_id: jobId,
      cover_letter: req.body.cover_letter,
      phone: req.body.phone,
      linkedin_url: req.body.linkedin_url,
      portfolio_url: req.body.portfolio_url,
      years_experience: req.body.years_experience ? parseInt(req.body.years_experience) : undefined,
      current_company: req.body.current_company,
      current_title: req.body.current_title,
      expected_salary: req.body.expected_salary ? parseInt(req.body.expected_salary) : undefined,
      availability: req.body.availability,
    };

    const application = await createApplication(userId, applicationData, file);

    jobApplications.labels('success').inc();

    res.status(201).json(application);
  } catch (error) {
    jobApplications.labels('failure').inc();
    throw error;
  }
};
