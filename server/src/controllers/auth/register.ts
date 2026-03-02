import { TypedRequest, TypedResponse } from '../../types/express.js';
import { RegistrationResponse } from '../../types/auth.js';
import { RegisterRequestBody } from '../../schemas/authSchemas.js';
import { AuthService } from '../../services/index.js';

export const registerController = async (
  req: TypedRequest<RegisterRequestBody>,
  res: TypedResponse<RegistrationResponse>
) => {
  const { email, password, firstName, lastName, userType } = req.body;

  const authService = new AuthService();
  const response = await authService.register({
    email,
    password,
    firstName,
    lastName,
    userType,
  });

  res.status(201).json(response);
};
