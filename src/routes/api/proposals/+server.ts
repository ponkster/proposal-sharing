import type { RequestHandler } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { dbRun, bcrypt } from "$lib/db";
import { randomUUID } from "crypto";

export const POST: RequestHandler = async ({ request }) => {
  const { title, markdown, mockups, password, adminKey } = await request.json();

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

  const id = randomUUID().slice(0, 8);
  const passwordHash = await bcrypt.hash(password, 10);

  dbRun(
    "INSERT INTO proposals (id, title, markdown, mockups, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    id, title, markdown, JSON.stringify(mockups), passwordHash, new Date().toISOString()
  );

  return new Response(JSON.stringify({ id }), { status: 201 });
};