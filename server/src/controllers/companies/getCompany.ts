import { Request, Response } from 'express';
import { getCompanyWithStats } from '../../services/CompanyService/index.js';

/**
 * Get company by ID
 * GET /api/companies/:id
 */
export const getCompanyController = async (req: Request, res: Response) => {
  const companyId = req.params.id as string;

  const company = await getCompanyWithStats(companyId);

  if (!company) {
    return res.status(404).json({ message: 'Company not found' });
  }

  res.status(200).json({ company });
};
