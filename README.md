# BrainsterMath E-Learning Platform

A modern, full-stack e-learning web application with two-role access (Admin & Student) for BrainsterMath's educational content.

## 🚀 Features

### Admin Features
- **Student Management**: Create, edit, delete student accounts
- **Level Assignment**: Assign students to levels 1-8
- **Video Management**: Upload or link videos for each sheet/slide
- **Activity Monitoring**: View student recent activity

### Student Features
- **Secure Login**: Email + password authentication
- **Sheet Selector**: Browse 200 sheets per level with A/B slide toggle
- **Video Player**: Watch assigned educational videos
- **Level Restriction**: Students can only access their assigned level

## 🏗️ Tech Stack

### Frontend
- HTML5
- Tailwind CSS
- Vanilla JavaScript
- Responsive design with glassy UI components

### Backend
- Node.js
- Express.js
- JWT authentication
- bcrypt password hashing
- TiDB Cloud (MySQL-compatible database)

## 📁 Project Structure

```
brainstermath/
├── frontend/
│   ├── index.html              # Login page
│   ├── student-dashboard-enhanced.html  # Student sheet selector
│   ├── student-view.html       # Video player
│   ├── admin-dashboard.html    # Admin control panel
│   ├── css/
│   │   └── styles.css          # Custom styles
│   └── js/
│       ├── auth.js             # Authentication logic
│       ├── student.js          # Student dashboard
│       ├── video.js            # Video player
│       └── admin.js            # Admin dashboard
├── backend/
│   ├── config/
│   │   └── database.js         # TiDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   └── sheetController.js
│   ├── middleware/
│   │   └── auth.js             # JWT & access control
│   ├── routes/
│   │   ├── auth.js
│   │   ├── students.js
│   │   └── sheets.js
│   ├── test/
│   │   └── auth.test.js        # Unit tests
│   ├── server.js               # Express app
│   ├── schema.sql              # Database schema
│   ├── seed.js                 # Seed data script
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- TiDB Cloud account (or use provided credentials)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd brainstermath
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend/` directory by copying `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your TiDB credentials:

```env
DB_HOST=gateway01.ap-northeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=3JqyNadcAP18rrJ.root
DB_PASSWORD=pAI5QUe7kn5oO0xs
DB_NAME=test
DB_CA_PATH=./ca.pem

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

PORT=3000
NODE_ENV=development

FRONTEND_URL=http://localhost:5500
```

### 4. Add TiDB CA Certificate

Place the `ca.pem` file in the `backend/` directory. You can download it from TiDB Cloud dashboard or use the provided certificate.

### 5. Initialize Database

Run the schema to create tables:

```bash
# Using MySQL CLI (if you have it installed)
mysql -h gateway01.ap-northeast-1.prod.aws.tidbcloud.com \
  -P 4000 \
  -u 3JqyNadcAP18rrJ.root \
  -p \
  --ssl-ca=ca.pem \
  test < schema.sql

# Or manually execute the SQL in schema.sql through TiDB Cloud's SQL editor
```

### 6. Seed Initial Data

Run the seed script to create admin user and example students:

```bash
npm run seed
```

**Default Credentials:**
- **Admin**: `admin@brainstermath.com` / `admin123`
- **Students**: `student.level1@example.com` through `student.level8@example.com` / `student123`

### 7. Start the Backend Server

```bash
npm run dev
```

The server will start at `https://brainstermath.onrender.com`

### 8. Frontend Setup

Open `frontend/index.html` in a web browser, or use a local server:

```bash
# Using Python
cd frontend
python -m http.server 5500

# Or using Node.js http-server
npx http-server -p 5500
```

Access the frontend at `http://localhost:5500`

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 10 salt rounds
- **Level Access Control**: Server-side verification of student level access
- **TLS Connection**: Secure connection to TiDB Cloud with CA certificate
- **CORS Protection**: Configured for frontend origin only
- **Input Validation**: Server-side validation of all inputs

## 🎥 Managing Videos

### Admin Video Upload Options

1. **YouTube Embed**: Use YouTube embed URLs
   ```
   https://www.youtube.com/embed/VIDEO_ID
   ```

2. **External Links**: Direct video file URLs
   ```
   https://example.com/videos/level1-sheet1-a.mp4
   ```

3. **Self-Hosted**: Host videos on your server and provide the URL

### Video URL Format

For best compatibility, use iframe-embeddable URLs (YouTube, Vimeo, etc.)

## 🧪 Running Tests

```bash
cd backend
npm test
```

Tests cover:
- Authentication endpoints
- Level access enforcement
- Input validation

## 🚀 Deployment

### Backend Deployment (Example: Ubuntu Server)

1. Install Node.js and PM2:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

2. Clone and setup:
```bash
cd /var/www
git clone <repository-url> brainstermath
cd brainstermath/backend
npm install --production
```

3. Configure environment:
```bash
cp .env.example .env
nano .env  # Edit with production values
```

4. Start with PM2:
```bash
pm2 start server.js --name brainstermath-api
pm2 startup
pm2 save
```

### Frontend Deployment

Deploy the `frontend/` folder to any static hosting service:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Nginx

Update `frontend/js/*.js` files to point to your production backend URL.

## 📝 API Documentation

### Authentication

**POST** `/api/auth/login`
```json
{
  "email": "student@example.com",
  "password": "password123",
  "role": "student"
}
```

**GET** `/api/auth/verify` (requires JWT)

### Students (Admin Only)

**GET** `/api/students` - Get all students

**POST** `/api/students` - Create student
```json
{
  "email": "new.student@example.com",
  "password": "initial-password",
  "full_name": "John Doe",
  "phone": "555-1234",
  "address": "123 Main St",
  "level": 3
}
```

**PUT** `/api/students/:id` - Update student

**DELETE** `/api/students/:id` - Delete student

### Sheets

**GET** `/api/sheets/level/:level` - Get all sheets for a level

**GET** `/api/sheets/:level/:sheet/:slide` - Get specific video

**POST** `/api/sheets` (Admin only) - Create/update video
```json
{
  "level": 1,
  "sheet_number": 5,
  "slide": "A",
  "video_url": "https://youtube.com/embed/...",
  "video_title": "Introduction to Addition"
}
```

**DELETE** `/api/sheets/:level/:sheet/:slide` (Admin only)

## 🎨 UI Customization

The platform uses BrainsterMath's brand colors:
- Primary Purple: `#7C5BA8`
- Teal: `#6BC4BC`
- Green Accent: `#8FD694`
- Yellow Accent: `#FED766`

Modify `frontend/css/styles.css` to customize the theme.

## 🐛 Troubleshooting

### Database Connection Issues

1. Verify TiDB credentials in `.env`
2. Ensure `ca.pem` is in the correct location
3. Check firewall/network access to TiDB Cloud

### CORS Errors

Update `FRONTEND_URL` in backend `.env` to match your frontend URL.

### Authentication Issues

1. Clear browser localStorage: `localStorage.clear()`
2. Verify JWT_SECRET is set in `.env`
3. Check token expiration time

## 📄 License

MIT License - see LICENSE file for details

## 👥 Support

For questions or issues, contact BrainsterMath support or create an issue in the repository.

---

Built with ❤️ for BrainsterMath
#   b r a i n s t e r m a t h 
 
 



http://localhost:3000

https://brainstermath.onrender.com