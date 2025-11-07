# Database Files

This folder contains SQLite database files for different environments.

## Automatic Environment Detection

The application **automatically** selects the appropriate database based on:

1. **Hostname/URL** (primary method)
2. **NODE_ENV** environment variable (override)
3. **Default to development** (localhost)

## Environment-Based Databases

| Context | Environment | Database File |
|---------|-------------|---------------|
| `localhost:3000` | development | `dev.db` |
| `dev.example.com` | development | `dev.db` |
| `test.example.com` | test | `prod.db` ⚠️ |
| `staging.example.com` | test | `prod.db` ⚠️ |
| `example.com` | production | `prod.db` |

**Important:** Test/staging environments use `prod.db` to validate production data structure before full deployment.

## Usage

### Development (default)
```bash
bun run dev
# Automatically uses: data/dev.db
```

### Testing with Production Database
```bash
# Set hostname to trigger test environment
HOSTNAME=test.example.com bun src/server.ts
# Uses: data/prod.db
```

### Production
```bash
# Set hostname for production
HOSTNAME=example.com bun src/server.ts
# Uses: data/prod.db
```

## Server Deployment

When deploying to a web server, set the `HOSTNAME` environment variable:

```bash
# Development server
export HOSTNAME=dev.example.com

# Test/Staging server  
export HOSTNAME=test.example.com

# Production server
export HOSTNAME=example.com
```

See [DEPLOYMENT.md](../docs/DEPLOYMENT.md) for detailed deployment instructions.

## Database Schema

The database schema is automatically initialized on startup by `src/config/db.ts`.

Tables include:
- `user` - User accounts
- `password` - Password hashes
- `session` - Authentication sessions
- `organization` - Organizations
- `team` - Teams within organizations
- `project` - Projects within teams
- `meeting` - Video conference meetings
- `meeting_participant` - Meeting participants

## Backup Recommendations

**Production:**
- Set up automated backups of `prod.db`
- Consider using a backup service or cron job
- Test restore procedures regularly

**Development/Test:**
- These databases can be safely deleted and will be recreated
- Use `bun run seed` to populate with test data

## Git

Database files are ignored by `.gitignore` to prevent:
- Committing sensitive user data
- Large binary files in version control
- Merge conflicts from database changes

Only this README is tracked in git.

