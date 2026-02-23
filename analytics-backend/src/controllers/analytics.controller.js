import * as analyticsService from "../services/analytics.service.js";

export const trackView = async (req, res) => {
  const result = await analyticsService.handleEvent("view", req.body);
  res.json(result);
};

export const trackLike = async (req, res) => {
  const result = await analyticsService.handleEvent("like", req.body);
  res.json(result);
};

export const trackShare = async (req, res) => {
  const result = await analyticsService.handleEvent("share", req.body);
  res.json(result);
};

export const trackWatchTime = async (req, res) => {
  const result = await analyticsService.handleEvent("watch", req.body);
  res.json(result);
};

export const getVideoAnalytics = async (req, res) => {
  const data = await analyticsService.getVideoMetrics(req.params.videoId);
  res.json(data);
};

export const getTrending = async (req, res) => {
  const data = await analyticsService.getTrendingVideos();
  res.json(data);
};