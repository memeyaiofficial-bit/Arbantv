# Arban TV Resumable Upload System

## Overview

This system implements a resumable video upload service using Appwrite for storage and database management. It allows clients to upload large video files in chunks, resume interrupted uploads, and merge chunks into final video files.

## Architecture

### Components

1. **Upload Manager Service** (`services/upload-manager.js`)
   - Manages upload sessions
   - Handles chunk uploads
   - Merges chunks into final videos
   - Tracks upload progress

2. **Rate Limiting Middleware** (`middleware/rate-limit.js`)
   - Prevents abuse
   - Configurable rate limits per IP

3. **Chunk Merger Utility** (`utils/chunk-merger.js`)
   - Merges uploaded chunks in correct order
   - Handles file system operations

4. **Cleanup Cron Job** (`cron/cleanup-uploads.js`)
   - Removes stale upload sessions
   - Cleans up orphaned chunks

## Configuration

Environment variables required (see `.env.example`):
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_BUCKET_VIDEO_CHUNKS`
- `APPWRITE_BUCKET_VIDEOS`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_COLLECTION_UPLOAD_SESSIONS`

## Usage

### Creating an Upload Session

```javascript
const uploadManager = require('./services/upload-manager');
const sessionId = await uploadManager.createUploadSession(
    'video.mp4',
    1024000,
    10
);
```

### Uploading a Chunk

```javascript
await uploadManager.uploadChunk(sessionId, chunkIndex, chunkBuffer);
```

### Finalizing Upload

```javascript
const finalFile = await uploadManager.mergeAndFinalize(sessionId);
```

## API Endpoints

See `routes/video-upload.js` for API endpoint implementations.

## Cleanup

Run the cleanup cron job periodically to remove stale uploads:

```javascript
const { cleanupOldUploads } = require('./cron/cleanup-uploads');
await cleanupOldUploads();
```
