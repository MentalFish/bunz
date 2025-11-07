import { Database } from "bun:sqlite";
import { join } from "path";

/**
 * Detect environment based on hostname/URL context
 * Priority:
 * 1. Explicit NODE_ENV if set
 * 2. Hostname detection (dev.*, test.*, localhost)
 * 3. Default to development
 */
function detectEnvironment(): 'development' | 'test' | 'production' {
  // Explicit environment variable takes highest priority
  if (process.env.NODE_ENV) {
    const env = process.env.NODE_ENV.toLowerCase();
    if (env === 'production' || env === 'test' || env === 'development') {
      return env as 'development' | 'test' | 'production';
    }
  }
  
  // Check for hostname-based detection
  const hostname = process.env.HOSTNAME || '';
  const domain = process.env.DOMAIN || '';
  
  // localhost or 127.0.0.1 or no hostname = development
  if (!hostname || hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'development';
  }
  
  // dev.* subdomain = development
  if (hostname.startsWith('dev.') || domain.startsWith('dev.')) {
    return 'development';
  }
  
  // test.* or staging.* subdomain = test (uses prod.db for validation)
  if (hostname.startsWith('test.') || hostname.startsWith('staging.') || 
      domain.startsWith('test.') || domain.startsWith('staging.')) {
    return 'test';
  }
  
  // Everything else = production
  return 'production';
}

// Detect environment
const ENV = detectEnvironment();

// Map environment to database file
// Note: 'test' environment uses prod.db for pre-production validation
const DB_FILES: Record<string, string> = {
  'development': 'dev.db',
  'test': 'prod.db',        // Test/staging uses production database
  'production': 'prod.db'
};

// Get database file based on environment
const DB_FILE = DB_FILES[ENV];
const DB_PATH = join(process.cwd(), 'data', DB_FILE);

// Log environment detection
console.log(`📊 Environment: ${ENV}`);
console.log(`📊 Database: ${DB_FILE}`);
if (process.env.HOSTNAME) console.log(`🌐 Hostname: ${process.env.HOSTNAME}`);

// Initialize database
export const db = new Database(DB_PATH);
db.exec("PRAGMA foreign_keys = ON");

// Create tables
export function initializeDatabase() {
  // Users table (Better Auth schema)
  db.run(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      emailVerified INTEGER DEFAULT 0,
      name TEXT,
      image TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  // Password table (Better Auth stores passwords separately)
  db.run(`
    CREATE TABLE IF NOT EXISTS password (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE,
      hashedPassword TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  // Sessions table (Better Auth)
  db.run(`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  // Accounts table (Better Auth - for OAuth, etc.)
  db.run(`
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      expiresAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  // Verification table (Better Auth - for email verification)
  db.run(`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL
    )
  `);

  // Organizations table
  db.run(`
    CREATE TABLE IF NOT EXISTS organization (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      logo TEXT,
      ownerId TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (ownerId) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  // Organization members table
  db.run(`
    CREATE TABLE IF NOT EXISTS organization_member (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joinedAt INTEGER NOT NULL,
      FOREIGN KEY (organizationId) REFERENCES organization(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
      UNIQUE(organizationId, userId)
    )
  `);

  // Teams table
  db.run(`
    CREATE TABLE IF NOT EXISTS team (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      organizationId TEXT NOT NULL,
      createdById TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (organizationId) REFERENCES organization(id) ON DELETE CASCADE,
      FOREIGN KEY (createdById) REFERENCES user(id)
    )
  `);

  // Team members table
  db.run(`
    CREATE TABLE IF NOT EXISTS team_member (
      id TEXT PRIMARY KEY,
      teamId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joinedAt INTEGER NOT NULL,
      FOREIGN KEY (teamId) REFERENCES team(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
      UNIQUE(teamId, userId)
    )
  `);

  // Projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS project (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      organizationId TEXT NOT NULL,
      teamId TEXT,
      createdById TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (organizationId) REFERENCES organization(id) ON DELETE CASCADE,
      FOREIGN KEY (teamId) REFERENCES team(id) ON DELETE SET NULL,
      FOREIGN KEY (createdById) REFERENCES user(id)
    )
  `);

  // Project members table
  db.run(`
    CREATE TABLE IF NOT EXISTS project_member (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'contributor',
      joinedAt INTEGER NOT NULL,
      FOREIGN KEY (projectId) REFERENCES project(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
      UNIQUE(projectId, userId)
    )
  `);

  // Meetings table
  db.run(`
    CREATE TABLE IF NOT EXISTS meeting (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      roomId TEXT UNIQUE NOT NULL,
      projectId TEXT,
      organizationId TEXT NOT NULL,
      scheduledStart INTEGER,
      scheduledEnd INTEGER,
      status TEXT DEFAULT 'scheduled',
      createdById TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (projectId) REFERENCES project(id) ON DELETE SET NULL,
      FOREIGN KEY (organizationId) REFERENCES organization(id) ON DELETE CASCADE,
      FOREIGN KEY (createdById) REFERENCES user(id)
    )
  `);

  // Meeting participants table
  db.run(`
    CREATE TABLE IF NOT EXISTS meeting_participant (
      id TEXT PRIMARY KEY,
      meetingId TEXT NOT NULL,
      userId TEXT NOT NULL,
      joinedAt INTEGER,
      leftAt INTEGER,
      FOREIGN KEY (meetingId) REFERENCES meeting(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_org_member_orgId ON organization_member(organizationId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_org_member_userId ON organization_member(userId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_team_member_teamId ON team_member(teamId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_team_member_userId ON team_member(userId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_project_member_projectId ON project_member(projectId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_project_member_userId ON project_member(userId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_meeting_roomId ON meeting(roomId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_meeting_participant_meetingId ON meeting_participant(meetingId)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_meeting_participant_userId ON meeting_participant(userId)`);

  console.log("✅ Database initialized successfully");
}

// Query helpers - using functions to avoid preparation before tables exist
export const queries = {
  // User queries
  getUserById: () => db.query("SELECT * FROM user WHERE id = ?"),
  getUserByEmail: () => db.query("SELECT * FROM user WHERE email = ?"),
  
  // Organization queries
  getOrganizationById: () => db.query("SELECT * FROM organization WHERE id = ?"),
  getOrganizationsByUserId: () => db.query(`
    SELECT o.* FROM organization o
    INNER JOIN organization_member om ON o.id = om.organizationId
    WHERE om.userId = ?
  `),
  
  // Team queries
  getTeamById: () => db.query("SELECT * FROM team WHERE id = ?"),
  getTeamsByOrganizationId: () => db.query("SELECT * FROM team WHERE organizationId = ?"),
  
  // Project queries
  getProjectById: () => db.query("SELECT * FROM project WHERE id = ?"),
  getProjectsByOrganizationId: () => db.query("SELECT * FROM project WHERE organizationId = ?"),
  getProjectsByTeamId: () => db.query("SELECT * FROM project WHERE teamId = ?"),
  
  // Meeting queries
  getMeetingById: () => db.query("SELECT * FROM meeting WHERE id = ?"),
  getMeetingByRoomId: () => db.query("SELECT * FROM meeting WHERE roomId = ?"),
  getMeetingsByProjectId: () => db.query("SELECT * FROM meeting WHERE projectId = ?"),
  getUpcomingMeetings: () => db.query(`
    SELECT m.* FROM meeting m
    WHERE m.organizationId = ? 
    AND m.scheduledStart > ?
    ORDER BY m.scheduledStart ASC
    LIMIT ?
  `),
};

// Helper functions for creating records
export function createOrganization(data: {
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
}) {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  db.run(
    `INSERT INTO organization (id, name, slug, description, ownerId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, data.name, data.slug, data.description || null, data.ownerId, now, now
  );
  
  // Add owner as admin member
  db.run(
    `INSERT INTO organization_member (id, organizationId, userId, role, joinedAt)
     VALUES (?, ?, ?, ?, ?)`,
    crypto.randomUUID(), id, data.ownerId, 'admin', now
  );
  
  return id;
}

export function createTeam(data: {
  name: string;
  description?: string;
  organizationId: string;
  createdById: string;
}) {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  db.run(
    `INSERT INTO team (id, name, description, organizationId, createdById, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, data.name, data.description || null, data.organizationId, data.createdById, now, now
  );
  
  return id;
}

export function createProject(data: {
  name: string;
  description?: string;
  organizationId: string;
  teamId?: string;
  createdById: string;
}) {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  db.run(
    `INSERT INTO project (id, name, description, organizationId, teamId, createdById, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id, data.name, data.description || null, data.organizationId, data.teamId || null, data.createdById, now, now
  );
  
  return id;
}

export function createMeeting(data: {
  title: string;
  description?: string;
  roomId: string;
  projectId?: string;
  organizationId: string;
  scheduledStart?: number;
  scheduledEnd?: number;
  createdById: string;
}) {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  db.run(
    `INSERT INTO meeting (id, title, description, roomId, projectId, organizationId, scheduledStart, scheduledEnd, status, createdById, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, data.title, data.description || null, data.roomId, data.projectId || null, 
    data.organizationId, data.scheduledStart || null, data.scheduledEnd || null, 
    'scheduled', data.createdById, now, now
  );
  
  return id;
}

export function addMeetingParticipant(meetingId: string, userId: string) {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  db.run(
    `INSERT INTO meeting_participant (id, meetingId, userId, joinedAt)
     VALUES (?, ?, ?, ?)`,
    id, meetingId, userId, now
  );
}

