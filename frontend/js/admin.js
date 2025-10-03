// Admin Dashboard JavaScript
const API_URL = 'https://brainstermath.onrender.com/api';

let currentTab = 'students';
let allStudents = [];
let allVideos = [];
let editingStudentId = null;

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token || role !== 'admin') {
    window.location.href = 'index.html';
    return;
  }
  
  loadStudents();
  loadAllVideos();
});

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
    <tr class="fade-in">
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
    // Load videos for all levels
    for (let level = 1; level <= 8; level++) {
      const response = await fetch(`${API_URL}/sheets/level/${level}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const levelVideos = await response.json();
        allVideos.push(...levelVideos);
      }
    }
    
    renderVideos();
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
  
  grid.innerHTML = videosToShow.map(video => `
    <div class="glass-card rounded-xl p-4 fade-in">
      <div class="flex justify-between items-start mb-3">
        <div>
          <div class="text-sm text-purple-600 font-medium">Level ${video.level}</div>
          <div class="text-lg font-bold text-gray-800">Sheet ${video.sheet_number} - ${video.slide}</div>
        </div>
        <button 
          onclick="deleteVideo(${video.level}, ${video.sheet_number}, '${video.slide}')"
          class="text-red-600 hover:bg-red-50 p-2 rounded transition"
        >
          🗑️
        </button>
      </div>
      <div class="text-sm text-gray-600 mb-3">${video.video_title || 'No title'}</div>
      <div class="text-xs text-gray-400 truncate">${video.video_url}</div>
    </div>
  `).join('');
}

function openAddVideoModal() {
  document.getElementById('videoForm').reset();
  document.getElementById('videoModal').classList.remove('hidden');
}

function closeVideoModal() {
  document.getElementById('videoModal').classList.add('hidden');
}

document.getElementById('videoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const token = localStorage.getItem('token');
  const formData = {
    level: parseInt(document.getElementById('videoLevel').value),
    sheet_number: parseInt(document.getElementById('videoSheet').value),
    slide: document.getElementById('videoSlide').value,
    video_url: document.getElementById('videoUrl').value.trim(),
    video_title: document.getElementById('videoTitle').value.trim()
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

async function deleteVideo(level, sheet, slide) {
  if (!confirm('Are you sure you want to delete this video?')) {
    return;
  }
  
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_URL}/sheets/${level}/${sheet}/${slide}`, {
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

// Logout function
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}
