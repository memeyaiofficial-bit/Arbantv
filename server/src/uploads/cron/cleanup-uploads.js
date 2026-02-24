/**
 * Cleanup Cron Job
 * Deletes abandoned uploads older than 24 hours
 */
const { databases, DATABASE_ID, COLLECTION_UPLOAD_SESSIONS } = require('../../config/appwrite');
const { Query } = require('node-appwrite');
const uploadManager = require('../services/upload-manager');

const CLEANUP_AGE_HOURS = 24;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Run every hour

/**
 * Cleanup abandoned uploads
 */
async function cleanupAbandonedUploads() {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - CLEANUP_AGE_HOURS);

    // Query for abandoned uploads (not completed, older than cutoff)
    // Note: Appwrite doesn't support complex queries directly, so we'll fetch all and filter
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_UPLOAD_SESSIONS,
      [
        // Filter for non-completed uploads
        Query.notEqual('status', 'completed'),
      ]
    );

    const abandonedUploads = response.documents.filter((doc) => {
      const createdAt = new Date(doc.createdAt);
      return createdAt < cutoffTime;
    });

    console.log(`Found ${abandonedUploads.length} abandoned uploads to cleanup`);

    // Cleanup each abandoned upload
    for (const upload of abandonedUploads) {
      try {
        // Delete chunks if any were uploaded
        if (upload.uploadedChunks && upload.uploadedChunks.length > 0) {
          const { cleanupChunks } = require('../utils/chunk-merger');
          await cleanupChunks(upload.uploadId, upload.totalChunks);
        }

        // Delete session
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_UPLOAD_SESSIONS,
          upload.$id
        );

        console.log(`Cleaned up upload session: ${upload.uploadId}`);
      } catch (error) {
        console.error(`Failed to cleanup upload ${upload.uploadId}: ${error.message}`);
      }
    }

    return {
      cleaned: abandonedUploads.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Cleanup job error:', error);
    throw error;
  }
}

/**
 * Start cleanup cron job
 */
function startCleanupCron() {
  console.log('Starting upload cleanup cron job...');
  
  // Run immediately on start
  cleanupAbandonedUploads().catch((error) => {
    console.error('Initial cleanup failed:', error);
  });

  // Then run periodically
  setInterval(() => {
    cleanupAbandonedUploads().catch((error) => {
      console.error('Periodic cleanup failed:', error);
    });
  }, CLEANUP_INTERVAL_MS);
}

module.exports = {
  cleanupAbandonedUploads,
  startCleanupCron,
};
