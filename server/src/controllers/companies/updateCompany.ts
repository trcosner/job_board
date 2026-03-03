import { TypedRequest, TypedResponse } from '../../types/express.js';
import { Company } from '../../types/company.js';
import { UpdateCompanyBody } from '../../schemas/companySchemas.js';
import { updateCompany } from '../../services/CompanyService/index.js';

/**
 * Update company details
 * PATCH /api/companies/:id
 */
export const updateCompanyController = async (
  req: TypedRequest<UpdateCompanyBody>,
  res: TypedResponse<Company>
) => {
  const userId = req.user!.id;
  const companyId = req.params.id as string;
  const updates = req.body;

  const company = await updateCompany(userId, companyId, updates);

  res.status(200).json({ company });
};
