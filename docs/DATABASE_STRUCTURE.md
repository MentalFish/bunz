# Database Structure & Configuration

## Overview

The BUNZ application uses SQLite for data persistence with environment-based database separation.

## Folder Structure

```
/data
├── README.md          # Database documentation
├── .gitkeep           # Ensures folder is tracked by git
├── dev.db             # Development database (default)
├── test.db            # Testing database (created on test runs)
└── prod.db            # Production database (created on production)
```

## Environment Configuration

The database system automatically selects the appropriate database file based on the `NODE_ENV` environment variable:

| Environment | Database | Auto-created | Purpose |
|------------|----------|--------------|---------|
| `development` (default) | `dev.db` | ✅ Yes | Local development |
| `test` | `test.db` | ✅ Yes | Automated testing |
| `production` | `prod.db` | ✅ Yes | Production server |

## Implementation

**Configuration file:** `src/config/db.ts`

```typescript
const ENV = process.env.NODE_ENV || 'development';

const DB_FILES: Record<string, string> = {
  'development': 'dev.db',
  'test': 'test.db',
  'production': 'prod.db'
};

const DB_FILE = DB_FILES[ENV] || 'dev.db';
const DB_PATH = join(process.cwd(), 'data', DB_FILE);
```

## Usage

### Development
```bash
# Start development server (uses dev.db)
bun run dev

# Seed development database
bun run seed
```

### Testing
```bash
# Run tests (uses test.db)
bun run test

# Seed test database
bun run seed:test
```

### Production
```bash
# Start production server (uses prod.db)
bun run start

# Or with explicit environment
NODE_ENV=production bun src/server.ts
```

## Database Schema

The schema is automatically initialized on first run by `initializeDatabase()` in `src/config/db.ts`.

### Tables

1. **user** - User accounts
   - id, email, name, emailVerified, createdAt, updatedAt

2. **password** - Password hashes (bcrypt)
   - id, userId, hash

3. **session** - Authentication sessions
   - id, userId, token, expiresAt, createdAt

4. **organization** - Organizations
   - id, name, description, ownerId, createdAt, updatedAt

5. **team** - Teams within organizations
   - id, organizationId, name, description, createdAt, updatedAt

6. **project** - Projects within teams
   - id, teamId, name, description, status, createdAt, updatedAt

7. **meeting** - Video conference meetings
   - id, projectId, title, scheduledFor, duration, status, roomId, createdAt

8. **meeting_participant** - Meeting participants
   - id, meetingId, userId, role, joinedAt, leftAt

## Migration Strategy

When schema changes are needed:

1. Update `initializeDatabase()` in `src/config/db.ts`
2. Tables use `CREATE TABLE IF NOT EXISTS`
3. For existing tables, add `ALTER TABLE` statements
4. Test changes on `test.db` first
5. Deploy to production

## Backup Recommendations

### Production (`prod.db`)
- **Critical:** Set up automated daily backups
- Use cron jobs or backup services
- Store backups off-server
- Test restore procedures regularly
- Consider point-in-time recovery strategy

### Development/Test
- These databases can be safely deleted
- Will be recreated automatically on next run
- Use `bun run seed` to repopulate with test data

## Git Configuration

Database files are excluded from version control via `.gitignore`:

```gitignore
# Database
*.db
data/*.db
!data/.gitkeep
```

**Why?**
- Prevents committing sensitive user data
- Avoids large binary files in git history
- Eliminates merge conflicts from database changes
- Each developer maintains their own `dev.db`

## Security Notes

1. **Production Database:**
   - Ensure proper file permissions (600 or 640)
   - Store in a secure location
   - Never commit to version control
   - Include in backup routines

2. **Connection:**
   - SQLite uses file-based access (no network exposure)
   - Foreign key constraints enabled via PRAGMA
   - Passwords stored with bcrypt hashing

3. **Access Control:**
   - Application-level authentication via sessions
   - Row-level security through userId checks
   - SQL injection prevention via prepared statements

## Performance Tips

1. **Indexes:** Consider adding indexes for frequently queried columns
2. **PRAGMA settings:** Already configured with `foreign_keys = ON`
3. **Connection pooling:** SQLite handles this internally
4. **WAL mode:** Consider enabling for production (`PRAGMA journal_mode=WAL`)

## Troubleshooting

**Database locked error:**
- Another process might be accessing the database
- Check for running `bun` processes
- Close any SQLite browser/editor tools

**Schema mismatch:**
- Delete the database file and restart the server
- Schema will be recreated automatically

**Permission denied:**
- Ensure the `data/` folder exists
- Check file permissions
- Verify the application has write access

## Future Considerations

As the application scales, consider:

1. **PostgreSQL migration** - For concurrent writes and advanced features
2. **Read replicas** - For horizontal scaling
3. **Sharding** - For very large datasets
4. **Cloud database services** - For managed backups and high availability

For now, SQLite provides excellent performance and simplicity for the BUNZ application.

