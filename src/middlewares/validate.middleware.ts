import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    req.body = parsed.body;
    req.params = parsed.params;

    next();
  };
