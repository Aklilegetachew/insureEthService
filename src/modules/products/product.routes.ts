import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { productController } from './product.controller.js';
import {
  createProductSchema,
  listProductsSchema,
  productIdSchema,
  updateProductSchema,
} from './product.validation.js';

const router = Router();

router.get('/', optionalAuthenticate, validate(listProductsSchema), productController.listProducts);
router.get('/:id', optionalAuthenticate, validate(productIdSchema), productController.getProductById);

router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createProductSchema),
  productController.createProduct,
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateProductSchema),
  productController.updateProduct,
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(productIdSchema),
  productController.deleteProduct,
);

export const productRouter = router;
