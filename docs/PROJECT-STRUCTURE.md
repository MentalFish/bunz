# Project Structure

BUNZ follows industry-standard best practices with a clear separation between client and server code.

## Directory Structure

```
bunz/
├─ src/
│  ├─ app.html                    # Main HTML shell (SSR template)
│  ├─ client/                     # Frontend assets (served to browser)
│  │  ├─ app.css                  # Global styles
│  │  ├─ bunz/                    # BUNZ framework scripts
│  │  │  ├─ bunz.js               # Main framework entry
│  │  │  ├─ core.js               # Core framework
│  │  │  ├─ modal.js              # Modal system
│  │  │  ├─ components.js         # Component loader
│  │  │  ├─ i18n.js               # Internationalization
│  │  │  ├─ webrtc.js             # WebRTC module
│  │  │  ├─ canvas.js             # Canvas drawing
│  │  │  ├─ map.js                # MapLibre integration
│  │  │  └─ min/                  # Minified versions (build output)
│  │  ├─ htx/                     # HTX pages & components
│  │  │  ├─ index.htx             # Homepage
│  │  │  ├─ dashboard.htx         # Dashboard page
│  │  │  ├─ room.htx              # Video room page
│  │  │  └─ components/           # Reusable UI components
│  │  │     ├─ navbar.htx         # Global navigation
│  │  │     ├─ modal.htx          # Modal frame
│  │  │     └─ ...
│  │  ├─ js/                      # Page-specific scripts
│  │  │  ├─ app.js                # Main client init
│  │  │  ├─ dashboard.js          # Dashboard logic
│  │  │  ├─ room.js               # Video room logic
│  │  │  └─ min/                  # Minified versions
│  │  └─ lang/                    # i18n translations
│  │     ├─ en.json
│  │     ├─ no.json
│  │     ├─ fr.json
│  │     └─ ...
│  └─ server/                     # Backend code (runs on Bun.js)
│     ├─ server.ts                # Main entry point
│     ├─ api/                     # API endpoints
│     │  ├─ auth.ts               # Authentication endpoints
│     │  ├─ meetings.ts           # Meeting endpoints
│     │  └─ ...
│     ├─ bunz/                    # BUNZ server modules
│     │  ├─ bunz-ssr.ts           # Server-side rendering
│     │  ├─ bunz-static.ts        # Static file serving
│     │  └─ bunz-websocket.ts     # WebSocket handling
│     ├─ config/                  # Configuration
│     │  └─ bunz-db.ts            # Database setup
│     ├─ middleware/              # Express-style middleware
│     │  ├─ bunz-auth.ts          # Auth middleware
│     │  └─ bunz-security.ts      # Security headers
│     ├─ utils/                   # Utilities
│     │  ├─ security.ts           # Security helpers
│     │  ├─ telemetry.ts          # Telemetry system
│     │  └─ seed.ts               # DB seeding
│     └─ scripts/                 # Build/dev scripts
│        └─ minify.ts             # Minification script
├─ data/                          # SQLite database
│  ├─ bunz.db
│  └─ schema.sql
├─ docs/                          # Documentation
│  ├─ BUNZ-REFERENCE.md
│  ├─ HTX-COMPONENTS.md
│  ├─ EMMET-SHORTCUTS.md
│  └─ ...
├─ tests/                         # Test suite
│  ├─ api/                        # API tests
│  ├─ e2e/                        # End-to-end tests
│  └─ performance/                # Performance tests
├─ .vscode/                       # Editor configuration
│  ├─ settings.json               # HTX syntax highlighting
│  └─ extensions.json             # Recommended extensions
├─ .editorconfig                  # Editor consistency
├─ .prettierrc                    # Code formatting
├─ .prettierignore                # Format exclusions
├─ .gitignore                     # Git exclusions
├─ .gitattributes                 # Git file handling
├─ tsconfig.json                  # TypeScript config
├─ package.json                   # Project metadata
└─ README.md                      # Main documentation
```

## Philosophy

### Why `src/` Top-Level?

- ✅ **Industry standard** - Developers expect `src/`
- ✅ **Inclusive** - Both client and server are "source"
- ✅ **Clear separation** - `src/client/` vs `src/server/`
- ✅ **TypeScript friendly** - Path aliases work well

### Why Eliminate `public/`?

- ✅ **Not truly public** - Bun.js controls all serving
- ✅ **Less confusing** - "client" is more accurate
- ✅ **Flexible** - Server decides what's accessible
- ✅ **Modern** - Matches frameworks like Next.js, SvelteKit

## Key Directories

### `src/client/` - Frontend Assets

**Everything served to the browser:**
- `.htx` files - Pages and components
- `.js` files - Client-side JavaScript
- `.css` files - Stylesheets
- `.json` files - Translations

**Access pattern:** `https://yoursite.com/htx/page.htx` → `src/client/htx/page.htx`

### `src/server/` - Backend Code

**Everything that runs on Bun.js:**
- API endpoints
- Database queries
- WebSocket handlers
- SSR engine
- Middleware

**Never exposed to browser**, only executed on server.

### `src/app.html` - SSR Template

**The shell that wraps all pages:**
- Contains `<head>` tags
- Links to `app.css`
- Loads framework scripts
- Placeholder for navbar (`#bunz-navbar`)
- Placeholder for content (`#app`)

**Used by SSR engine** to inject page content.

## URL Mapping

| URL | File Path | Served From |
|-----|-----------|-------------|
| `/` | `src/app.html` + `src/client/htx/index.htx` | SSR |
| `/app.css` | `src/client/app.css` | Static |
| `/bunz/bunz-core.js` | `src/client/bunz/bunz-core.js` | Static |
| `/htx/room.htx` | `src/client/htx/room.htx` | Static |
| `/lang/en.json` | `src/client/lang/en.json` | Static |
| `/api/me` | `src/server/api/users.ts` | Dynamic |
| `/ws` | `src/server/bunz/bunz-websocket.ts` | WebSocket |

## Build Output

Minified files are generated in-place:
- `src/client/bunz/min/` - Minified framework
- `src/client/js/min/` - Minified page scripts

**Production:** Update `app.html` to use `/bunz/min/` and `/js/min/` paths.

## Path Aliases (TypeScript)

TypeScript can use path aliases for cleaner imports:

```typescript
// Instead of:
import { db } from '../../config/bunz-db';

// Use:
import { db } from '@server/config/bunz-db';
```

**Available aliases:**
- `@server/*` → `src/server/*`
- `@client/*` → `src/client/*`
- `@/*` → `src/*`

## Development Workflow

### Starting the Server

```bash
bun run dev          # Development with watch mode
bun run start        # Production mode
```

### Building Assets

```bash
bun run build        # Minify JS/CSS
```

### Database

```bash
bun run seed         # Seed development database
```

### Testing

```bash
bun test             # All tests
bun run test:e2e     # Playwright tests
```

## Configuration Files

| File | Purpose |
|------|---------|
| `.prettierrc` | Code formatting rules |
| `.editorconfig` | Editor consistency |
| `.gitignore` | Git exclusions |
| `.gitattributes` | Line endings, binary files |
| `tsconfig.json` | TypeScript configuration |
| `.vscode/settings.json` | HTX syntax highlighting |

## Best Practices

### 1. File Naming

- **CSS**: `app.css` (matches `app.html`)
- **Scripts**: Descriptive names (`dashboard.js`, not `script1.js`)
- **HTX**: Lowercase with hyphens (`user-profile.htx`)

### 2. Component Organization

- **Reusable components** → `src/client/htx/components/`
- **Page-specific** → `src/client/htx/`
- **With CSS** → Embed in HTX if >50 lines or component-specific
- **Without CSS** → Use global styles from `app.css`

### 3. Server Code

- **API handlers** → `src/server/api/`
- **Business logic** → Keep in API handlers or separate services
- **Utilities** → `src/server/utils/`
- **Type safety** → Use TypeScript everywhere

### 4. Static Assets

All client assets in `src/client/` are served with appropriate caching:
- **CSS**: Immutable (1 year)
- **JS (dev)**: No cache
- **JS (prod)**: Immutable (1 year)
- **HTX**: No cache (always fresh)
- **Translations**: 1 hour cache

## Migration Notes

### Previous Structure
```
public/ → src/client/
src/    → src/server/
```

All file serving logic updated in `bunz-static.ts`.

---

**See also:**
- [BUNZ Reference](./BUNZ-REFERENCE.md)
- [HTX Components](./HTX-COMPONENTS.md)
- [Emmet Shortcuts](./EMMET-SHORTCUTS.md)

