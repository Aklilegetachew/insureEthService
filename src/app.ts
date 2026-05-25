import path from 'node:path';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { requestLogger } from './middlewares/request-logger.middleware.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { adminCustomerRouter } from './modules/admin/customers/customer.routes.js';
import { adminReportsRouter } from './modules/admin/reports/reports.routes.js';
import { adminStaffRouter } from './modules/admin/staff/staff.routes.js';
import {
  adminClaimRouter,
  claimRouter,
} from './modules/claims/claim.routes.js';
import {
  adminDocumentRouter,
  documentRouter,
} from './modules/documents/document.routes.js';
import {
  adminPaymentRouter,
  paymentRouter,
} from './modules/payments/payment.routes.js';
import {
  adminPolicyRouter,
  policyRouter,
} from './modules/policies/policy.routes.js';
import { productRouter } from './modules/products/product.routes.js';
import {
  adminQuotationRouter,
  quotationRouter,
} from './modules/quotations/quotation.routes.js';
import { ApiResponse } from './utils/api-response.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    // origin: env.CORS_ORIGIN,
    // credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
app.use(requestLogger);

app.get('/api/health', (_req, res) => {
  res.status(200).json(
    ApiResponse.success({
      message: 'Insurance platform backend is healthy',
      data: {
        environment: env.NODE_ENV,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    }),
  );
});

const apiV1Router = express.Router();

apiV1Router.use('/auth', authRouter);
apiV1Router.use('/admin/staff', adminStaffRouter);
apiV1Router.use('/admin/customers', adminCustomerRouter);
apiV1Router.use('/products', productRouter);
apiV1Router.use('/quotations', quotationRouter);
apiV1Router.use('/admin/quotations', adminQuotationRouter);
apiV1Router.use('/policies', policyRouter);
apiV1Router.use('/admin/policies', adminPolicyRouter);
apiV1Router.use('/payments', paymentRouter);
apiV1Router.use('/admin/payments', adminPaymentRouter);
apiV1Router.use('/claims', claimRouter);
apiV1Router.use('/admin/claims', adminClaimRouter);
apiV1Router.use('/documents', documentRouter);
apiV1Router.use('/admin/documents', adminDocumentRouter);
apiV1Router.use('/admin/reports', adminReportsRouter);

apiV1Router.get('/health', (_req, res) => {
  res.status(200).json(
    ApiResponse.success({
      message: 'Insurance platform API v1 is healthy',
      data: {
        environment: env.NODE_ENV,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    }),
  );
});

app.use('/api/v1', apiV1Router);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
