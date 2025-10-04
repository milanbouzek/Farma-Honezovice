import { pool } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Missing order ID" });
  }

  try {
    await pool.query("UPDATE orders SET total_price = 0 WHERE id = $1", [id]);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Chyba při nulování ceny:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
}
