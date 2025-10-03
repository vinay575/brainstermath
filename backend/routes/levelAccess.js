const express = require('express');
const router = express.Router();
const {
  getPendingRequests,
  getAllRequests,
  getMyRequests,
  createRequest,
  approveRequest,
  rejectRequest,
  getAccessibleLevels
} = require('../controllers/levelAccessController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Student routes
router.get('/my-requests', getMyRequests);
router.post('/request', createRequest);
router.get('/my-levels', getAccessibleLevels);

// Admin routes
router.get('/pending', verifyAdmin, getPendingRequests);
router.get('/all', verifyAdmin, getAllRequests);
router.post('/:id/approve', verifyAdmin, approveRequest);
router.post('/:id/reject', verifyAdmin, rejectRequest);

module.exports = router;
