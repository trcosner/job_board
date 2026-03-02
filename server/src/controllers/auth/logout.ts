import { Request, Response } from 'express';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { AuthService } from '../../services/index.js';

export const logoutController = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const authService = new AuthService();
  
  // Extract refresh token from request body (optional)
  const refreshToken = req.body?.refreshToken;
  
  await authService.logout(req.user.id, req.user.email, refreshToken);

  res.status(200).json({
    message: 'Logged out successfully',
  });
};
