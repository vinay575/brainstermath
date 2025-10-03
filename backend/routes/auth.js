const express = require('express');
const router = express.Router();
const { register, login, verifyTokenEndpoint } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Registration route (students only)
router.post('/register', register);

// Login route
router.post('/login', login);

// Verify token route
router.get('/verify', verifyToken, verifyTokenEndpoint);

module.exports = router;
