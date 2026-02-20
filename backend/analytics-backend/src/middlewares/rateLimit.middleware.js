import rateLimit from "express-rate-limit";

export const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    message: "Too many requests, please slow down."
  }
});