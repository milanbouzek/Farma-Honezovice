import { pool } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false });
  const { id, paid } = req.body;
  if (!id) return res.status(400).json({ success: false, message: "Missing ID" });

  try {
    await pool.query("UPDATE orders SET paid = $1 WHERE id = $2", [paid, id]);
    return res.status(200).json({ success: true, paid });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
}
