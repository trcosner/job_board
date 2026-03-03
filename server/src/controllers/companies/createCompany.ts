import { TypedRequest, TypedResponse } from '../../types/express.js';
import { Company } from '../../types/company.js';
import { CreateCompanyBody } from '../../schemas/companySchemas.js';
import { createCompany } from '../../services/CompanyService/index.js';

/**
 * Create a new company (employer onboarding)
 * POST /api/companies
 */
export const createCompanyController = async (
  req: TypedRequest<CreateCompanyBody>,
  res: TypedResponse<Company>
) => {
  const userId = req.user!.id;
  const companyData = req.body;

  const company = await createCompany(userId, companyData);

  res.status(201).json({ company });
};
