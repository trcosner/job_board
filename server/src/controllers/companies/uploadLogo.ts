import { Request, Response } from 'express';
import { uploadCompanyLogo } from '../../services/CompanyService/index.js';

/**
 * Upload company logo
 * POST /api/companies/:id/logo
 */
export const uploadLogoController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const companyId = req.params.id as string;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const company = await uploadCompanyLogo(userId, companyId, file);

  res.status(200).json({ company });
};
