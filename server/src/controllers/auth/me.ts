import { Request, Response } from 'express';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { AuthService } from '../../services/index.js';

export const meController = async (req: Request, res: Response) => {
  // User is guaranteed to exist because authenticateToken middleware
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const authService = new AuthService();
  const userProfile = await authService.getUserProfile(req.user.id);

  res.status(200).json({
    message: 'Profile retrieved successfully',
    user: userProfile,
  });
};
