const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Parse video filename to extract level and sheet range
 * Format: L{level}_{sheetStart}_{sheetEnd}.mp4
 * Example: L1_1_5.mp4 -> { level: 1, sheetStart: 1, sheetEnd: 5 }
 */
function parseVideoFilename(filename) {
  const regex = /L(\d+)_(\d+)_(\d+)\.mp4$/;
  const match = filename.match(regex);
  
  if (!match) {
    return null;
  }
  
  return {
    level: parseInt(match[1]),
    sheetStart: parseInt(match[2]),
    sheetEnd: parseInt(match[3]),
    filename: filename
  };
}

/**
 * List all videos from S3 bucket with the specified prefix
 */
async function listVideosFromS3() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: process.env.AWS_BUCKET_PREFIX,
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    // Parse each video file
    const videos = [];
    for (const item of response.Contents) {
      const filename = item.Key.replace(process.env.AWS_BUCKET_PREFIX, '');
      const parsed = parseVideoFilename(filename);
      
      if (parsed) {
        // Generate public URL for the video
         const videoUrl = `https://solutions.brainstermath.com/${item.Key}`;
        videos.push({
          ...parsed,
          videoUrl,
          s3Key: item.Key,
          size: item.Size,
          lastModified: item.LastModified
        });
      }
    }

    return videos;
  } catch (error) {
    console.error('Error listing S3 videos:', error);
    throw new Error('Failed to fetch videos from S3');
  }
}

/**
 * Get a signed URL for a specific video (for private buckets)
 * Use this if your bucket is private and needs authenticated access
 */
async function getSignedVideoUrl(s3Key, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Sync videos from S3 to database (simplified - no A/B duplication)
 * This will add/update videos based on S3 contents
 */
async function syncVideosFromS3(pool) {
  try {
    const s3Videos = await listVideosFromS3();
    
    if (s3Videos.length === 0) {
      return { synced: 0, message: 'No videos found in S3 bucket' };
    }

    let syncedCount = 0;
    
    for (const video of s3Videos) {
      const videoTitle = `Level ${video.level} Sheets ${video.sheetStart}-${video.sheetEnd}`;
      
      // Check if video already exists (only check for slide A since we're not duplicating)
      const [existing] = await pool.execute(
        'SELECT id FROM sheet_videos WHERE level = ? AND sheet_start = ? AND sheet_end = ? AND slide = ?',
        [video.level, video.sheetStart, video.sheetEnd, 'A']
      );

      if (existing.length > 0) {
        // Update existing video
        await pool.execute(
          'UPDATE sheet_videos SET video_url = ?, video_type = ?, video_title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [video.videoUrl, 's3', videoTitle, existing[0].id]
        );
      } else {
        // Insert new video (only slide A, no duplication)
        await pool.execute(
          'INSERT INTO sheet_videos (level, sheet_start, sheet_end, slide, video_url, video_type, video_title) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [video.level, video.sheetStart, video.sheetEnd, 'A', video.videoUrl, 's3', videoTitle]
        );
      }
      
      syncedCount++;
    }

    return {
      synced: syncedCount,
      message: `Successfully synced ${syncedCount} videos from ${s3Videos.length} S3 files`
    };
  } catch (error) {
    console.error('Error syncing S3 videos:', error);
    throw error;
  }
}

/**
 * Upload a video file to S3 with automatic renaming
 * @param {Buffer} fileBuffer - The video file buffer
 * @param {number} level - Student level
 * @param {number} sheetStart - Starting sheet number
 * @param {number} sheetEnd - Ending sheet number
 * @returns {Promise<object>} Upload result with URL
 */
async function uploadVideoToS3(fileBuffer, level, sheetStart, sheetEnd) {
  try {
    // Generate filename: L{level}_{sheetStart}_{sheetEnd}.mp4
    const filename = `L${level}_${sheetStart}_${sheetEnd}.mp4`;
    const s3Key = `${process.env.AWS_BUCKET_PREFIX}${filename}`;

    // Upload to S3
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: 'video/mp4',
      },
    });

    await upload.done();

    // Generate public URL
    const videoUrl = `https://solutions.brainstermath.com/${s3Key}`;
    return {
      success: true,
      videoUrl,
      s3Key,
      filename,
      level,
      sheetStart,
      sheetEnd
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload video to S3');
  }
}

/**
 * Delete a video from S3
 */
async function deleteVideoFromS3(s3Key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete video from S3');
  }
}

module.exports = {
  listVideosFromS3,
  parseVideoFilename,
  getSignedVideoUrl,
  syncVideosFromS3,
  uploadVideoToS3,
  deleteVideoFromS3
};
