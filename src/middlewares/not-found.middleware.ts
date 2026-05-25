import type { RequestHandler } from 'express';

import { ApiResponse } from '../utils/api-response.js';

export const notFoundMiddleware: RequestHandler = (req, res) => {
  res.status(404).json(
    ApiResponse.error({
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    }),
  );
};
