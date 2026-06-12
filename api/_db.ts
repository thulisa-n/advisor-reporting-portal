import { neon } from "@neondatabase/serverless";

// POSTGRES_URL is injected by the Vercel × Neon integration.
// Falls back to DATABASE_URL for local dev after `vercel env pull`.
const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "";

// fullResults: true keeps the { rows } destructuring used in clients.ts / reports.ts
export const sql = neon(connectionString, { fullResults: true });

export function setCors(res: { setHeader: (k: string, v: string) => void }) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
