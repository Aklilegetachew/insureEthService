import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authController } from './auth.controller.js';
import { loginSchema, registerCustomerSchema } from './auth.validation.js';

const router = Router();

router.post(
  '/register-customer',
  validate(registerCustomerSchema),
  authController.registerCustomer,
);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);
router.post('/logout', authController.logout);

export const authRouter = router;
