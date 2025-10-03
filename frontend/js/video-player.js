// Video Player JavaScript
const API_URL = 'https://brainstermath.onrender.com/api';

let currentLevel, currentSheet, currentSlide;
let allVideos = [];
let currentVideoIndex = -1;

// Check authentication and load video
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token || role !== 'student') {
    window.location.href = 'login.html';
    return;
  }
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  currentLevel = parseInt(urlParams.get('level'));
  currentSheet = parseInt(urlParams.get('sheet'));
  currentSlide = urlParams.get('slide');
  
  if (!currentLevel || !currentSheet || !currentSlide) {
    showError('Invalid URL parameters');
    return;
  }

  // Verify student's level access
  const accessibleLevels = JSON.parse(localStorage.getItem('accessibleLevels') || '[]');
  if (!accessibleLevels.includes(currentLevel)) {
    showError('You do not have access to this level');
    return;
  }
  
  loadAllVideos();
});

// Load all videos for navigation
async function loadAllVideos() {
  const token = localStorage.getItem('token');
  const accessibleLevels = JSON.parse(localStorage.getItem('accessibleLevels') || '[]');
  
  try {
    const videoPromises = accessibleLevels.map(level =>
      fetch(`${API_URL}/sheets/level/${level}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.ok ? res.json() : [])
    );

    const videosPerLevel = await Promise.all(videoPromises);
    allVideos = videosPerLevel.flat();

    // Sort videos by level, sheet_start, slide
    allVideos.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      if (a.sheet_start !== b.sheet_start) return a.sheet_start - b.sheet_start;
      return (a.slide || 'A').localeCompare(b.slide || 'A');
    });

    // Find current video index
    currentVideoIndex = allVideos.findIndex(v => 
      v.level === currentLevel && 
      v.sheet_start === currentSheet && 
      v.slide === currentSlide
    );

    if (currentVideoIndex === -1) {
      showError('Video not found');
      return;
    }

    displayVideo(allVideos[currentVideoIndex]);
    updateNavigationButtons();
  } catch (error) {
    console.error('Error loading videos:', error);
    showError('Failed to load video. Please try again.');
  }
}

// Generate default slide letters if missing
function getSlideLetter(isStart) {
  return isStart ? 'A' : 'B';
}

// Display the video
function displayVideo(video) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('videoContent').classList.remove('hidden');

  // Determine start/end letters
  const startLetter = video.slide_start_letter || getSlideLetter(true);
  const endLetter = video.slide_end_letter || getSlideLetter(false);

  // Construct range text
  const rangeText = video.sheet_start === video.sheet_end
    ? `Sheet ${video.sheet_start}${startLetter}-${endLetter}`
    : `Sheets ${video.sheet_start}${startLetter}-${video.sheet_end}${endLetter}`;

  document.getElementById('videoTitle').textContent =
    video.video_title || `Level ${video.level} | ${rangeText}`;

  // Video player logic
  const videoPlayer = document.getElementById('videoPlayer');
  if (video.video_type === 'youtube') {
    const videoId = extractYouTubeId(video.video_url);
    videoPlayer.src = `https://www.youtube.com/embed/${videoId}`;
  } else if (video.video_type === 'drive') {
    const fileId = extractGoogleDriveId(video.video_url);
    videoPlayer.src = `https://drive.google.com/file/d/${fileId}/preview`;
  } else {
    videoPlayer.src = video.video_url;
  }

  logActivity(video.level, video.sheet_start, video.slide);
  updateNavigationButtons();
}

// Update Previous/Next buttons
function updateNavigationButtons() {
  const prevBtn = document.getElementById('prevVideo');
  const nextBtn = document.getElementById('nextVideo');

  prevBtn.disabled = currentVideoIndex <= 0;
  nextBtn.disabled = currentVideoIndex >= allVideos.length - 1;

  // Previous video info
  if (currentVideoIndex > 0) {
    const prevVideo = allVideos[currentVideoIndex - 1];
    const prevStartLetter = prevVideo.slide_start_letter || getSlideLetter(true);
    const prevEndLetter = prevVideo.slide_end_letter || getSlideLetter(false);
    const prevRange = prevVideo.sheet_start === prevVideo.sheet_end
      ? `Sheet ${prevVideo.sheet_start}${prevStartLetter}-${prevEndLetter}`
      : `Sheets ${prevVideo.sheet_start}${prevStartLetter}-${prevVideo.sheet_end}${prevEndLetter}`;
    document.getElementById('prevVideoInfo').textContent =
      `Level ${prevVideo.level} | ${prevRange}`;
  } else {
    document.getElementById('prevVideoInfo').textContent = 'No previous video';
  }

  // Next video info
  if (currentVideoIndex < allVideos.length - 1) {
    const nextVideo = allVideos[currentVideoIndex + 1];
    const nextStartLetter = nextVideo.slide_start_letter || getSlideLetter(true);
    const nextEndLetter = nextVideo.slide_end_letter || getSlideLetter(false);
    const nextRange = nextVideo.sheet_start === nextVideo.sheet_end
      ? `Sheet ${nextVideo.sheet_start}${nextStartLetter}-${nextEndLetter}`
      : `Sheets ${nextVideo.sheet_start}${nextStartLetter}-${nextVideo.sheet_end}${nextEndLetter}`;
    document.getElementById('nextVideoInfo').textContent =
      `Level ${nextVideo.level} | ${nextRange}`;
  } else {
    document.getElementById('nextVideoInfo').textContent = 'No next video';
  }
}

// Extract YouTube ID
function extractYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : url;
}

// Extract Google Drive ID
function extractGoogleDriveId(url) {
  const match = url.match(/\/d\/([^\/]+)/);
  return match ? match[1] : url;
}

// Navigate to video
function navigateVideo(direction) {
  const newIndex = currentVideoIndex + direction;
  if (newIndex >= 0 && newIndex < allVideos.length) {
    const video = allVideos[newIndex];
    window.location.href = `video-player.html?level=${video.level}&sheet=${video.sheet_start}&slide=${video.slide}`;
  }
}

// Log student activity
async function logActivity(level, sheet, slide) {
  const token = localStorage.getItem('token');
  try {
    await fetch(`${API_URL}/sheets/${level}/${sheet}/${slide}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Show error
function showError(message) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').classList.remove('hidden');
  document.getElementById('errorMessage').textContent = message;
}

// Back to dashboard
function backToDashboard() {
  window.location.href = 'student-dashboard-enhanced.html';
}
