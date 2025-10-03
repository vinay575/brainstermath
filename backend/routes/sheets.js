const express = require('express');
const router = express.Router();
const {
  getSheetsByLevel,
  getSheetVideo,
  upsertSheetVideo,
  deleteSheetVideo,
  syncS3Videos,
  listS3Videos,
  uploadVideo,
  upload,
  getAllVideosGrouped
} = require('../controllers/sheetController');
const { verifyToken, verifyAdmin, verifyStudentAccess } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get all sheets for a level (students can only access their level)
router.get('/level/:level', verifyStudentAccess, getSheetsByLevel);

// Get specific sheet video (students can only access their level)
router.get('/:level/:sheet/:slide', verifyStudentAccess, getSheetVideo);

// Admin-only routes
router.post('/', verifyAdmin, upsertSheetVideo);
router.post('/upload', verifyAdmin, upload.single('video'), uploadVideo);
router.get('/all-grouped', verifyAdmin, getAllVideosGrouped);
router.delete('/:id', verifyAdmin, deleteSheetVideo);
router.post('/sync-s3', verifyAdmin, syncS3Videos);
router.get('/s3-list', verifyAdmin, listS3Videos);

module.exports = router;
