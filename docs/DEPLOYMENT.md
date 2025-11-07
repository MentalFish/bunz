# Deployment Configuration Guide

## Automatic Environment Detection

The BUNZ application automatically detects which database to use based on the hostname/URL context.

## Detection Logic

### Priority Order:

1. **Explicit `NODE_ENV`** (if set) - highest priority
2. **Hostname detection** (from `HOSTNAME` or `DOMAIN` env vars)
3. **Default to development** (localhost/no hostname)

## Environment Mapping

| Context | Environment | Database Used | Example URLs |
|---------|------------|---------------|--------------|
| Localhost | `development` | `dev.db` | `localhost:3000`, `127.0.0.1:3000` |
| Dev subdomain | `development` | `dev.db` | `dev.example.com`, `dev.yourdomain.com` |
| Test/Staging subdomain | `test` | `prod.db` | `test.example.com`, `staging.example.com` |
| Production domain | `production` | `prod.db` | `example.com`, `www.example.com`, `app.example.com` |

### Important Note:
**Test/staging environments use `prod.db`** - This allows you to validate the production database structure and data with your test/staging frontend before fully deploying to production.

## Local Development Setup

No configuration needed! Just run:

```bash
bun run dev
```

Output:
```
📊 Environment: development
📊 Database: dev.db
```

## Server Deployment

### Option 1: Environment Variables (Recommended)

Set the `HOSTNAME` environment variable to match your subdomain structure:

#### Development Server
```bash
export HOSTNAME=dev.example.com
bun src/server.ts
```

#### Test/Staging Server
```bash
export HOSTNAME=test.example.com
bun src/server.ts
```

#### Production Server
```bash
export HOSTNAME=example.com
# or
export HOSTNAME=www.example.com
bun src/server.ts
```

### Option 2: Explicit NODE_ENV

Override automatic detection with explicit environment:

```bash
# Force development
NODE_ENV=development bun src/server.ts

# Force test (uses prod.db)
NODE_ENV=test bun src/server.ts

# Force production
NODE_ENV=production bun src/server.ts
```

## Docker Deployment

### docker-compose.yml Example

```yaml
version: '3.8'

services:
  # Development
  bunz-dev:
    image: bunz:latest
    environment:
      - HOSTNAME=dev.example.com
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data

  # Test/Staging
  bunz-test:
    image: bunz:latest
    environment:
      - HOSTNAME=test.example.com
    ports:
      - "3001:3000"
    volumes:
      - ./data:/app/data  # Same data folder, uses prod.db

  # Production
  bunz-prod:
    image: bunz:latest
    environment:
      - HOSTNAME=example.com
    ports:
      - "3002:3000"
    volumes:
      - ./data:/app/data
```

## Nginx/Reverse Proxy Setup

### Nginx Configuration

```nginx
# Development subdomain
server {
    listen 80;
    server_name dev.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Test/Staging subdomain
server {
    listen 80;
    server_name test.example.com staging.example.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Production domain
server {
    listen 80;
    server_name example.com www.example.com;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Systemd Service Files

### Development Service
`/etc/systemd/system/bunz-dev.service`

```ini
[Unit]
Description=BUNZ Development Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/bunz
Environment="HOSTNAME=dev.example.com"
ExecStart=/usr/local/bin/bun src/server.ts
Restart=always

[Install]
WantedBy=multi-user.target
```

### Test/Staging Service
`/etc/systemd/system/bunz-test.service`

```ini
[Unit]
Description=BUNZ Test/Staging Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/bunz
Environment="HOSTNAME=test.example.com"
ExecStart=/usr/local/bin/bun src/server.ts
Restart=always

[Install]
WantedBy=multi-user.target
```

### Production Service
`/etc/systemd/system/bunz-prod.service`

```ini
[Unit]
Description=BUNZ Production Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/bunz
Environment="HOSTNAME=example.com"
ExecStart=/usr/local/bin/bun src/server.ts
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable bunz-prod
sudo systemctl start bunz-prod
sudo systemctl status bunz-prod
```

## Cloud Platform Deployments

### Railway.app
Set environment variable in dashboard:
```
HOSTNAME=your-app.railway.app
```

### Fly.io
In `fly.toml`:
```toml
[env]
  HOSTNAME = "your-app.fly.dev"
```

### Vercel/Netlify
Not recommended for this server (requires persistent SQLite storage).
Use Railway, Fly.io, or traditional VPS instead.

## Testing the Configuration

After deployment, check the logs to verify correct environment detection:

```bash
# Check logs
journalctl -u bunz-prod -f

# Or for Docker
docker logs -f bunz-prod
```

You should see:
```
📊 Environment: production
📊 Database: prod.db
🌐 Hostname: example.com
```

## Deployment Workflow

### Recommended workflow:

1. **Develop locally**
   - Work on `localhost` → uses `dev.db`
   - Make changes, test features

2. **Deploy to dev server**
   - Push to `dev.example.com` → uses `dev.db`
   - Team testing, integration testing

3. **Deploy to test/staging**
   - Push to `test.example.com` → uses `prod.db`
   - Final validation with production database
   - This ensures your code works with real prod data structure

4. **Deploy to production**
   - Push to `example.com` → uses `prod.db`
   - Same database as test/staging ensures smooth transition

## Database Migration Path

When deploying a new version:

```bash
# 1. Backup production database
cp data/prod.db data/prod.db.backup

# 2. Deploy to test.example.com first
# Test with prod.db to ensure migrations work

# 3. If successful, deploy to production
# If issues found, restore backup
```

## Environment Variables Summary

| Variable | Purpose | Example |
|----------|---------|---------|
| `HOSTNAME` | Auto-detect environment from subdomain | `dev.example.com` |
| `DOMAIN` | Alternative to HOSTNAME | `example.com` |
| `NODE_ENV` | Force specific environment | `production` |

## Troubleshooting

**Wrong database being used:**
- Check `HOSTNAME` environment variable
- Check server logs for detected environment
- Override with explicit `NODE_ENV` if needed

**Database not found:**
- Ensure `data/` folder exists
- Check file permissions
- Verify database path in logs

**Test environment not using prod.db:**
- Verify hostname starts with `test.` or `staging.`
- Check environment detection logs
- Use explicit `NODE_ENV=test` if needed

## Security Considerations

1. **Never commit database files** - Already configured in `.gitignore`
2. **Secure production database** - Set proper file permissions (640)
3. **Backup regularly** - Automate backups for `prod.db`
4. **Separate test from production** - Use different servers/containers
5. **Environment isolation** - Use firewalls to protect production database access

## Next Steps

After deployment:
1. Monitor logs for environment detection
2. Test database connections
3. Verify correct database is being used
4. Set up automated backups for `prod.db`
5. Configure monitoring and alerts

