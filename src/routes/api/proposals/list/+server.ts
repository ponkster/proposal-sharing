import type { RequestHandler } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { dbAll } from "$lib/db";

export const POST: RequestHandler = async ({ request }) => {
  const { adminKey } = await request.json();

  if (adminKey !== env.ADMIN_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Get all proposals with basic info (no content for performance)
  const proposals = dbAll(`
    SELECT id, title, createdAt 
    FROM proposals 
    ORDER BY createdAt DESC
  `);

  return new Response(JSON.stringify({ proposals }), { status: 200 });
};