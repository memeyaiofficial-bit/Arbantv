export const validateEngagement = (req, res, next) => {
  const { videoId } = req.body;

  if (!videoId) {
    return res.status(400).json({
      message: "videoId is required"
    });
  }

  next();
};