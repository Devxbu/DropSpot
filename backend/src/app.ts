import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import rateLimiter from './middleware/rateLimiter';
import routes from './routes';

export function createApp() {
    const app = express();

    app.use(helmet());
    app.use(cors());
    app.use(express.json());

    app.use(rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 100 })); // 100 requests per 15 minutes
    
    app.use(routes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}