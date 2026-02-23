import { databases } from "../config/appwrite.js";
import { calculateTrendingScore } from "../utils/trending.js";
import { ID, Query } from "appwrite";

const DB = process.env.APPWRITE_DATABASE_ID;
const EVENTS = process.env.ENGAGEMENT_COLLECTION_ID;
const METRICS = process.env.METRICS_COLLECTION_ID;

export const handleEvent = async (type, payload) => {
  const { userId, videoId, sessionId, watchDuration = 0 } = payload;

  // 1️⃣ Save engagement event
  await databases.createDocument(DB, EVENTS, ID.unique(), {
    type,
    userId,
    videoId,
    sessionId,
    watchDuration,
    createdAt: new Date().toISOString()
  });

  // 2️⃣ Get existing metrics
  const existing = await databases.listDocuments(DB, METRICS, [
    Query.equal("videoId", videoId)
  ]);

  let metrics;

  if (existing.total === 0) {
    metrics = await databases.createDocument(DB, METRICS, ID.unique(), {
      videoId,
      totalViews: 0,
      uniqueViews: 0,
      likesCount: 0,
      sharesCount: 0,
      totalWatchTime: 0,
      averageWatchTime: 0,
      trendingScore: 0
    });
  } else {
    metrics = existing.documents[0];
  }

  // 3️⃣ Update metrics
  let updateData = {};

  if (type === "view") updateData.totalViews = metrics.totalViews + 1;
  if (type === "like") updateData.likesCount = metrics.likesCount + 1;
  if (type === "share") updateData.sharesCount = metrics.sharesCount + 1;
  if (type === "watch") {
    const newWatchTime = metrics.totalWatchTime + watchDuration;
    updateData.totalWatchTime = newWatchTime;
    updateData.averageWatchTime =
      newWatchTime / (metrics.totalViews || 1);
  }

  const updated = await databases.updateDocument(
    DB,
    METRICS,
    metrics.$id,
    updateData
  );

  // 4️⃣ Recalculate trending score
  const trendingScore = calculateTrendingScore(updated);
  await databases.updateDocument(DB, METRICS, updated.$id, {
    trendingScore
  });

  return updated;
};

export const getVideoMetrics = async (videoId) => {
  const result = await databases.listDocuments(DB, METRICS, [
    Query.equal("videoId", videoId)
  ]);
  return result.documents[0] || {};
};

export const getTrendingVideos = async () => {
  const result = await databases.listDocuments(DB, METRICS, [
    Query.orderDesc("trendingScore")
  ]);
  return result.documents;
};