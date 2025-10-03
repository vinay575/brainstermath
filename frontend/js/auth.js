// Authentication JavaScript
const API_URL = 'https://brainstermath.onrender.com/api';

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (token && role) {
    // Redirect to appropriate dashboard
    if (role === 'admin') {
      window.location.href = 'admin-dashboard.html';
    } else if (role === 'student') {
      window.location.href = 'student-dashboard-enhanced.html';
    }
  }
});

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  
  const loginButton = document.getElementById('loginButton');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  
  // Disable button and show loading
  loginButton.disabled = true;
  loginButton.textContent = 'Signing in...';
  errorAlert.classList.add('hidden');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, role })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Store token and user info
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.user.role);
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('userEmail', data.user.email);
    
    if (data.user.level) {
      localStorage.setItem('level', data.user.level);
    }
    
    if (data.user.studentId) {
      localStorage.setItem('studentId', data.user.studentId);
    }
    
    // Redirect to appropriate dashboard
    if (data.user.role === 'admin') {
      window.location.href = 'admin-dashboard.html';
    } else if (data.user.role === 'student') {
      window.location.href = 'student-dashboard-enhanced.html';
    }
    
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.textContent = error.message || 'Login failed. Please try again.';
    errorAlert.classList.remove('hidden');
    
    loginButton.disabled = false;
    loginButton.textContent = 'Sign In';
  }
});

// Logout function (used in dashboards)
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}
