import { Request, Response } from 'express';
import { refreshToken } from '../../services/AuthService/index.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';

export const refreshController = async (req: Request, res: Response) => {
  const token = req.headers['x-refresh-token'] as string;
  if (!token) {
    throw new UnauthorizedError('Refresh token required');
  }

  const response = await refreshToken({ refreshToken: token });

  res.json(response);
};
