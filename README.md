# HTX Video Conferencing Platform

A modern video conferencing platform built with the **HTX paradigm** - the inverse of JSX. Instead of JavaScript generating HTML, we use vanilla HTML components that load dynamically when and where needed.

## Tech Stack

- **Bun.js** - Lightning-fast JavaScript runtime and server
- **HTX** - Dynamic HTML component loading system (the inverse of JSX)
- **htmz** - Minimalist HTML microframework for dynamic content (1 line!)
- **WebRTC** - Peer-to-peer video conferencing
- **SQLite** - Lightweight database
- **Custom Auth** - Secure authentication with bcrypt

## The HTX Paradigm

### What is HTX?

**HTX is the inverse of JSX** - instead of writing JavaScript that generates HTML at compile time, you write vanilla HTML components that load dynamically at runtime.

- **JSX**: JavaScript → HTML (compile time)
- **HTX**: HTML → JavaScript (runtime)

### Key Benefits

1. **No Build Step** - Pure HTML, no compilation needed
2. **Instant Development** - Just refresh to see changes
3. **Progressive Enhancement** - Works without JavaScript
4. **Simple Debugging** - View source shows actual HTML
5. **Component-Based** - Compose HTML fragments like React components
6. **Fast** - Minimal runtime (~10KB), aggressive caching
7. **Flexible** - Mix with any JavaScript framework or vanilla JS

## Project Structure

```
bun+hx/
├── public/
│   ├── htx/                      # HTX Components (HTML fragments)
│   │   ├── index.htx             # Home page
│   │   ├── login-page.htx        # Login/signup
│   │   ├── dashboard-page.htx    # Dashboard
│   │   ├── room.htx              # Video room
│   │   ├── modal.htx             # Reusable modal
│   │   └── authenticate.htx      # Auth forms
│   ├── js/
│   │   ├── htx.js                # HTX core loader
│   │   ├── htx-router.js         # Client-side router
│   │   ├── app.js                # Application config
│   │   ├── login.js              # Login functionality
│   │   ├── dashboard.js          # Dashboard functionality
│   │   └── video-conference.js   # WebRTC functionality
│   ├── app.css                 # Global styles
│   ├── app.html                  # SPA entry point
│   ├── index.html                # Traditional entry
│   └── fixi.js                   # Fixi hypermedia library
├── server.ts                     # Bun.js server
├── auth.ts                       # Authentication logic
├── db.ts                         # Database schema & queries
├── seed.ts                       # Database seeding
└── docs/
    ├── HTX_SYSTEM.md             # Comprehensive HTX docs
    ├── HTX_QUICK_REFERENCE.md    # Quick reference guide
    └── AUTH_TEST_RESULTS.md      # Auth testing docs
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed

### Installation

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Seed the database
bun run seed

# Start the server
bun run dev
```

The server will start at `http://localhost:3000`

### Available Endpoints

- `/` - Traditional video conference page
- `/app` - HTX SPA mode
- `/login` (via SPA) - Authentication
- `/dashboard` (via SPA) - User dashboard
- `/room/:roomId` (via SPA) - Video conference room

## HTX System Overview

### 1. HTX Core (`htx.js`)

The component loader with:
- Caching system
- Lifecycle hooks
- Dynamic loading
- Auto-processing

```javascript
// Load a component
await htx.load('dashboard-page.htx', '#app');

// With options
await htx.load('modal.htx', '#container', {
    swap: 'innerHTML',
    cache: false
});
```

### 2. HTX Router (`htx-router.js`)

Client-side routing with:
- Pattern matching
- Route guards
- Middleware
- History API integration

```javascript
// Define routes
router
    .route('/', 'index.htx')
    .route('/login', 'login-page.htx', { guards: [guestOnly] })
    .route('/dashboard', 'dashboard-page.htx', { guards: [requireAuth] });

// Navigate
navigateTo('/dashboard');
```

### 3. Creating HTX Components

HTX components are pure HTML fragments:

```html
<!-- htx/user-card.htx -->
<div class="card">
    <h3>User Profile</h3>
    <p>Welcome back!</p>
    
    <!-- Can include Fixi controls -->
    <button fx-action="/api/profile" 
            fx-target="#profile"
            fx-swap="innerHTML">
        Load Profile
    </button>
</div>
```

## Features

### Authentication

- Custom bcrypt-based authentication
- Session management with cookies
- Protected routes with guards
- `/api/auth/sign-up` - Create account
- `/api/auth/sign-in` - Login
- `/api/auth/sign-out` - Logout

### Database Entities

- **Users** - User accounts
- **Organizations** - Company/org management
- **Teams** - Team organization
- **Projects** - Project tracking
- **Meetings** - Video conference scheduling

### Video Conferencing

- WebRTC peer-to-peer video
- Room-based conferences
- Real-time signaling via WebSockets
- Video/audio controls

## HTX vs Traditional Frameworks

| Feature | HTX | React | Vue | HTMX |
|---------|-----|-------|-----|------|
| Components | HTML files | JSX | SFC | HTML attrs |
| Build Step | No | Yes | Yes | No |
| Runtime Size | ~10KB | ~40KB | ~33KB | ~14KB |
| Learning Curve | Minimal | High | Medium | Low |
| Server-Side | Simple | Complex | Complex | Native |
| Client Routing | Yes | Yes | Yes | Limited |

## Development

### Running in Development

```bash
# With auto-reload
bun run dev

# Production
bun run start
```

### Testing Authentication

```bash
# Sign up a new user
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

# Sign in
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Access protected endpoint
curl http://localhost:3000/api/me -b cookies.txt
```

## API Endpoints

### Auth
- `POST /api/auth/sign-up` - Create account
- `POST /api/auth/sign-in` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/me` - Get current user

### Organizations
- `GET /api/organizations` - List user's organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project

### Meetings
- `GET /api/meetings` - List meetings
- `POST /api/meetings` - Create meeting

### WebRTC
- `GET /api/room-info?room=:id` - Get room info
- WebSocket at `/` for signaling

## Architecture Philosophy

### Why HTX?

Traditional SPAs use JavaScript to generate HTML:
1. Write JSX/template code
2. Compile to JavaScript
3. JavaScript generates HTML at runtime
4. Complex build tooling required
5. Large runtime overhead

HTX inverts this:
1. Write vanilla HTML components
2. No compilation needed
3. HTML loads on demand
4. Simple server-side routing
5. Minimal runtime

### The HTX Flow

```
User navigates → Router matches → HTX loads .htx file →
HTML fetched → Component mounted → Scripts initialized →
Ready for interaction
```

### Integration with htmz

HTX and htmz work seamlessly together:

```html
<!-- HTX provides the component structure -->
<div htx-src="user-list.htx"></div>

<!-- Inside user-list.htx, htmz provides interactivity -->
<button onclick="this.nextElementSibling.click()">Load Users</button>
<a href="/api/users#users" target="htmz" hidden></a>

<div id="users"></div>
```

## Future Enhancements

- [ ] HTX component library
- [ ] Server-side HTX rendering
- [ ] HTX preprocessor for variables/props
- [ ] Dev tools browser extension
- [ ] TypeScript declarations
- [ ] Component slots/props system
- [ ] Scoped CSS per component
- [ ] HTX CLI tool

## Resources

- [HTX System Documentation](./docs/HTX_SYSTEM.md)
- [HTX Quick Reference](./docs/HTX_QUICK_REFERENCE.md)
- [Authentication Testing](./docs/AUTH_TEST_RESULTS.md)

## License

MIT

## Contributing

Contributions welcome! The HTX paradigm is new and experimental - we'd love your feedback and ideas.

---

**HTX: HTML that loads when you need it, where you need it.** 🚀
