import { TypedRequest, TypedResponse } from '../../types/express.js';
import { LoginResponse } from '../../types/auth.js';
import { LoginRequestBody } from '../../schemas/authSchemas.js';
import { AuthService } from '../../services/index.js';

export const loginController = async (
  req: TypedRequest<LoginRequestBody>,
  res: TypedResponse<LoginResponse>
) => {
  const { email, password } = req.body;

  const authService = new AuthService();
  const response = await authService.login({
    email,
    password,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(200).json(response);
};
