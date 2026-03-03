import { Request, Response } from 'express';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { getUserProfile } from '../../services/AuthService/index.js';

export const meController = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const userProfile = await getUserProfile(req.user.id);

  res.status(200).json({
    message: 'Profile retrieved successfully',
    user: userProfile,
  });
};
