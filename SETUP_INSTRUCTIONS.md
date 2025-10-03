# BrainsterMath Platform - Setup Instructions

## Backend Setup

1. **Run Database Migration**
   ```bash
   cd backend
   mysql -u your_user -p your_database < migrations/002_level_access_system.sql
   ```

2. **Install Dependencies** (if not already done)
   ```bash
   npm install
   ```

3. **Start Backend Server**
   ```bash
   npm start
   ```

## Frontend Setup

1. **Access the Application**
   - Open `frontend/login.html` in your browser (or via Live Server)
   - Student login on LEFT side
   - Admin login on RIGHT side

## New Features Implemented

### 1. Level Access Request System
- Students can request access to new levels
- Admins receive notifications and can approve/reject requests
- Students get notified of admin responses

### 2. Enhanced Video Display
- Videos grouped by sheet ranges (e.g., Level-1: 1A to 5B)
- Both Slide A and B displayed for each range
- Play buttons for available videos

### 3. Video Navigation
- Previous/Next video buttons on video player
- Navigate through all accessible videos sequentially
- Displays video info for prev/next videos

### 4. Admin Panel Enhancements
- **Requests Tab**: View and manage student level requests
- Notification badge shows pending request count
- Approve/reject with optional messages to students

### 5. Improved UI/UX
- Split login page (student left, admin right)
- BrainsterMath logo on all pages
- Color scheme: #271d47 (text), #7e62a8 (buttons/admin bg)
- Responsive design throughout

## Default Admin Account
- Email: admin@brainstermath.com
- Password: admin123

## Key Files
- `frontend/login.html` - New split login page
- `frontend/student-dashboard-enhanced.html` - Enhanced student dashboard
- `frontend/video-player.html` - Video player with navigation
- `frontend/admin-dashboard-enhanced.html` - Admin panel with requests
- `backend/migrations/002_level_access_system.sql` - Database migration

## Testing Checklist
- [ ] Student can login and see their accessible levels
- [ ] Student can request new level access
- [ ] Admin sees pending requests with notification badge
- [ ] Admin can approve/reject requests
- [ ] Student receives notifications after admin response
- [ ] Videos display with A/B slides
- [ ] Video player has prev/next navigation
- [ ] Search and filters work correctly
