// Student Dashboard JavaScript
const API_URL = 'https://brainstermath.onrender.com/api';

let currentLevel = 1;
let currentSlide = 'A';
let currentPage = 1;
const SHEETS_PER_PAGE = 20;
let allSheets = [];

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token || role !== 'student') {
    window.location.href = 'index.html';
    return;
  }
  
  currentLevel = parseInt(localStorage.getItem('level')) || 1;
  
  // Display student info
  document.getElementById('studentName').textContent = localStorage.getItem('userEmail');
  document.getElementById('studentLevel').textContent = `Level ${currentLevel}`;
  
  // Load sheets
  loadSheets();
});

// Load sheets for current level
async function loadSheets() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_URL}/sheets/level/${currentLevel}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load sheets');
    }
    
    allSheets = await response.json();
    renderSheets();
  } catch (error) {
    console.error('Error loading sheets:', error);
    document.getElementById('sheetGrid').innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-600">Failed to load sheets. Please refresh the page.</p>
      </div>
    `;
  }
}

// Render sheets for current page and slide
function renderSheets() {
  const sheetGrid = document.getElementById('sheetGrid');
  const searchValue = document.getElementById('sheetSearch').value;
  
  // Generate all 200 sheets
  let sheetsToDisplay = [];
  for (let i = 1; i <= 200; i++) {
    sheetsToDisplay.push(i);
  }
  
  // Filter by search if provided
  if (searchValue) {
    const searchNum = parseInt(searchValue);
    sheetsToDisplay = sheetsToDisplay.filter(num => num === searchNum);
  }
  
  // Pagination
  const totalPages = Math.ceil(sheetsToDisplay.length / SHEETS_PER_PAGE);
  const startIndex = (currentPage - 1) * SHEETS_PER_PAGE;
  const endIndex = startIndex + SHEETS_PER_PAGE;
  const paginatedSheets = sheetsToDisplay.slice(startIndex, endIndex);
  
  // Update pagination info
  document.getElementById('currentPage').textContent = currentPage;
  document.getElementById('totalPages').textContent = totalPages;
  document.getElementById('prevPage').disabled = currentPage === 1;
  document.getElementById('nextPage').disabled = currentPage === totalPages;
  
  // Render sheet cards
  sheetGrid.innerHTML = paginatedSheets.map(sheetNum => {
    // Check if sheet falls within any video range
    const hasVideo = allSheets.some(
      s => sheetNum >= s.sheet_start && sheetNum <= s.sheet_end && s.slide === currentSlide
    );
    
    return `
      <div 
        class="sheet-card ${hasVideo ? 'has-video' : ''} glass-card rounded-2xl p-6 text-center"
        onclick="goToSheet(${sheetNum})"
      >
        <div class="text-3xl font-bold mb-2 text-purple-800">${sheetNum}</div>
        <div class="text-sm text-gray-600">Sheet ${sheetNum}</div>
        <div class="text-xs mt-2 ${hasVideo ? 'text-green-600' : 'text-gray-400'}">
          ${hasVideo ? '✓ Video Available' : '○ No Video'}
        </div>
      </div>
    `;
  }).join('');
}

// Select slide A or B
function selectSlide(slide) {
  currentSlide = slide;
  
  // Update button styles
  document.getElementById('slideABtn').classList.toggle('active', slide === 'A');
  document.getElementById('slideBBtn').classList.toggle('active', slide === 'B');
  
  // Refresh sheet display
  renderSheets();
}

// Filter sheets by search
function filterSheets() {
  currentPage = 1; // Reset to first page
  renderSheets();
}

// Change page
function changePage(direction) {
  const totalPages = Math.ceil(200 / SHEETS_PER_PAGE);
  const newPage = currentPage + direction;
  
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderSheets();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Navigate to sheet video
function goToSheet(sheetNum) {
  window.location.href = `student-view.html?level=${currentLevel}&sheet=${sheetNum}&slide=${currentSlide}`;
}

// Logout function
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}
