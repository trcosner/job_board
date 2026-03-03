import { Request, Response } from 'express';
import { getCompanyWithStatsBySlug } from '../../services/CompanyService/index.js';

/**
 * Get company by slug (public URL)
 * GET /api/companies/slug/:slug
 */
export const getCompanyBySlugController = async (req: Request, res: Response) => {
  const slug = req.params.slug as string;

  const company = await getCompanyWithStatsBySlug(slug);

  if (!company) {
    return res.status(404).json({ message: 'Company not found' });
  }

  res.status(200).json({ company });
};
