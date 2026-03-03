import { TypedRequest, TypedResponse } from '../../types/express.js';
import { RegistrationResponse } from '../../types/auth.js';
import { RegisterRequestBody } from '../../schemas/authSchemas.js';
import { register } from '../../services/AuthService/index.js';

export const registerController = async (
  req: TypedRequest<RegisterRequestBody>,
  res: TypedResponse<RegistrationResponse>
) => {
  const { email, password, firstName, lastName, userType } = req.body;

  const response = await register({
    email,
    password,
    firstName,
    lastName,
    userType,
  });

  res.status(201).json(response);
};
