# 🚀 Quick Start Guide

## Prerequisites

- Bun.js installed (if not: `curl -fsSL https://bun.com/install | bash`)

## Setup (2 minutes)

### 1. Install Dependencies
```bash
cd /Users/petter/Projects/GitHub/template-modules/bun+hx
bun install
```

### 2. Initialize Database
```bash
bun run seed
```

You should see:
```
🌱 Seeding database...
✅ Database initialized successfully
✅ Database seeding complete!
```

### 3. Start the Server
```bash
bun run dev
```

You should see:
```
🚀 Server running at http://localhost:3000
🔐 Authentication ready with Better Auth
🎥 WebRTC video conferencing ready!
💾 SQLite database initialized
```

## First Time Usage

### 1. Create Your Account
1. Open http://localhost:3000/login
2. Click "Sign Up" tab
3. Enter your name, email, and password (min 8 characters)
4. Click "Create Account"
5. You'll be automatically redirected to the dashboard

### 2. Create Your First Organization
1. On the dashboard, click "Create Organization"
2. Enter organization name (e.g., "Acme Corp")
3. The slug will auto-generate (e.g., "acme-corp")
4. Add an optional description
5. Click "Create"

### 3. Start a Video Meeting
Two ways to start a meeting:

**Option A: Quick Meeting (No Auth Required)**
1. Go to http://localhost:3000
2. Click "Start Call"
3. Allow camera/microphone access
4. Share the URL with others

**Option B: Scheduled Meeting (With Organization)**
1. From dashboard, create a project
2. Schedule a meeting for that project
3. Share the room link with participants

## What You Can Do

### ✅ Fully Implemented

1. **User Management**
   - Sign up / Login / Logout
   - User profiles
   - Session management

2. **Organization Management**
   - Create organizations
   - View all your organizations
   - Organization membership

3. **Video Conferencing**
   - Start instant video calls
   - Multi-party video (peer-to-peer)
   - Toggle video/audio
   - Room-based meetings
   - Participant tracking

4. **Database Foundation**
   - Users, Organizations, Teams
   - Projects, Meetings
   - Participation tracking
   - All relationships defined

### 🔧 Ready to Build

The foundation is complete for:
- Team creation within orgs
- Project assignment
- Meeting scheduling UI
- Team member invitations
- Advanced permissions
- Meeting history
- And much more!

## API Testing

### Test Authentication
```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Sign in
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Get current user
curl http://localhost:3000/api/me -b cookies.txt
```

### Test Organizations
```bash
# Create organization
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"My Org","slug":"my-org","description":"Test org"}'

# List organizations
curl http://localhost:3000/api/organizations -b cookies.txt
```

## Project Structure

```
bun+hx/
├── server.ts              # Main server (auth + WebSocket + API)
├── db.ts                  # Database schema & queries
├── auth.ts                # Better Auth config
├── seed.ts                # Database initialization
├── data.sqlite            # SQLite database (auto-created)
├── public/
│   ├── index.html         # Video conference UI
│   ├── login.html         # Auth page
│   ├── dashboard.html     # User dashboard
│   ├── fixi.js            # Fixi library
│   └── style.css          # Styles
└── docs/
    └── AUTH_SQLITE_SUMMARY.md  # Detailed documentation
```

## Key URLs

- **Home (Video)**: http://localhost:3000
- **Login/Signup**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard
- **API Docs**: See README.md

## Troubleshooting

### Port 3000 in use
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in server.ts
```

### Database issues
```bash
# Reset database
rm data.sqlite
bun run seed
```

### Authentication issues
- Clear browser cookies
- Make sure you're using the correct credentials
- Check server logs for errors

## Development Tips

### Hot Reload
The dev server (`bun run dev`) automatically reloads when you change TypeScript files.

### Database Queries
Check `db.ts` for all available query helpers:
- `queries.getUserById()`
- `queries.getOrganizationsByUserId()`
- `queries.getMeetingByRoomId()`
- And more...

### Adding New Features

1. **Add Database Table**
   - Update `db.ts` `initializeDatabase()`
   - Add query helpers
   - Add creation functions

2. **Add API Endpoint**
   - Add route in `server.ts`
   - Handle authentication
   - Use database queries

3. **Add UI**
   - Create/modify HTML in `public/`
   - Use Fixi.js attributes for interactivity
   - Call your API endpoints

## Next Steps

Now that everything is set up:

1. ✅ Play with the video conferencing
2. ✅ Create organizations and explore the dashboard
3. ✅ Look at the code structure
4. ✅ Build new features on top of this foundation

## Support

- **Bun**: https://bun.sh/docs
- **Better Auth**: https://better-auth.com
- **Fixi.js**: https://github.com/bigskysoftware/fixi
- **WebRTC**: https://webrtc.org

---

**You're all set! 🎉**

Start by opening http://localhost:3000/login and creating your account!

