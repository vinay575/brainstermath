const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Student Registration controller
const register = async (req, res) => {
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: userResult.insertId, 
        email,
        role: 'student',
        level,
        studentId: studentResult.insertId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userResult.insertId,
        email,
        role: 'student',
        studentId: studentResult.insertId,
        level
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register. Please try again.' });
  } finally {
    connection.release();
  }
};

// Login controller
const login = async (req, res) => {
  const { email, password, role } = req.body;

  // Validation
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required.' });
  }

  if (!['admin', 'student'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be admin or student.' });
  }

  try {
    // Find user by email and role
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [email, role]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Get student info and accessible levels if role is student
    let studentLevel = null;
    let studentId = null;
    let accessibleLevels = [];
    if (role === 'student') {
      const [students] = await pool.execute(
        'SELECT id, level FROM students WHERE user_id = ?',
        [user.id]
      );
      if (students.length > 0) {
        studentLevel = students[0].level;
        studentId = students[0].id;
        
        // Get all accessible levels
        const [levels] = await pool.execute(
          'SELECT level FROM student_level_access WHERE student_id = ? ORDER BY level',
          [students[0].id]
        );
        accessibleLevels = levels.map(l => l.level);
        
        // If no accessible levels, grant access to primary level
        if (accessibleLevels.length === 0) {
          await pool.execute(
            'INSERT INTO student_level_access (student_id, level) VALUES (?, ?)',
            [students[0].id, studentLevel]
          );
          accessibleLevels = [studentLevel];
        }
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        level: studentLevel,
        studentId: studentId,
        accessibleLevels: accessibleLevels
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        level: studentLevel,
        studentId: studentId,
        accessibleLevels: accessibleLevels
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

// Verify token endpoint
const verifyTokenEndpoint = (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
};

module.exports = { register, login, verifyTokenEndpoint };
