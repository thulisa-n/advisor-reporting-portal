import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCors, sql } from "./_db";

function getCommentFromBody(req: VercelRequest): string {
  const body = req.body;

  if (typeof body === "string") {
    const parsed = new URLSearchParams(body);
    return (parsed.get("comment") ?? "").trim();
  }

  if (body && typeof body === "object" && "comment" in body) {
    const value = (body as { comment?: unknown }).comment;
    return typeof value === "string" ? value.trim() : "";
  }

  return "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") {
      const comment = getCommentFromBody(req);
      if (!comment) return res.status(400).json({ error: "comment required" });

      await sql`
        CREATE TABLE IF NOT EXISTS comments (
          id BIGSERIAL PRIMARY KEY,
          comment TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      const inserted = await sql`
        INSERT INTO comments (comment) VALUES (${comment})
        RETURNING id, comment, created_at
      `;
      return res.status(200).json({ ok: true, row: inserted.rows[0] });
    }

    if (req.method === "GET") {
      await sql`
        CREATE TABLE IF NOT EXISTS comments (
          id BIGSERIAL PRIMARY KEY,
          comment TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      const { rows } = await sql`
        SELECT id, comment, created_at
        FROM comments
        ORDER BY created_at DESC
        LIMIT 20
      `;
      return res.status(200).json(rows);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("create handler error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
