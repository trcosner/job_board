import { Request, Response } from 'express';
import { JobsQueryParams } from '../../schemas/jobSchemas';
import { calculatePagination, calculateOffset } from '../../utils/pagination';

export const listJobsController = async (req: Request, res: Response) => {
  const query = req.query as unknown as JobsQueryParams;
  const userId = req.user?.id; // Available if user is logged in

  // TODO: Implement job listing logic
  // - Build SQL query with filters
  // - Apply pagination (page, limit)
  // - Join with companies table
  // - If userId exists, join with saved_jobs to mark favorites
  // - Order by created_at DESC
  // - Use calculateOffset(query.page, query.limit) for SQL OFFSET
  // - Get total count from database
  // - Use calculatePagination(query.page, query.limit, total) for response

  const total = 0; // TODO: Get from database COUNT query
  const offset = calculateOffset(query.page, query.limit);
  const pagination = calculatePagination(query.page, query.limit, total);

  res.status(200).json({
    data: [], // TODO: Replace with actual jobs from database
    pagination,
    message: 'Job listing endpoint - not yet implemented',
  });
};
