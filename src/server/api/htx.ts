'use strict';
/**
 * BUNZ API - HTX discovery endpoint
 * Provides list of available HTX files for auto-routing
 */

/**
 * GET /api/htx-files - Get list of HTX page files
 */
export async function handleGetHTXFiles(): Promise<Response> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    // Navigate to src/client/htx/pages from src/server/api/
    const pagesDir = path.join(import.meta.dir, "..", "..", "client", "htx", "pages");
    const files = await fs.readdir(pagesDir);
    const htxFiles = files.filter(file => file.endsWith('.htx'));
    return Response.json(htxFiles);
  } catch (error) {
    console.error("Error reading HTX pages directory:", error);
    return Response.json({ error: "Could not read HTX pages directory" }, { status: 500 });
  }
}

