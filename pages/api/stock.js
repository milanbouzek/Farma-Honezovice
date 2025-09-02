import pool from "../../lib/db";

export default async function handler(req, res) {
  try {
    const result = await pool.query("SELECT standard_quantity, low_cholesterol_quantity FROM eggs_stock ORDER BY id DESC LIMIT 1");

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        stock: { standard_quantity: 0, low_cholesterol_quantity: 0 },
      });
    }

    res.status(200).json({
      success: true,
      stock: result.rows[0],
    });
  } catch (error) {
    console.error("Chyba při načítání zásob:", error);
    res.status(500).json({ success: false, error: "Nepodařilo se načíst zásoby" });
  }
}
