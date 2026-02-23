const rateLimitMap = new Map();

const WINDOW_MS = 60000; // 60 seconds
const MAX_REQUESTS = 30;

const rateLimitMiddleware = (req, res, next) => {
    const userId = req.user?.userId || req.user?.id || 'anonymous';
    const now = Date.now();
    
    if (!rateLimitMap.has(userId)) {
        rateLimitMap.set(userId, { count: 1, resetTime: now + WINDOW_MS });
        return next();
    }
    
    const record = rateLimitMap.get(userId);
    
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + WINDOW_MS;
        return next();
    }
    
    if (record.count >= MAX_REQUESTS) {
        return res.status(429).json({
            error: 'Too many requests',
            retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
    }
    
    record.count++;
    next();
};

// Cleanup function to remove expired entries
const cleanupRateLimit = () => {
    const now = Date.now();
    for (const [userId, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(userId);
        }
    }
};

// Run cleanup every 5 minutes
setInterval(cleanupRateLimit, 5 * 60 * 1000);

module.exports = rateLimitMiddleware;
