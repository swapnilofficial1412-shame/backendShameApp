import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for creating promises
 * IP-based, anonymous-safe rate limiting
 * 
 * Configuration:
 * - max: Maximum number of requests per window
 * - windowMs: Time window in milliseconds
 * - message: Error message when limit is exceeded
 * - standardHeaders: Return rate limit info in `RateLimit-*` headers
 * - legacyHeaders: Disable `X-RateLimit-*` headers
 */
export const createPromiseRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '5', 10), // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many promise submissions from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Use IP address from request (works for anonymous users)
  keyGenerator: (req) => {
    // Try to get IP from various sources (works behind proxies)
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
      ? (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0])
      : req.ip || req.socket.remoteAddress || 'unknown';
    return ip;
  },
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many promise submissions from this IP, please try again later.',
      retryAfter: '15 minutes',
    });
  },
  // Skip rate limiting for successful requests (only count failures)
  skipSuccessfulRequests: false,
  // Skip rate limiting for failed requests (count all requests)
  skipFailedRequests: false,
});

