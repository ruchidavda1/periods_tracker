import rateLimit from 'express-rate-limit';
// Rate Limiter (Fixed Window with sliding behavior)
// Uses MemoryStore by default - works for single server
// For production scaling,we consider Redis store for true Sliding Window Counter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  // RateLimit-Limit: 100
  // RateLimit-Remaining: 99,
  // RateLimit-Reset: 1709472000,
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
