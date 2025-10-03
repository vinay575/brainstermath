const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function seed() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const [adminResult] = await connection.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      ['admin@brainstermath.com', adminPassword, 'admin']
    );
    console.log('✅ Admin user created: admin@brainstermath.com / admin123');

    // Create one example student for each level (1-8)
    const studentPassword = await bcrypt.hash('student123', 10);
    
    for (let level = 1; level <= 8; level++) {
      const [userResult] = await connection.execute(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [`student.level${level}@example.com`, studentPassword, 'student']
      );
      
      await connection.execute(
        'INSERT INTO students (user_id, full_name, phone, address, level) VALUES (?, ?, ?, ?, ?)',
        [
          userResult.insertId,
          `Level ${level} Student`,
          `555-000${level}`,
          `${level}00 Example Street, City`,
          level
        ]
      );
      console.log(`✅ Student created for Level ${level}: student.level${level}@example.com / student123`);
    }

    // Seed some example videos (first 3 sheets of level 1, both slides)
    const exampleVideos = [
      { level: 1, start: 1, end: 1, slide: 'A', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Level 1 - Sheet 1 - Slide A' },
      { level: 1, start: 1, end: 1, slide: 'B', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Level 1 - Sheet 1 - Slide B' },
      { level: 1, start: 2, end: 2, slide: 'A', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Level 1 - Sheet 2 - Slide A' },
      { level: 1, start: 2, end: 2, slide: 'B', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Level 1 - Sheet 2 - Slide B' },
      { level: 1, start: 3, end: 3, slide: 'A', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Level 1 - Sheet 3 - Slide A' },
      { level: 1, start: 3, end: 3, slide: 'B', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Level 1 - Sheet 3 - Slide B' },
    ];

    for (const video of exampleVideos) {
      await connection.execute(
        'INSERT INTO sheet_videos (level, sheet_start, sheet_end, slide, video_url, video_title, video_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [video.level, video.start, video.end, video.slide, video.url, video.title, 'youtube']
      );
    }
    console.log('✅ Example videos seeded for Level 1, Sheets 1-3');

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed().catch(console.error);
