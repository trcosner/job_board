import { TypedRequest, TypedResponse } from '../../types/express.js';
import { LoginResponse } from '../../types/auth.js';
import { LoginRequestBody } from '../../schemas/authSchemas.js';
import { login } from '../../services/AuthService/index.js';

export const loginController = async (
  req: TypedRequest<LoginRequestBody>,
  res: TypedResponse<LoginResponse>
) => {
  const { email, password } = req.body;

  const response = await login({
    email,
    password,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(200).json(response);
};
