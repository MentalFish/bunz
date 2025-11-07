import { initializeDatabase, createOrganization, createTeam, createProject, createMeeting } from "../config/db";

console.log("🌱 Seeding database...");

// Initialize database schema
initializeDatabase();

// Note: In a real application, you would create users through Better Auth's signup flow
// For now, we'll just set up the schema. Users will be created when they sign up.

console.log("✅ Database seeding complete!");
console.log("\n📝 Next steps:");
console.log("1. Start the server: bun run dev");
console.log("2. Sign up a new user");
console.log("3. Create organizations, teams, projects, and meetings through the UI or API");

