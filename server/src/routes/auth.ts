import express from "express";
import { registerBodySchema, loginBodySchema } from '../schemas/authSchemas';
import { validateBody } from "../middleware/validateRequest";
import { authenticateToken } from '../middleware/auth';
import { validateEnvironment } from '../config/environment';
import { trackUserAction } from '../middleware/observability';
import { authRateLimit, strictRateLimit } from "../middleware/rateLimit";
import { registerController, loginController, refreshController, meController, logoutController } from '../controllers/auth';

const authRouter = express.Router();

// Register new user
authRouter.post('/register',
    authRateLimit,
    validateBody(registerBodySchema),
    trackUserAction('user_register'),
    registerController
);

// User login
authRouter.post('/login',
    authRateLimit,
    validateBody(loginBodySchema),
    trackUserAction('user_login'),
    loginController
);

// Refresh access token
authRouter.post('/refresh',
    strictRateLimit, // More restrictive rate limit for token refresh
    refreshController
);

// Get current user profile (protected route)
authRouter.get('/me',
    authenticateToken(validateEnvironment()),
    meController
);

// Logout (revoke refresh token)
authRouter.post('/logout',
    authenticateToken(validateEnvironment()),
    trackUserAction('user_logout'),
    logoutController
);

export default authRouter;