import type { RequestHandler } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { dbGet, dbRun } from "$lib/db";

// GET proposal for editing (admin only)
export const GET: RequestHandler = async ({ params, url }) => {
  const adminKey = url.searchParams.get('adminKey');
  
  if (adminKey !== env.ADMIN_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const row = dbGet("SELECT * FROM proposals WHERE id = ?", params.id);

  if (!row) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  // Parse mockups JSON, fallback to old single mockup format
  let mockups = [];
  try {
    if (row.mockups) {
      mockups = JSON.parse(row.mockups);
    } else if (row.mockup) {
      // Backward compatibility with old single mockup
      mockups = [{ title: "Mockup", html: row.mockup }];
    }
  } catch (error) {
    console.error("Error parsing mockups:", error);
    mockups = row.mockup ? [{ title: "Mockup", html: row.mockup }] : [];
  }

  return new Response(JSON.stringify({
    id: row.id,
    title: row.title,
    markdown: row.markdown,
    mockups: mockups,
    createdAt: row.createdAt
  }));
};

// PUT update proposal (admin only)
export const PUT: RequestHandler = async ({ params, request }) => {
  const { title, markdown, mockups, adminKey } = await request.json();

  if (adminKey !== env.ADMIN_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Validate mockups array
  if (!Array.isArray(mockups)) {
    return new Response(JSON.stringify({ error: "Mockups must be an array" }), { status: 400 });
  }

  if (mockups.length > 5) {
    return new Response(JSON.stringify({ error: "Maximum 5 mockups allowed" }), { status: 400 });
  }

  // Validate each mockup
  for (const mockup of mockups) {
    if (!mockup.title || !mockup.html) {
      return new Response(JSON.stringify({ error: "Each mockup must have a title and html content" }), { status: 400 });
    }
    if (mockup.title.length > 50) {
      return new Response(JSON.stringify({ error: "Mockup titles must be 50 characters or less" }), { status: 400 });
    }
  }

  // Check if proposal exists
  const existing = dbGet("SELECT id FROM proposals WHERE id = ?", params.id);
  if (!existing) {
    return new Response(JSON.stringify({ error: "Proposal not found" }), { status: 404 });
  }

  // Update the proposal
  dbRun(
    "UPDATE proposals SET title = ?, markdown = ?, mockups = ? WHERE id = ?",
    title, markdown, JSON.stringify(mockups), params.id
  );

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

export const DELETE: RequestHandler = async ({ params, request }) => {
  const { adminKey } = await request.json();

  if (adminKey !== env.ADMIN_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const proposalId = params.id;
  
  // Check if proposal exists
  const proposal = dbGet("SELECT id FROM proposals WHERE id = ?", proposalId);
  
  if (!proposal) {
    return new Response(JSON.stringify({ error: "Proposal not found" }), { status: 404 });
  }

  // Delete the proposal
  const result = dbRun("DELETE FROM proposals WHERE id = ?", proposalId);

  if (result.changes === 0) {
    return new Response(JSON.stringify({ error: "Failed to delete proposal" }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, message: "Proposal deleted successfully" }), { status: 200 });
};