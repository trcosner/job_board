import { Request, Response } from 'express';
import { AuthService } from '../../services/index.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';

export const refreshController = async (req: Request, res: Response) => {
  const refreshToken = req.headers['x-refresh-token'] as string;
  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token required');
  }

  const authService = new AuthService();
  const response = await authService.refreshToken({ refreshToken });

  res.json(response);
};
