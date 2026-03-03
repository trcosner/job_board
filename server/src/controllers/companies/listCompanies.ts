import { Request, Response } from 'express';
import { CompanyFiltersQuery } from '../../schemas/companySchemas.js';
import { searchCompanies } from '../../services/CompanyService/index.js';

/**
 * List/search companies with filters
 * GET /api/companies
 */
export const listCompaniesController = async (req: Request, res: Response) => {
  const query = req.query as unknown as CompanyFiltersQuery;

  const filters = {
    search: query.search,
    company_size: query.company_size,
    location: query.location,
    industry: query.industry,
  };

  const pagination = {
    page: query.page || 1,
    limit: query.limit || 20,
  };

  const results = await searchCompanies(filters, pagination);

  res.status(200).json(results);
};
