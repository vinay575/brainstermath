const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Get all students
const getAllStudents = async (req, res) => {
  try {
    const [students] = await pool.execute(`
      SELECT s.id, s.full_name, s.phone, s.address, s.level, 
             u.email, s.created_at, s.updated_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);
    
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
};

// Get single student
const getStudent = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [students] = await pool.execute(`
      SELECT s.id, s.full_name, s.phone, s.address, s.level, 
             u.email, s.created_at, s.updated_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    
    res.json(students[0]);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Failed to fetch student.' });
  }
};

// Create student
const createStudent = async (req, res) => {
  const { email, password, full_name, phone, address, level } = req.body;

  // Validation
  if (!email || !password || !full_name || !level) {
    return res.status(400).json({ 
      error: 'Email, password, full name, and level are required.' 
    });
  }

  if (level < 1 || level > 8) {
    return res.status(400).json({ error: 'Level must be between 1 and 8.' });
  }

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Check if email already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, 'student']
    );

    // Create student profile
    const [studentResult] = await connection.execute(
      'INSERT INTO students (user_id, full_name, phone, address, level) VALUES (?, ?, ?, ?, ?)',
      [userResult.insertId, full_name, phone || null, address || null, level]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Student created successfully',
      student: {
        id: studentResult.insertId,
        email,
        full_name,
        phone,
        address,
        level
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Failed to create student.' });
  } finally {
    connection.release();
  }
};

// Update student
const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { email, full_name, phone, address, level } = req.body;

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Get student's user_id
    const [students] = await connection.execute(
      'SELECT user_id FROM students WHERE id = ?',
      [id]
    );

    if (students.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Student not found.' });
    }

    const userId = students[0].user_id;

    // Update email in users table if provided
    if (email) {
      // Check if email is already taken by another user
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUsers.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Email already exists.' });
      }

      await connection.execute(
        'UPDATE users SET email = ? WHERE id = ?',
        [email, userId]
      );
    }

    // Build update query for students table
    const updates = [];
    const values = [];

    if (full_name) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (level) {
      if (level < 1 || level > 8) {
        await connection.rollback();
        return res.status(400).json({ error: 'Level must be between 1 and 8.' });
      }
      updates.push('level = ?');
      values.push(level);
    }

    if (updates.length > 0) {
      values.push(id);
      await connection.execute(
        `UPDATE students SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    await connection.commit();

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Failed to update student.' });
  } finally {
    connection.release();
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      'DELETE FROM students WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student.' });
  }
};

// Get student activity
const getStudentActivity = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [activity] = await pool.execute(`
      SELECT sa.*, sv.video_title
      FROM student_activity sa
      LEFT JOIN sheet_videos sv ON 
        sa.level = sv.level AND 
        sa.sheet_number = sv.sheet_number AND 
        sa.slide = sv.slide
      WHERE sa.student_id = ?
      ORDER BY sa.watched_at DESC
      LIMIT 50
    `, [id]);
    
    res.json(activity);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch student activity.' });
  }
};

// Get student statistics
const getStudentStats = async (req, res) => {
  try {
    // Total students
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM students'
    );
    
    // Students per level
    const [levelStats] = await pool.execute(`
      SELECT level, COUNT(*) as count
      FROM students
      GROUP BY level
      ORDER BY level
    `);
    
    res.json({
      total: totalResult[0].total,
      byLevel: levelStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
};

// Update student's own profile (for students to update their level)
const updateOwnProfile = async (req, res) => {
  const studentId = req.user.studentId;
  const { level, phone, address } = req.body;

  try {
    const updates = [];
    const values = [];

    if (level) {
      if (level < 1 || level > 8) {
        return res.status(400).json({ error: 'Level must be between 1 and 8.' });
      }
      updates.push('level = ?');
      values.push(level);
    }
    
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }

    if (updates.length > 0) {
      values.push(studentId);
      await pool.execute(
        `UPDATE students SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

module.exports = {
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentActivity,
  getStudentStats,
  updateOwnProfile
};
