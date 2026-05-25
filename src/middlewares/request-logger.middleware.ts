import type { IncomingMessage, ServerResponse } from 'node:http';

import { pinoHttp } from 'pino-http';

export const requestLogger = pinoHttp({
  serializers: {
    req(req: IncomingMessage) {
      return {
        method: req.method,
        url: req.url,
      };
    },
    res(res: ServerResponse) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
