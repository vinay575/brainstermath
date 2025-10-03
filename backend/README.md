# BrainsterMath E-Learning Platform - Backend

Full-featured backend API for the BrainsterMath e-learning platform with AWS S3 integration, JWT authentication, and MySQL/TiDB Cloud database.

## 🚀 Features

- **Authentication**: JWT-based secure authentication with bcrypt password hashing
- **User Roles**: Admin and Student roles with role-based access control
- **AWS S3 Integration**: Automatic video fetching and mapping from S3 based on filename convention
- **Video Management**: Support for YouTube embeds, Google Drive links, direct URLs, and S3 videos
- **Sheet Range Mapping**: Map one video to multiple sheets (e.g., L1_1_5.mp4 covers sheets 1-5)
- **Student Activity Tracking**: Log and monitor student video access
- **Real-time Analytics**: Student statistics and activity monitoring

## 📋 Prerequisites

- Node.js 16+ installed
- MySQL 8.0+ or TiDB Cloud account
- AWS S3 bucket (optional, for video hosting)
- TiDB Cloud TLS certificate (`ca.pem`)

## 🛠️ Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**
   
   Create `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```env
   # TiDB Cloud Database
   DB_HOST=your-tidb-host.tidbcloud.com
   DB_PORT=4000
   DB_USER=your-username
   DB_PASSWORD=your-password
   DB_NAME=your-database
   DB_CA_PATH=./ca.pem

   # JWT Configuration
   JWT_SECRET=your-super-secret-key-change-this
   JWT_EXPIRES_IN=24h

   # Server
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5500

   # AWS S3 (required for auto video mapping)
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=ap-south-1
   AWS_BUCKET_NAME=your-bucket-name
   AWS_BUCKET_PREFIX=brainstermath-videos/
   ```

3. **Add TiDB Cloud certificate**
   
   Download the TLS certificate from TiDB Cloud and save it as `ca.pem` in the backend directory.

4. **Set up the database**
   
   Run the schema script:
   ```bash
   mysql -h your-host -P 4000 -u your-user -p --ssl-ca=./ca.pem < schema.sql
   ```

5. **Seed the database**
   
   Create admin user and sample students:
   ```bash
   npm run seed
   ```

   **Default credentials:**
   - Admin: `admin@brainstermath.com` / `admin123`
   - Students: `student.level1@example.com` to `student.level8@example.com` / `student123`

## 🎬 AWS S3 Video Setup

### Filename Convention

Videos in S3 must follow this naming pattern:
```
L{level}_{sheetStart}_{sheetEnd}.mp4
```

**Examples:**
- `L1_1_5.mp4` → Level 1, Sheets 1-5
- `L2_10_15.mp4` → Level 2, Sheets 10-15
- `L3_1_1.mp4` → Level 3, Sheet 1 only

### S3 Bucket Structure

```
your-bucket-name/
└── brainstermath-videos/
    ├── L1_1_5.mp4
    ├── L1_6_10.mp4
    ├── L1_11_15.mp4
    ├── L2_1_5.mp4
    ├── L2_6_10.mp4
    └── ...
```

### Automatic Video Sync

1. Upload videos to S3 following the naming convention
2. Login as admin in the dashboard
3. Navigate to "Videos" tab
4. Click "Sync from S3" button
5. Videos are automatically mapped to the database

The system will:
- Parse filenames to extract level and sheet ranges
- Create entries for both Slide A and Slide B
- Update existing entries if they already exist
- Generate proper S3 URLs for video playback

### S3 Bucket Permissions

Make your bucket public (for direct video streaming) or use signed URLs:

**Option 1: Public Bucket (Recommended for simplicity)**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/brainstermath-videos/*"
    }
  ]
}
```

**Option 2: Private Bucket with Signed URLs**
If using private bucket, the system will generate signed URLs with 1-hour expiry.

## 🏃 Running the Server

### Development mode (with auto-reload)
```bash
npm run dev
```

### Production mode
```bash
npm start
```

Server will start at: `https://brainstermath.onrender.com`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - Login (admin or student)
- `GET /api/auth/verify` - Verify JWT token

### Students (Admin only, except profile update)
- `GET /api/students` - Get all students
- `GET /api/students/stats` - Get student statistics
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/:id/activity` - Get student activity
- `PUT /api/students/profile/me` - Update own profile (student)

### Videos/Sheets
- `GET /api/sheets/level/:level` - Get all videos for a level
- `GET /api/sheets/:level/:sheet/:slide` - Get specific video
- `POST /api/sheets` - Add/update video (admin)
- `DELETE /api/sheets/:id` - Delete video (admin)
- `POST /api/sheets/sync-s3` - Sync videos from S3 (admin)
- `GET /api/sheets/s3-list` - List S3 videos without syncing (admin)

### Health Check
- `GET /api/health` - Server status

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## 🗄️ Database Schema

### Tables

**users**
- Core authentication table for both admins and students
- Fields: id, email, password (hashed), role, timestamps

**students**
- Extended profile for student users
- Fields: id, user_id, full_name, phone, address, level (1-8), timestamps

**sheet_videos**
- Video content mapped to sheet ranges
- Fields: id, level, sheet_start, sheet_end, slide (A/B), video_url, video_type, video_title, timestamps
- Supports: YouTube embeds, Google Drive, direct URLs, S3 URLs

**student_activity**
- Activity tracking log
- Fields: id, student_id, level, sheet_number, slide, watched_at

## 🔐 Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT authentication with configurable expiry
- Role-based access control (RBAC)
- Level-based content restriction for students
- SQL injection protection via parameterized queries
- CORS configuration for frontend integration
- Helmet.js security headers
- TLS/SSL for database connections

## 📊 Admin Dashboard Features

1. **Student Management**
   - Create, update, delete students
   - Assign/change student levels
   - View student profiles and activity

2. **Video Management**
   - Upload/link videos manually
   - Sync videos automatically from S3
   - Support for multiple video sources
   - Map videos to sheet ranges

3. **Analytics & Charts**
   - Total student count (real-time)
   - Students per level distribution
   - Activity monitoring
   - Chart.js visualizations

## 🐛 Troubleshooting

### Database Connection Issues
- Verify TiDB Cloud credentials in `.env`
- Ensure `ca.pem` certificate is present
- Check if your IP is whitelisted in TiDB Cloud

### S3 Sync Issues
- Verify AWS credentials have S3 read access
- Check bucket name and prefix are correct
- Ensure videos follow the naming convention: `L{level}_{start}_{end}.mp4`
- Check bucket region matches `AWS_REGION`

### JWT Token Issues
- Ensure `JWT_SECRET` is set in `.env`
- Check token expiry settings
- Verify token is sent in `Authorization: Bearer <token>` header

### Video Playback Issues
- For S3: Check bucket permissions (public or signed URLs)
- For YouTube: Use embed URLs (e.g., `/embed/VIDEO_ID`)
- For Google Drive: Use shareable links with proper permissions

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | TiDB Cloud host | `gateway01.ap-south-1.prod.aws.tidbcloud.com` |
| `DB_PORT` | Database port | `4000` |
| `DB_USER` | Database username | `your-username.root` |
| `DB_PASSWORD` | Database password | `your-secure-password` |
| `DB_NAME` | Database name | `brainstermath` |
| `DB_CA_PATH` | TLS certificate path | `./ca.pem` |
| `JWT_SECRET` | Secret for JWT signing | `change-this-in-production` |
| `JWT_EXPIRES_IN` | Token expiry | `24h` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5500` |
| `AWS_ACCESS_KEY_ID` | AWS access key | From AWS IAM |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | From AWS IAM |
| `AWS_REGION` | AWS region | `ap-south-1` |
| `AWS_BUCKET_NAME` | S3 bucket name | `your-bucket-name` |
| `AWS_BUCKET_PREFIX` | Video folder prefix | `brainstermath-videos/` |

## 🚀 Deployment

### Deploying to Production

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Update `FRONTEND_URL` to your production domain
4. Use environment variables instead of `.env` file (recommended)
5. Set up process manager (PM2, systemd)
6. Configure reverse proxy (nginx, Apache)
7. Enable HTTPS/TLS

### PM2 Example
```bash
npm install -g pm2
pm2 start server.js --name brainstermath-api
pm2 save
pm2 startup
```

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Support

For issues or questions:
- Create an issue in the repository
- Contact: support@brainstermath.com
