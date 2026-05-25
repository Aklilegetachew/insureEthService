import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';

import { ApiResponse } from '../utils/api-response.js';

type HttpError = Error & {
  statusCode?: number;
  status?: number;
  isOperational?: boolean;
};

const isProduction = process.env.NODE_ENV === 'production';

export const errorMiddleware: ErrorRequestHandler = (error: HttpError, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json(
      ApiResponse.error({
        message: 'Validation failed',
        errors: error.flatten().fieldErrors,
      }),
    );
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json(
      ApiResponse.error({
        message: error.code === 'LIMIT_FILE_SIZE' ? 'File size must not exceed 5MB' : error.message,
      }),
    );
    return;
  }

  const statusCode = error.statusCode ?? error.status ?? 500;
  const message = statusCode === 500 && isProduction ? 'Internal server error' : error.message;

  res.status(statusCode).json(
    ApiResponse.error({
      message,
      errors: isProduction ? undefined : { stack: error.stack },
    }),
  );
};
