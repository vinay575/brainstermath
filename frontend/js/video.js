// Video Player JavaScript
const API_URL = 'https://brainstermath.onrender.com/api';

let currentLevel, currentSheet, currentSlide;

// Check authentication and load video
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token || role !== 'student') {
    window.location.href = 'index.html';
    return;
  }
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  currentLevel = parseInt(urlParams.get('level'));
  currentSheet = parseInt(urlParams.get('sheet'));
  currentSlide = urlParams.get('slide');
  
  // Validate parameters
  if (!currentLevel || !currentSheet || !currentSlide) {
    showError('Invalid URL parameters');
    return;
  }
  
  // Verify student's level access
  const studentLevel = parseInt(localStorage.getItem('level'));
  if (currentLevel !== studentLevel) {
    showError('You do not have access to this level');
    return;
  }
  
  loadVideo();
});

// Load video data
async function loadVideo() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(
      `${API_URL}/sheets/${currentLevel}/${currentSheet}/${currentSlide}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        showError('This sheet does not have a video yet. Please check back later.');
      } else {
        throw new Error('Failed to load video');
      }
      return;
    }
    
    const video = await response.json();
    displayVideo(video);
    
  } catch (error) {
    console.error('Error loading video:', error);
    showError('Failed to load video. Please try again.');
  }
}

// Display video
function displayVideo(video) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('videoContent').classList.remove('hidden');
  
  // Create title showing the sheet range
  const rangeText = video.sheet_start === video.sheet_end 
    ? `Sheet ${currentSheet}` 
    : `Sheets ${video.sheet_start}-${video.sheet_end}`;
  
  // Set video info
  document.getElementById('videoTitle').textContent = 
    video.video_title || `Level ${currentLevel} - ${rangeText}`;
  document.getElementById('sheetInfo').textContent = 
    `Level ${currentLevel} | ${rangeText} | Slide ${currentSlide}`;
  
  // Set video player
  document.getElementById('videoPlayer').src = video.video_url;
  
  // Update navigation buttons
  document.getElementById('prevSheet').disabled = currentSheet === 1;
  document.getElementById('nextSheet').disabled = currentSheet === 200;
}

// Show error state
function showError(message) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').classList.remove('hidden');
  document.getElementById('errorMessage').textContent = message;
}

// Navigate between sheets
function navigateSheet(direction) {
  const newSheet = currentSheet + direction;
  
  if (newSheet >= 1 && newSheet <= 200) {
    window.location.href = `student-view.html?level=${currentLevel}&sheet=${newSheet}&slide=${currentSlide}`;
  }
}
