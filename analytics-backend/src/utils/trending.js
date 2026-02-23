export const calculateTrendingScore = (metrics) => {
  const recentViewsWeight = metrics.totalViews * 0.4;
  const likeRatio =
    metrics.totalViews > 0
      ? (metrics.likesCount / metrics.totalViews) * 0.2
      : 0;

  const watchWeight =
    metrics.totalViews > 0
      ? (metrics.averageWatchTime / 100) * 0.2
      : 0;

  const shareWeight =
    metrics.totalViews > 0
      ? (metrics.sharesCount / metrics.totalViews) * 0.2
      : 0;

  return (
    recentViewsWeight + likeRatio + watchWeight + shareWeight
  );
};