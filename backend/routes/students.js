const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentActivity,
  getStudentStats,
  updateOwnProfile
} = require('../controllers/studentController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Statistics (admin only)
router.get('/stats', verifyAdmin, getStudentStats);

// Student can update their own profile
router.put('/profile/me', updateOwnProfile);

// Admin-only routes
router.get('/', verifyAdmin, getAllStudents);
router.post('/', verifyAdmin, createStudent);
router.put('/:id', verifyAdmin, updateStudent);
router.delete('/:id', verifyAdmin, deleteStudent);

// Admin can view student details and activity
router.get('/:id', verifyAdmin, getStudent);
router.get('/:id/activity', verifyAdmin, getStudentActivity);

module.exports = router;
