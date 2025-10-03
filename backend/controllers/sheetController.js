const { pool } = require('../config/database');
const { syncVideosFromS3, listVideosFromS3, uploadVideoToS3, deleteVideoFromS3 } = require('../services/s3Service');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Get all sheets for a level
const getSheetsByLevel = async (req, res) => {
  const { level } = req.params;

  if (level < 1 || level > 8) {
    return res.status(400).json({ error: 'Level must be between 1 and 8.' });
  }

  try {
    const [sheets] = await pool.execute(
      'SELECT * FROM sheet_videos WHERE level = ? ORDER BY sheet_start, slide',
      [level]
    );
    
    res.json(sheets);
  } catch (error) {
    console.error('Get sheets error:', error);
    res.status(500).json({ error: 'Failed to fetch sheets.' });
  }
};

// Get specific sheet video (supports ranges)
const getSheetVideo = async (req, res) => {
  const { level, sheet, slide } = req.params;

  if (level < 1 || level > 8) {
    return res.status(400).json({ error: 'Level must be between 1 and 8.' });
  }

  if (sheet < 1 || sheet > 200) {
    return res.status(400).json({ error: 'Sheet must be between 1 and 200.' });
  }

  if (!['A', 'B'].includes(slide)) {
    return res.status(400).json({ error: 'Slide must be A or B.' });
  }

  try {
    // Find video where sheet falls within range
    const [videos] = await pool.execute(
      'SELECT * FROM sheet_videos WHERE level = ? AND ? BETWEEN sheet_start AND sheet_end AND slide = ? LIMIT 1',
      [level, sheet, slide]
    );

    if (videos.length === 0) {
      return res.status(404).json({ error: 'Video not found for this sheet.' });
    }

    // Log student activity if student is logged in
    if (req.user.role === 'student' && req.user.studentId) {
      await pool.execute(
        'INSERT INTO student_activity (student_id, level, sheet_number, slide) VALUES (?, ?, ?, ?)',
        [req.user.studentId, level, sheet, slide]
      );
    }

    res.json(videos[0]);
  } catch (error) {
    console.error('Get sheet video error:', error);
    res.status(500).json({ error: 'Failed to fetch video.' });
  }
};

// Create or update sheet video with range support (admin only)
const upsertSheetVideo = async (req, res) => {
  const { level, sheet_start, sheet_end, slide, video_url, video_title, video_type } = req.body;

  // Validation
  if (!level || !sheet_start || !slide || !video_url) {
    return res.status(400).json({ 
      error: 'Level, sheet start, slide, and video URL are required.' 
    });
  }

  const sheetEnd = sheet_end || sheet_start; // Default to single sheet

  if (level < 1 || level > 8) {
    return res.status(400).json({ error: 'Level must be between 1 and 8.' });
  }

  if (sheet_start < 1 || sheet_start > 200 || sheetEnd < 1 || sheetEnd > 200) {
    return res.status(400).json({ error: 'Sheet range must be between 1 and 200.' });
  }

  if (sheetEnd < sheet_start) {
    return res.status(400).json({ error: 'Sheet end must be greater than or equal to sheet start.' });
  }

  if (!['A', 'B'].includes(slide)) {
    return res.status(400).json({ error: 'Slide must be A or B.' });
  }

  try {
    await pool.execute(`
      INSERT INTO sheet_videos (level, sheet_start, sheet_end, slide, video_url, video_title, video_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [level, sheet_start, sheetEnd, slide, video_url, video_title || null, video_type || 'youtube']);

    res.json({ message: 'Video saved successfully' });
  } catch (error) {
    console.error('Upsert video error:', error);
    res.status(500).json({ error: 'Failed to save video.' });
  }
};

// Delete sheet video (admin only)
const deleteSheetVideo = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      'DELETE FROM sheet_videos WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Video not found.' });
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video.' });
  }
};

// Sync videos from S3 (admin only)
const syncS3Videos = async (req, res) => {
  try {
    const result = await syncVideosFromS3(pool);
    res.json(result);
  } catch (error) {
    console.error('Sync S3 videos error:', error);
    res.status(500).json({ error: 'Failed to sync videos from S3.' });
  }
};

// Get S3 video list without syncing (admin only)
const listS3Videos = async (req, res) => {
  try {
    const videos = await listVideosFromS3();
    res.json({ videos, count: videos.length });
  } catch (error) {
    console.error('List S3 videos error:', error);
    res.status(500).json({ error: 'Failed to list S3 videos.' });
  }
};

// Upload video to S3 (admin only)
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { level, sheet_start, sheet_end } = req.body;

    // Validation
    if (!level || !sheet_start) {
      return res.status(400).json({ error: 'Level and sheet start are required' });
    }

    const levelNum = parseInt(level);
    const sheetStartNum = parseInt(sheet_start);
    const sheetEndNum = sheet_end ? parseInt(sheet_end) : sheetStartNum;

    if (levelNum < 1 || levelNum > 8) {
      return res.status(400).json({ error: 'Level must be between 1 and 8' });
    }

    if (sheetStartNum < 1 || sheetEndNum > 200) {
      return res.status(400).json({ error: 'Sheet range must be between 1 and 200' });
    }

    if (sheetEndNum < sheetStartNum) {
      return res.status(400).json({ error: 'Sheet end must be >= sheet start' });
    }

    // Upload to S3
    const uploadResult = await uploadVideoToS3(
      req.file.buffer,
      levelNum,
      sheetStartNum,
      sheetEndNum
    );

    // Create single database entry (no A/B duplication)
    const videoTitle = `Level ${levelNum} Sheets ${sheetStartNum}-${sheetEndNum}`;
    
    await pool.execute(`
      INSERT INTO sheet_videos (level, sheet_start, sheet_end, slide, video_url, video_title, video_type)
      VALUES (?, ?, ?, 'A', ?, ?, 's3')
    `, [levelNum, sheetStartNum, sheetEndNum, uploadResult.videoUrl, videoTitle]);

    res.json({
      message: 'Video uploaded successfully',
      ...uploadResult
    });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload video' });
  }
};

// Get all videos grouped (no A/B duplication)
const getAllVideosGrouped = async (req, res) => {
  try {
    const [videos] = await pool.execute(`
      SELECT id, level, sheet_start, sheet_end, video_url, video_title, video_type, created_at
      FROM sheet_videos
      WHERE slide = 'A'
      ORDER BY level, sheet_start
    `);
    
    res.json(videos);
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
};

// Delete video and remove from S3 if applicable
const deleteSheetVideoEnhanced = async (req, res) => {
  const { id } = req.params;

  try {
    // Get video details first
    const [videos] = await pool.execute(
      'SELECT * FROM sheet_videos WHERE id = ?',
      [id]
    );

    if (videos.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const video = videos[0];

    // Delete from database
    await pool.execute('DELETE FROM sheet_videos WHERE id = ?', [id]);

    // If it's an S3 video, delete from S3
    if (video.video_type === 's3' && video.video_url) {
      try {
        const s3Key = video.video_url.split('.amazonaws.com/')[1];
        if (s3Key) {
          await deleteVideoFromS3(s3Key);
        }
      } catch (s3Error) {
        console.error('S3 deletion failed:', s3Error);
        // Continue even if S3 deletion fails
      }
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
};

module.exports = {
  getSheetsByLevel,
  getSheetVideo,
  upsertSheetVideo,
  deleteSheetVideo: deleteSheetVideoEnhanced,
  syncS3Videos,
  listS3Videos,
  uploadVideo,
  upload, // Export multer middleware
  getAllVideosGrouped
};
