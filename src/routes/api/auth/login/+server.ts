import type { RequestHandler } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

export const POST: RequestHandler = async ({ request }) => {
  const { adminKey } = await request.json();

  if (adminKey !== env.ADMIN_KEY) {
    return new Response(JSON.stringify({ error: "Invalid admin key" }), { status: 401 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};