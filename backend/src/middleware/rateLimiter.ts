import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
    count: number;
    lastRequestTime: number;
}

interface RateLimiterOptions {
    windowMs: number;   // Time window in milliseconds
    maxRequests: number; // Max requests per window per IP
}

const rateLimiter = (options: RateLimiterOptions) => {
    const { windowMs, maxRequests } = options;
    const ipStore = new Map<string, RateLimitRecord>();

    return (req: Request, res: Response, next: NextFunction): void => {
        const ip = req.ip || req.connection.remoteAddress || "unknown";

        const now = Date.now();
        const record = ipStore.get(ip);

        if (!record) {
            // First request from this IP
            ipStore.set(ip, { count: 1, lastRequestTime: now });
            return next();
        }

        const timeSinceLast = now - record.lastRequestTime;

        if (timeSinceLast > windowMs) {
            // Window expired → reset counter
            ipStore.set(ip, { count: 1, lastRequestTime: now });
            return next();
        }

        if (record.count >= maxRequests) {
            const retryAfter = Math.ceil((windowMs - timeSinceLast) / 1000);
            res.setHeader("Retry-After", retryAfter.toString());
            res.status(429).json({
                success: false,
                message: `Too many requests. Try again in ${retryAfter} seconds.`,
            });
            return;
        }

        // Increment request count
        record.count += 1;
        ipStore.set(ip, record);
        next();
    };
};

export default rateLimiter;
