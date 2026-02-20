import { databases } from "../config/appwrite.js";
import { Query } from "appwrite";

export const preventDuplicateView = async (req, res, next) => {
  const { videoId, sessionId } = req.body;

  const result = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    process.env.ENGAGEMENT_COLLECTION_ID,
    [
      Query.equal("videoId", videoId),
      Query.equal("sessionId", sessionId),
      Query.equal("type", "view")
    ]
  );

  if (result.total > 0) {
    return res.status(200).json({
      message: "View already counted for this session"
    });
  }

  next();
};