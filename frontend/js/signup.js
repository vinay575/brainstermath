// Student Signup JavaScript
const API_URL = 'https://brainstermath.onrender.com/api';

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (token && role === 'student') {
    window.location.href = 'student-dashboard-enhanced.html';
  }
});

// Signup form submission
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  const level = parseInt(document.getElementById('level').value);
  
  const signupButton = document.getElementById('signupButton');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  
  // Disable button and show loading
  signupButton.disabled = true;
  signupButton.textContent = 'Creating Account...';
  errorAlert.classList.add('hidden');
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email, 
        password, 
        full_name: fullName,
        phone: phone || null,
        address: address || null,
        level 
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    // Store token and user info
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.user.role);
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('userEmail', data.user.email);
    localStorage.setItem('level', data.user.level);
    localStorage.setItem('studentId', data.user.studentId);
    
    // Redirect to student dashboard
    window.location.href = 'student-dashboard-enhanced.html';
    
  } catch (error) {
    console.error('Signup error:', error);
    errorMessage.textContent = error.message || 'Registration failed. Please try again.';
    errorAlert.classList.remove('hidden');
    
    signupButton.disabled = false;
    signupButton.textContent = 'Create Account';
  }
});
