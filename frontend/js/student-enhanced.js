// Enhanced Student Dashboard JavaScript
const API_URL = 'http://localhost:3000/api';

let currentLevel = 1;
let accessibleLevels = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 15;
let allVideos = [];
let pendingRequests = [];

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token || role !== 'student') {
    window.location.href = 'login.html';
    return;
  }
  
  currentLevel = parseInt(localStorage.getItem('level')) || 1;
  accessibleLevels = JSON.parse(localStorage.getItem('accessibleLevels') || '[]');
  
  if (accessibleLevels.length === 0) {
    accessibleLevels = [currentLevel];
  }
  
  // Display student info
  document.getElementById('studentEmail').textContent = localStorage.getItem('email');
  
  // Load data
  loadAccessibleLevels();
  loadVideos();
  loadMyRequests();
});

// Load accessible levels
async function loadAccessibleLevels() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_URL}/level-access/my-levels`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      accessibleLevels = await response.json();
      localStorage.setItem('accessibleLevels', JSON.stringify(accessibleLevels));
      renderLevelBadges();
      populateLevelFilter();
    }
  } catch (error) {
    console.error('Error loading accessible levels:', error);
  }
}

// Render level badges
function renderLevelBadges() {
  const container = document.getElementById('levelBadges');
  container.innerHTML = accessibleLevels.map(level => `
    <div class="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
      level === currentLevel ? 'bg-[#7e62a8] text-white' : 'bg-white text-[#271d47]'
    } shadow-sm">
      Level ${level}
    </div>
  `).join('');
}

// Populate level filter dropdown
function populateLevelFilter() {
  const select = document.getElementById('levelFilter');
  select.innerHTML = `
    <option value="">All Accessible Levels</option>
    ${accessibleLevels.map(level => `
      <option value="${level}">Level ${level}</option>
    `).join('')}
  `;
}

// Load videos
async function loadVideos() {
  const token = localStorage.getItem('token');
  document.getElementById('loadingState').classList.remove('hidden');
  
  try {
    // Load videos for all accessible levels
    const videoPromises = accessibleLevels.map(level =>
      fetch(`${API_URL}/sheets/level/${level}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.ok ? res.json() : [])
    );
    
    const videosPerLevel = await Promise.all(videoPromises);
    allVideos = videosPerLevel.flat();
    
    document.getElementById('loadingState').classList.add('hidden');
    renderVideos();
  } catch (error) {
    console.error('Error loading videos:', error);
    document.getElementById('loadingState').classList.add('hidden');
  }
}

// Render videos
function renderVideos() {
  const container = document.getElementById('videoGrid');
  const searchValue = document.getElementById('sheetSearch').value;
  const levelFilter = document.getElementById('levelFilter').value;
  
  // Filter videos
  let filteredVideos = allVideos;
  
  if (levelFilter) {
    filteredVideos = filteredVideos.filter(v => v.level == levelFilter);
  }
  
  if (searchValue) {
    const searchNum = parseInt(searchValue);
    filteredVideos = filteredVideos.filter(v => 
      v.sheet_start <= searchNum && v.sheet_end >= searchNum
    );
  }
  
  // Group by level and sheet range
  const grouped = {};
  filteredVideos.forEach(video => {
    const key = `${video.level}-${video.sheet_start}-${video.sheet_end}`;
    if (!grouped[key]) {
      grouped[key] = {
        level: video.level,
        sheet_start: video.sheet_start,
        sheet_end: video.sheet_end,
        videos: {}
      };
    }
    grouped[key].videos[video.slide] = video;
  });
  
  const groupedArray = Object.values(grouped);
  
  // Pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = groupedArray.slice(startIndex, endIndex);
  
  // Render
  if (paginatedItems.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="text-6xl mb-4">📚</div>
        <p class="text-gray-600">No videos available yet</p>
      </div>
    `;
  } else {
    container.innerHTML = paginatedItems.map(item => {
      const rangeText = item.sheet_start === item.sheet_end
        ? `Sheet ${item.sheet_start}`
        : `Sheets ${item.sheet_start}-${item.sheet_end}`;
      
      const sheetRangeText = item.sheet_start === item.sheet_end
        ? `Sheet ${item.sheet_start}A-${item.sheet_start}B`
        : `Sheets ${item.sheet_start}A-${item.sheet_end}B`;
      
      return `
        <div class="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-6 border border-gray-200">
          <div class="mb-4">
            <div class="text-sm font-semibold text-[#7e62a8] mb-1">Level ${item.level}</div>
            <h3 class="text-lg font-bold text-[#271d47]">${sheetRangeText}</h3>
          </div>
          
          ${item.videos['A'] || item.videos['B'] ? `
            <button 
              onclick="playVideo(${item.level}, ${item.sheet_start}, '${item.videos['A'] ? 'A' : 'B'}')"
              class="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#7e62a8] to-[#9b7ec7] text-white rounded-lg hover:shadow-md transition font-semibold"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
              </svg>
              <span>Play Video</span>
            </button>
          ` : `
            <div class="w-full px-6 py-4 bg-gray-100 text-gray-400 rounded-lg text-center font-semibold">
              Video Not Available
            </div>
          `}
        </div>
      `;
    }).join('');
  }
  
  // Update pagination
  updatePagination(groupedArray.length);
}

// Update pagination
function updatePagination(totalItems) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
  pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
}

// Change page
function changePage(direction) {
  currentPage += direction;
  renderVideos();
}

// Filter videos
function filterVideos() {
  currentPage = 1;
  renderVideos();
}

// Play video
function playVideo(level, sheet, slide) {
  window.location.href = `video-player.html?level=${level}&sheet=${sheet}&slide=${slide}`;
}

// Open request modal
function openRequestModal() {
  document.getElementById('requestModal').classList.remove('hidden');
  
  // Populate level options (only levels student doesn't have access to)
  const select = document.getElementById('requestLevel');
  const availableLevels = [1, 2, 3, 4, 5, 6, 7, 8].filter(l => !accessibleLevels.includes(l));
  
  if (availableLevels.length === 0) {
    select.innerHTML = '<option value="">You have access to all levels</option>';
    document.querySelector('#requestModal form button[type="submit"]').disabled = true;
  } else {
    select.innerHTML = availableLevels.map(l => `
      <option value="${l}">Level ${l}</option>
    `).join('');
    document.querySelector('#requestModal form button[type="submit"]').disabled = false;
  }
}

// Close request modal
function closeRequestModal() {
  document.getElementById('requestModal').classList.add('hidden');
  document.getElementById('requestForm').reset();
}

// Submit level request
// Function to show a popup message
function showPopup(message, type = 'success') {
  let popup = document.getElementById('popup');

  // If popup div doesn't exist, create it
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'popup';
    document.body.appendChild(popup);

    Object.assign(popup.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      color: '#fff',
      zIndex: 1000,
      opacity: 0,
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      transform: 'translateY(-20px)',
    });
  }

  popup.textContent = message;
  popup.style.backgroundColor = type === 'success' ? '#4ade80' : '#f87171'; // green or red
  popup.style.opacity = 1;
  popup.style.transform = 'translateY(0)';

  // Hide after 3 seconds
  setTimeout(() => {
    popup.style.opacity = 0;
    popup.style.transform = 'translateY(-20px)';
  }, 3000);
}

// Form submission
document.getElementById('requestForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const formData = new FormData(e.target);

  const data = {
    requested_level: parseInt(formData.get('level')),
    message: formData.get('message')
  };

  try {
    const response = await fetch(`${API_URL}/level-access/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      showPopup('Level access request submitted successfully!', 'success');
      closeRequestModal();
      loadMyRequests();
    } else {
      showPopup(result.error || 'Failed to submit request', 'error');
    }
  } catch (error) {
    console.error('Error submitting request:', error);
    showPopup('Failed to submit request', 'error');
  }
});

// Load my requests
async function loadMyRequests() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_URL}/level-access/my-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      pendingRequests = await response.json();
      renderMyRequests();
      updateNotificationBadge();
    }
  } catch (error) {
    console.error('Error loading requests:', error);
  }
}

// Render my requests
function renderMyRequests() {
  const container = document.getElementById('myRequests');
  
  if (pendingRequests.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        No requests yet
      </div>
    `;
    return;
  }
  
  container.innerHTML = pendingRequests.map(req => `
    <div class="p-4 rounded-lg border ${
      req.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
      req.status === 'approved' ? 'bg-green-50 border-green-200' :
      'bg-red-50 border-red-200'
    }">
      <div class="flex justify-between items-start mb-2">
        <div>
          <span class="font-semibold text-[#271d47]">Level ${req.requested_level}</span>
          <span class="ml-2 px-2 py-1 text-xs rounded-full ${
            req.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
            req.status === 'approved' ? 'bg-green-200 text-green-800' :
            'bg-red-200 text-red-800'
          }">
            ${req.status.charAt(0).toUpperCase() + req.status.slice(1)}
          </span>
        </div>
        <span class="text-xs text-gray-500">${new Date(req.created_at).toLocaleDateString()}</span>
      </div>
      ${req.message ? `<p class="text-sm text-gray-600 mb-2">Your message: ${req.message}</p>` : ''}
      ${req.admin_response ? `
        <div class="mt-2 pt-2 border-t border-gray-200">
          <p class="text-sm font-medium text-gray-700">Admin response:</p>
          <p class="text-sm text-gray-600">${req.admin_response}</p>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Update notification badge
function updateNotificationBadge() {
  const processedRequests = pendingRequests.filter(r => r.status !== 'pending' && !r.seen);
  const badge = document.getElementById('notificationBadge');
  
  if (processedRequests.length > 0) {
    badge.textContent = processedRequests.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// Toggle notifications
function toggleNotifications() {
  const panel = document.getElementById('notificationsPanel');
  panel.classList.toggle('hidden');
}

// Logout
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}