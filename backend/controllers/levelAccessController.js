const { pool } = require('../config/database');

// Get all pending requests (admin only)
const getPendingRequests = async (req, res) => {
  try {
    const [requests] = await pool.query(`
      SELECT 
        lar.*,
        s.full_name as student_name,
        u.email as student_email,
        s.level as current_level
      FROM level_access_requests lar
      JOIN students s ON lar.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE lar.status = 'pending'
      ORDER BY lar.created_at DESC
    `);
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
};

// Get all requests for admin
const getAllRequests = async (req, res) => {
  try {
    const [requests] = await pool.query(`
      SELECT 
        lar.*,
        s.full_name as student_name,
        u.email as student_email,
        s.level as current_level,
        admin_u.email as processed_by_email
      FROM level_access_requests lar
      JOIN students s ON lar.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users admin_u ON lar.processed_by = admin_u.id
      ORDER BY lar.created_at DESC
    `);
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

// Get student's own requests
const getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get student_id from user_id
    const [students] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [userId]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    const studentId = students[0].id;
    
    const [requests] = await pool.query(`
      SELECT 
        lar.*,
        admin_u.email as processed_by_email
      FROM level_access_requests lar
      LEFT JOIN users admin_u ON lar.processed_by = admin_u.id
      WHERE lar.student_id = ?
      ORDER BY lar.created_at DESC
    `, [studentId]);
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching my requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

// Create a new level access request
const createRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requested_level, message } = req.body;
    
    if (!requested_level || requested_level < 1 || requested_level > 8) {
      return res.status(400).json({ error: 'Invalid level requested' });
    }
    
    // Get student_id from user_id
    const [students] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [userId]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    const studentId = students[0].id;
    
    // Check if student already has access
    const [existingAccess] = await pool.query(
      'SELECT * FROM student_level_access WHERE student_id = ? AND level = ?',
      [studentId, requested_level]
    );
    
    if (existingAccess.length > 0) {
      return res.status(400).json({ error: 'You already have access to this level' });
    }
    
    // Check if there's already a pending request
    const [pendingRequest] = await pool.query(
      'SELECT * FROM level_access_requests WHERE student_id = ? AND requested_level = ? AND status = "pending"',
      [studentId, requested_level]
    );
    
    if (pendingRequest.length > 0) {
      return res.status(400).json({ error: 'You already have a pending request for this level' });
    }
    
    // Create the request
    const [result] = await pool.query(
      'INSERT INTO level_access_requests (student_id, requested_level, message) VALUES (?, ?, ?)',
      [studentId, requested_level, message || null]
    );
    
    res.status(201).json({
      message: 'Level access request submitted successfully',
      requestId: result.insertId
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
};

// Approve a level access request
const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_response } = req.body;
    const adminUserId = req.user.id;
    
    // Get the request details
    const [requests] = await pool.query(
      'SELECT * FROM level_access_requests WHERE id = ?',
      [id]
    );
    
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const request = requests[0];
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update request status
      await connection.query(
        'UPDATE level_access_requests SET status = "approved", admin_response = ?, processed_by = ?, processed_at = NOW() WHERE id = ?',
        [admin_response || null, adminUserId, id]
      );
      
      // Grant level access
      await connection.query(
        'INSERT INTO student_level_access (student_id, level, granted_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE granted_by = ?',
        [request.student_id, request.requested_level, adminUserId, adminUserId]
      );
      
      await connection.commit();
      connection.release();
      
      res.json({ message: 'Request approved and level access granted' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
};

// Reject a level access request
const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_response } = req.body;
    const adminUserId = req.user.id;
    
    // Get the request details
    const [requests] = await pool.query(
      'SELECT * FROM level_access_requests WHERE id = ?',
      [id]
    );
    
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const request = requests[0];
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }
    
    // Update request status
    await pool.query(
      'UPDATE level_access_requests SET status = "rejected", admin_response = ?, processed_by = ?, processed_at = NOW() WHERE id = ?',
      [admin_response || null, adminUserId, id]
    );
    
    res.json({ message: 'Request rejected' });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
};

// Get accessible levels for a student
const getAccessibleLevels = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get student_id from user_id
    const [students] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [userId]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    const studentId = students[0].id;
    
    const [levels] = await pool.query(
      'SELECT level FROM student_level_access WHERE student_id = ? ORDER BY level',
      [studentId]
    );
    
    res.json(levels.map(l => l.level));
  } catch (error) {
    console.error('Error fetching accessible levels:', error);
    res.status(500).json({ error: 'Failed to fetch accessible levels' });
  }
};

module.exports = {
  getPendingRequests,
  getAllRequests,
  getMyRequests,
  createRequest,
  approveRequest,
  rejectRequest,
  getAccessibleLevels
};
