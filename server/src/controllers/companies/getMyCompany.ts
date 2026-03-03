import { Request, Response } from 'express';
import { getUserCompany } from '../../services/CompanyService/index.js';

/**
 * Get current user's company (employer)
 * GET /api/companies/me
 */
export const getMyCompanyController = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const company = await getUserCompany(userId);

  if (!company) {
    return res.status(404).json({ message: 'Company not found' });
  }

  res.status(200).json({ company });
};
