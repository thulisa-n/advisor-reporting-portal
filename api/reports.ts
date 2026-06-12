import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCors, sql } from "./_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // GET /api/reports?clientId=xxx → reports for one client
    // GET /api/reports → all reports
    if (req.method === "GET") {
      const clientId = req.query.clientId as string | undefined;
      const { rows } = clientId
        ? await sql`SELECT data FROM reports WHERE client_id = ${clientId} ORDER BY year, quarter`
        : await sql`SELECT data FROM reports ORDER BY year, quarter`;
      return res.status(200).json(rows.map((r) => r.data));
    }

    // POST /api/reports → upsert
    if (req.method === "POST") {
      const report = req.body;
      if (!report?.id || !report?.clientId) {
        return res.status(400).json({ error: "id and clientId required" });
      }
      await sql`
        INSERT INTO reports (id, client_id, year, quarter, data, updated_at)
        VALUES (
          ${report.id},
          ${report.clientId},
          ${report.year},
          ${report.quarter},
          ${JSON.stringify(report)},
          ${report.updatedAt ?? new Date().toISOString()}
        )
        ON CONFLICT (id) DO UPDATE
          SET data = EXCLUDED.data,
              updated_at = EXCLUDED.updated_at
      `;
      return res.status(200).json({ ok: true });
    }

    // DELETE /api/reports?id=xxx
    if (req.method === "DELETE") {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "id required" });
      await sql`DELETE FROM reports WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("reports handler error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
