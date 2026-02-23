import express from "express";
import {
  trackView,
  trackLike,
  trackShare,
  trackWatchTime,
  getVideoAnalytics,
  getTrending
} from "../controllers/analytics.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { analyticsLimiter } from "../middlewares/rateLimit.middleware.js";
import { validateEngagement } from "../middlewares/validation.middleware.js";
import { preventDuplicateView } from "../middlewares/preventDuplicateView.middleware.js";

const router = express.Router();

// Tracking routes
router.post(
  "/view",
  analyticsLimiter,
  authMiddleware,
  validateEngagement,
  preventDuplicateView,
  trackView
);

router.post(
  "/like",
  analyticsLimiter,
  authMiddleware,
  validateEngagement,
  trackLike
);

router.post(
  "/share",
  analyticsLimiter,
  authMiddleware,
  validateEngagement,
  trackShare
);

router.post(
  "/watch-time",
  analyticsLimiter,
  authMiddleware,
  validateEngagement,
  trackWatchTime
);

// Reporting routes
router.get("/video/:videoId", getVideoAnalytics);
router.get("/trending", getTrending);

export default router;