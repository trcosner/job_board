import { Request, Response } from 'express';
import { deleteCompany } from '../../services/CompanyService/index.js';

/**
 * Delete company (soft delete)
 * DELETE /api/companies/:id
 */
export const deleteCompanyController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const companyId = req.params.id as string;

  await deleteCompany(userId, companyId);

  res.status(204).send();
};
