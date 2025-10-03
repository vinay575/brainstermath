// Student Profile JavaScript
const API_URL = 'http://localhost:3000/api';

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token || role !== 'student') {
    window.location.href = 'index.html';
    return;
  }
  
  loadProfile();
});

// Load current profile data
async function loadProfile() {
  const email = localStorage.getItem('userEmail');
  const level = localStorage.getItem('level');
  
  document.getElementById('userEmail').value = email;
  document.getElementById('level').value = level;
  
  // Load additional profile data from server
  const token = localStorage.getItem('token');
  const studentId = localStorage.getItem('studentId');
  
  try {
    const response = await fetch(`${API_URL}/students/${studentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      document.getElementById('phone').value = data.phone || '';
      document.getElementById('address').value = data.address || '';
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Update profile form submission
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const token = localStorage.getItem('token');
  const level = parseInt(document.getElementById('level').value);
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  
  const updateButton = document.getElementById('updateButton');
  const errorAlert = document.getElementById('errorAlert');
  const successAlert = document.getElementById('successAlert');
  
  // Hide alerts
  errorAlert.classList.add('hidden');
  successAlert.classList.add('hidden');
  
  // Disable button
  updateButton.disabled = true;
  updateButton.textContent = 'Saving...';
  
  try {
    const response = await fetch(`${API_URL}/students/profile/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        level,
        phone: phone || null,
        address: address || null
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }
    
    // Update localStorage
    localStorage.setItem('level', level);
    
    // Show success message
    successAlert.classList.remove('hidden');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error('Update error:', error);
    document.getElementById('errorMessage').textContent = error.message;
    errorAlert.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    updateButton.disabled = false;
    updateButton.textContent = 'Save Changes';
  }
});
