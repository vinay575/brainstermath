// Enhanced Admin Dashboard JavaScript with Charts
const API_URL = 'http://localhost:3000/api';

let currentTab = 'students';
let allStudents = [];
let allVideos = [];
let editingStudentId = null;
let studentsLevelChart = null;
let levelPieChart = null;

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token || role !== 'admin') {
    window.location.href = 'index.html';
    return;
  }
  
  loadDashboard();
  
  // Auto-refresh statistics every 10 seconds
  setInterval(loadStatistics, 10000);
});

// Load all dashboard data
async function loadDashboard() {
  await loadStatistics();
  await loadStudents();
  await loadAllVideos();
}

// Load statistics and update charts
async function loadStatistics() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_URL}/students/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load statistics');
    
    const stats = await response.json();
    
    // Update cards
    document.getElementById('totalStudents').textContent = stats.total;
    document.getElementById('activeLevels').textContent = stats.byLevel.length;
    document.getElementById('totalVideos').textContent = allVideos.length;
    
    // Update charts
    updateCharts(stats.byLevel);
    
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

// Update Chart.js charts
function updateCharts(levelData) {
  const labels = levelData.map(item => `Level ${item.level}`);
  const data = levelData.map(item => item.count);
 const colors = [
  '#7f62ab', // violet
  '#6dcfaf', // teal
  '#a7e2cf', // greenish shade
  '#fde468', // yellow
  '#f26c4a', // tomato shade
  '#7399c6', // blue shade
  '#f1f2f4', // light gray
  '#7f62ab'  // violet again (used for indigo replacement)
];

  



  // Bar Chart
  const barCtx = document.getElementById('studentsLevelChart');
  if (studentsLevelChart) {
    studentsLevelChart.data.labels = labels;
    studentsLevelChart.data.datasets[0].data = data;
    studentsLevelChart.update();
  } else {
    studentsLevelChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Students',
          data: data,
          backgroundColor: colors.slice(0, levelData.length),
          borderRadius: 8,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }
  
  // Pie Chart
  const pieCtx = document.getElementById('levelPieChart');
  if (levelPieChart) {
    levelPieChart.data.labels = labels;
    levelPieChart.data.datasets[0].data = data;
    levelPieChart.update();
  } else {
    levelPieChart = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, levelData.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}

// Tab switching
function switchTab(tab) {
  currentTab = tab;
  
  // Update tab buttons
  document.getElementById('studentsTab').classList.toggle('active', tab === 'students');
  document.getElementById('videosTab').classList.toggle('active', tab === 'videos');
  
  // Show/hide sections
  document.getElementById('studentsSection').style.display = tab === 'students' ? 'block' : 'none';
  document.getElementById('videosSection').style.display = tab === 'videos' ? 'block' : 'none';
}

// ===== STUDENTS MANAGEMENT =====

async function loadStudents() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_URL}/students`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load students');
    
    allStudents = await response.json();
    renderStudentsTable();
    
    // Reload statistics after loading students
    await loadStatistics();
  } catch (error) {
    console.error('Error loading students:', error);
    document.getElementById('studentsTableBody').innerHTML = `
      <tr><td colspan="5" class="text-center py-8 text-red-600">Failed to load students</td></tr>
    `;
  }
}

function renderStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  
  if (allStudents.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="text-center py-8 text-gray-500">No students yet</td></tr>
    `;
    return;
  }
  
  tbody.innerHTML = allStudents.map(student => `
    <tr class="fade-in hover:bg-purple-50 transition">
      <td class="py-3 px-4">${student.full_name}</td>
      <td class="py-3 px-4">${student.email}</td>
      <td class="py-3 px-4">
        <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          Level ${student.level}
        </span>
      </td>
      <td class="py-3 px-4">${student.phone || '-'}</td>
      <td class="py-3 px-4">
        <div class="flex space-x-2">
          <button 
            onclick="editStudent(${student.id})"
            class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
          >
            Edit
          </button>
          <button 
            onclick="deleteStudent(${student.id})"
            class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddStudentModal() {
  editingStudentId = null;
  document.getElementById('studentModalTitle').textContent = 'Add Student';
  document.getElementById('studentForm').reset();
  document.getElementById('passwordField').style.display = 'block';
  document.getElementById('studentPassword').required = true;
  document.getElementById('studentModal').classList.remove('hidden');
}

function editStudent(id) {
  const student = allStudents.find(s => s.id === id);
  if (!student) return;
  
  editingStudentId = id;
  document.getElementById('studentModalTitle').textContent = 'Edit Student';
  document.getElementById('studentId').value = id;
  document.getElementById('studentName').value = student.full_name;
  document.getElementById('studentEmail').value = student.email;
  document.getElementById('studentPhone').value = student.phone || '';
  document.getElementById('studentAddress').value = student.address || '';
  document.getElementById('studentLevelSelect').value = student.level;
  document.getElementById('passwordField').style.display = 'none';
  document.getElementById('studentPassword').required = false;
  document.getElementById('studentModal').classList.remove('hidden');
}

function closeStudentModal() {
  document.getElementById('studentModal').classList.add('hidden');
  editingStudentId = null;
}

document.getElementById('studentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const token = localStorage.getItem('token');
  const formData = {
    full_name: document.getElementById('studentName').value.trim(),
    email: document.getElementById('studentEmail').value.trim(),
    phone: document.getElementById('studentPhone').value.trim(),
    address: document.getElementById('studentAddress').value.trim(),
    level: parseInt(document.getElementById('studentLevelSelect').value)
  };
  
  if (!editingStudentId) {
    formData.password = document.getElementById('studentPassword').value;
  }
  
  try {
    const url = editingStudentId 
      ? `${API_URL}/students/${editingStudentId}`
      : `${API_URL}/students`;
    
    const method = editingStudentId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save student');
    }
    
    closeStudentModal();
    loadStudents();
  } catch (error) {
    alert(error.message);
  }
});

async function deleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
    return;
  }
  
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_URL}/students/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to delete student');
    
    loadStudents();
  } catch (error) {
    alert(error.message);
  }
}

// ===== VIDEOS MANAGEMENT =====

async function loadAllVideos() {
  allVideos = [];
  const token = localStorage.getItem('token');
  
  try {
    // Load grouped videos (no A/B duplication)
    const response = await fetch(`${API_URL}/sheets/all-grouped`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      allVideos = await response.json();
    }
    
    renderVideos();
    // Update video count
    document.getElementById('totalVideos').textContent = allVideos.length;
  } catch (error) {
    console.error('Error loading videos:', error);
  }
}

function filterVideos() {
  renderVideos();
}

function renderVideos() {
  const grid = document.getElementById('videosGrid');
  const filterLevel = document.getElementById('videoLevelFilter').value;
  
  let videosToShow = allVideos;
  if (filterLevel) {
    videosToShow = allVideos.filter(v => v.level === parseInt(filterLevel));
  }
  
  if (videosToShow.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-600">No videos found</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = videosToShow.map(video => {
    const rangeText = video.sheet_start === video.sheet_end 
      ? `Sheet ${video.sheet_start}A-${video.sheet_end}B`
      : `Sheets ${video.sheet_start}A-${video.sheet_end}B`;
    
    return `
      <div class="glass-card rounded-xl p-4 fade-in hover:shadow-lg transition cursor-pointer" 
           onclick="playVideo('${video.video_url}', '${video.video_title || rangeText}')">
        <div class="flex justify-between items-start mb-3">
          <div>
            <div class="text-sm text-purple-600 font-medium">Level ${video.level}</div>
            <div class="text-lg font-bold text-gray-800">${rangeText}</div>
            <div class="text-xs text-teal-600 mt-1">${
              video.video_type === 's3' ? 'Imported from S3' : (video.video_type || 'youtube')
            }</div>
          </div>
          <button 
            onclick="event.stopPropagation(); deleteVideo(${video.id})"
            class="text-red-600 hover:bg-red-50 p-2 rounded transition"
            title="Delete video"
          >
            🗑️
          </button>
        </div>
        <div class="mt-3 text-center">
          <button class="px-4 py-2 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition"
                  style="background-color: #7f62ab;">
            ▶ Play Video
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openAddVideoModal() {
  document.getElementById('videoForm').reset();
  document.getElementById('videoModal').classList.remove('hidden');
  toggleVideoFields();
}

function closeVideoModal() {
  document.getElementById('videoModal').classList.add('hidden');
}

function toggleVideoFields() {
  const videoType = document.getElementById('videoType').value;
  const urlLabel = document.getElementById('videoUrlLabel');
  const urlHint = document.getElementById('videoUrlHint');
  
  if (videoType === 'youtube') {
    urlLabel.textContent = 'YouTube Embed URL *';
    urlHint.textContent = 'For YouTube: https://www.youtube.com/embed/VIDEO_ID';
  } else if (videoType === 'drive') {
    urlLabel.textContent = 'Google Drive Shareable Link *';
    urlHint.textContent = 'Make sure the link has "Anyone with the link can view" permission';
  } else {
    urlLabel.textContent = 'Direct Video URL *';
    urlHint.textContent = 'Direct link to video file (mp4, webm, etc.)';
  }
}

document.getElementById('videoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const token = localStorage.getItem('token');
  const formData = {
    level: parseInt(document.getElementById('videoLevel').value),
    sheet_start: parseInt(document.getElementById('sheetStart').value),
    sheet_end: document.getElementById('sheetEnd').value ? parseInt(document.getElementById('sheetEnd').value) : null,
    slide: document.getElementById('videoSlide').value,
    video_url: document.getElementById('videoUrl').value.trim(),
    video_title: document.getElementById('videoTitle').value.trim(),
    video_type: document.getElementById('videoType').value
  };
  
  try {
    const response = await fetch(`${API_URL}/sheets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save video');
    }
    
    closeVideoModal();
    loadAllVideos();
  } catch (error) {
    alert(error.message);
  }
});

async function deleteVideo(id) {
  if (!confirm('Are you sure you want to delete this video?')) {
    return;
  }
  
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_URL}/sheets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to delete video');
    
    loadAllVideos();
  } catch (error) {
    alert(error.message);
  }
}

// Sync videos from S3
async function syncS3Videos() {
  const syncBtn = document.getElementById('syncS3Btn');
  const originalText = syncBtn.innerHTML;
  
  try {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<svg class="animate-spin h-4 w-4 mr-2 inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Syncing...';
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/sheets/sync-s3`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Sync failed');
    }

    alert(`✅ ${data.message}`);
    await loadAllVideos(); // Reload videos after sync
  } catch (error) {
    console.error('S3 sync error:', error);
    alert('Failed to sync S3 videos: ' + error.message);
  } finally {
    syncBtn.disabled = false;
    syncBtn.innerHTML = originalText;
  }
}

// Logout function
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// ===== VIDEO UPLOAD FUNCTIONALITY =====

function openUploadVideoModal() {
  document.getElementById('uploadVideoForm').reset();
  document.getElementById('uploadProgress').classList.add('hidden');
  document.getElementById('uploadPreview').textContent = 'Select options to see filename...';
  document.getElementById('uploadVideoModal').classList.remove('hidden');
}

function closeUploadVideoModal() {
  document.getElementById('uploadVideoModal').classList.add('hidden');
}

// Update filename preview as user types
document.getElementById('uploadLevel')?.addEventListener('change', updateUploadPreview);
document.getElementById('uploadSheetStart')?.addEventListener('input', updateUploadPreview);
document.getElementById('uploadSheetEnd')?.addEventListener('input', updateUploadPreview);

function updateUploadPreview() {
  const level = document.getElementById('uploadLevel').value;
  const start = document.getElementById('uploadSheetStart').value;
  const end = document.getElementById('uploadSheetEnd').value || start;
  
  if (level && start) {
    document.getElementById('uploadPreview').textContent = `Filename will be: L${level}_${start}_${end}.mp4`;
  } else {
    document.getElementById('uploadPreview').textContent = 'Select options to see filename...';
  }
}

// Handle video upload
document.getElementById('uploadVideoForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const token = localStorage.getItem('token');
  const fileInput = document.getElementById('videoFile');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Please select a video file');
    return;
  }
  
  const level = document.getElementById('uploadLevel').value;
  const sheetStart = document.getElementById('uploadSheetStart').value;
  const sheetEnd = document.getElementById('uploadSheetEnd').value || sheetStart;
  
  const formData = new FormData();
  formData.append('video', file);
  formData.append('level', level);
  formData.append('sheet_start', sheetStart);
  formData.append('sheet_end', sheetEnd);
  
  const submitBtn = document.getElementById('uploadSubmitBtn');
  const progressDiv = document.getElementById('uploadProgress');
  const progressBar = document.getElementById('uploadProgressBar');
  const progressText = document.getElementById('uploadProgressText');
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';
    progressDiv.classList.remove('hidden');
    
    // Create XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        progressBar.style.width = percentComplete + '%';
        progressText.textContent = `Uploading: ${Math.round(percentComplete)}%`;
      }
    });
    
    xhr.addEventListener('load', async () => {
      if (xhr.status === 200) {
        progressText.textContent = 'Upload complete!';
        alert('✅ Video uploaded successfully!');
        closeUploadVideoModal();
        await loadAllVideos();
      } else {
        const error = JSON.parse(xhr.responseText);
        throw new Error(error.error || 'Upload failed');
      }
    });
    
    xhr.addEventListener('error', () => {
      throw new Error('Upload failed');
    });
    
    xhr.open('POST', `${API_URL}/sheets/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
    
  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to upload video: ' + error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Upload Video';
  }
});

// Video player modal
function playVideo(url, title) {
  const modal = document.getElementById('videoPlayerModal');
  const iframe = document.getElementById('videoPlayerIframe');
  const titleEl = document.getElementById('videoPlayerTitle');
  
  titleEl.textContent = title || 'Video Player';
  iframe.src = url;
  modal.classList.remove('hidden');
}

function closeVideoPlayerModal() {
  const modal = document.getElementById('videoPlayerModal');
  const iframe = document.getElementById('videoPlayerIframe');
  
  iframe.src = '';
  modal.classList.add('hidden');
}
