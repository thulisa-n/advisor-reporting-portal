import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCors, sql } from "./_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // GET /api/clients → list all
    if (req.method === "GET") {
      const { rows } = await sql`
        SELECT data FROM clients ORDER BY created_at ASC
      `;
      return res.status(200).json(rows.map((r) => r.data));
    }

    // POST /api/clients → upsert
    if (req.method === "POST") {
      const client = req.body;
      if (!client?.id) return res.status(400).json({ error: "id required" });
      await sql`
        INSERT INTO clients (id, data, created_at, updated_at)
        VALUES (
          ${client.id},
          ${JSON.stringify(client)},
          ${client.createdAt ?? new Date().toISOString()},
          ${client.updatedAt ?? new Date().toISOString()}
        )
        ON CONFLICT (id) DO UPDATE
          SET data = EXCLUDED.data,
              updated_at = EXCLUDED.updated_at
      `;
      return res.status(200).json({ ok: true });
    }

    // DELETE /api/clients?id=xxx
    if (req.method === "DELETE") {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "id required" });
      // reports cascade via FK
      await sql`DELETE FROM clients WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("clients handler error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
