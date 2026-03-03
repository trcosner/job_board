import { Request, Response } from 'express';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { logout } from '../../services/AuthService/index.js';

export const logoutController = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const refreshToken = req.body?.refreshToken;
  
  await logout(req.user.id, req.user.email, refreshToken);

  res.status(200).json({
    message: 'Logged out successfully',
  });
};
