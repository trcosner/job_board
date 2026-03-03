import { Request, Response } from 'express';
import { searchApplications } from '../../services/ApplicationService/index.js';

/**
 * Get all applications for a company (employer view)
 * GET /api/companies/:id/applications
 */
export const getCompanyApplicationsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const companyId = req.params.id as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as any;
  const reviewed = req.query.reviewed !== undefined
    ? req.query.reviewed === 'true'
    : undefined;

  const results = await searchApplications(
    userId,
    { company_id: companyId, status, reviewed },
    { page, limit }
  );

  res.status(200).json(results);
};
