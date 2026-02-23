# Arban TV Resumable Upload System - Understanding Report

## System Overview

The Arban TV resumable upload system is designed to handle large video file uploads efficiently by breaking them into smaller chunks. This approach provides several benefits:

1. **Resumability**: Uploads can be paused and resumed
2. **Reliability**: Failed chunks can be retried without re-uploading entire files
3. **Progress Tracking**: Real-time upload progress monitoring
4. **Scalability**: Handles large files without memory issues

## Architecture Components

### 1. Appwrite Configuration (`config/appwrite.js`)
- Initializes Appwrite SDK client
- Configures storage buckets for chunks and final videos
- Sets up database connection for session tracking

### 2. Upload Manager Service (`services/upload-manager.js`)
Core service handling:
- **Session Management**: Creates and tracks upload sessions
- **Chunk Upload**: Handles individual chunk uploads to Appwrite storage
- **Progress Tracking**: Updates session with uploaded chunk indices
- **Chunk Merging**: Combines chunks into final video file
- **Finalization**: Moves merged file to final bucket and cleans up chunks

### 3. Rate Limiting (`middleware/rate-limit.js`)
- In-memory rate limiting per IP address
- Prevents abuse and DoS attacks
- Configurable window and max requests

### 4. Chunk Merger Utility (`utils/chunk-merger.js`)
- Merges chunks in correct numerical order
- Handles file system operations
- Ensures data integrity during merge

### 5. Cleanup Cron Job (`cron/cleanup-uploads.js`)
- Removes stale upload sessions older than 24 hours
- Cleans up orphaned chunk files
- Prevents storage bloat

## Data Flow

1. **Session Creation**: Client requests new upload session with file metadata
2. **Chunk Upload**: Client uploads chunks sequentially or in parallel
3. **Progress Updates**: Each chunk upload updates the session document
4. **Completion Check**: System checks if all chunks are uploaded
5. **Merging**: When complete, chunks are merged into final video
6. **Finalization**: Merged file moved to videos bucket, chunks deleted
7. **Cleanup**: Stale sessions and chunks cleaned up periodically

## Storage Structure

- **Chunks Bucket**: Temporary storage for individual chunks
- **Videos Bucket**: Final storage for completed videos
- **Database Collection**: Tracks upload sessions and progress

## Dependencies

- `node-appwrite`: Appwrite SDK for Node.js
- `uuid`: Generates unique session IDs
- Express.js: Web framework (assumed)

## Environment Variables

All configuration is externalized via environment variables for flexibility and security.
