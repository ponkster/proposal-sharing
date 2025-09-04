import type { RequestHandler } from "@sveltejs/kit";
import { dbGet, bcrypt } from "$lib/db";

export const POST: RequestHandler = async ({ params, request }) => {
  const { password } = await request.json();
  const row = dbGet("SELECT * FROM proposals WHERE id = ?", params.id);

  if (!row) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const ok = await bcrypt.compare(password, row.passwordHash);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Wrong password" }), { status: 403 });
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
    title: row.title, 
    markdown: row.markdown, 
    mockups: mockups
  }));
};