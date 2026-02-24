const express = require('express');
const multer = require('multer');
const uploadManager = require('../services/upload-manager');

// Keep these imported but we will bypass them for the demo
// const rateLimitMiddleware = require('../middleware/rate-limit');
// const authMiddleware = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, 
});

/**
 * POST /api/uploads/init
 */
router.post('/init', async (req, res) => {
  try {
    const { fileName, fileSize, userId } = req.body;

    // Use the userId from the body (from your HTML input)
    if (!fileName || !fileSize || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'fileName, fileSize, and userId are required',
      });
    }

    const result = await uploadManager.initUpload(userId, fileName, fileSize);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Init upload error:', error);
    res.status(400).json({ error: 'Failed to initialize upload', message: error.message });
  }
});

/**
 * POST /api/uploads/:id/chunk
 */
router.post('/:id/chunk', upload.single('chunk'), async (req, res) => {
  try {
    const { id: uploadId } = req.params;
    const { chunkIndex, userId } = req.body;

    if (!req.file || !userId) {
      return res.status(400).json({ error: 'Missing chunk data or userId' });
    }

    const result = await uploadManager.uploadChunk(
      uploadId,
      parseInt(chunkIndex, 10),
      req.file.buffer,
      userId
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Chunk upload error:', error);
    res.status(400).json({ error: 'Failed to upload chunk', message: error.message });
  }
});

/**
 * POST /api/uploads/:id/complete
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const { id: uploadId } = req.params;
    const { userId } = req.body;

    const result = await uploadManager.completeUpload(uploadId, userId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Complete upload error:', error);
    res.status(400).json({ error: 'Failed to complete upload', message: error.message });
  }
});

/**
 * GET /api/uploads/:id/status
 */
router.get('/:id/status', async (req, res) => {
  try {
    const { id: uploadId } = req.params;
    const { userId } = req.query; // Get userId from query string

    const status = await uploadManager.getStatus(uploadId, userId);
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(404).json({ error: 'Upload session not found', message: error.message });
  }
});

module.exports = router;