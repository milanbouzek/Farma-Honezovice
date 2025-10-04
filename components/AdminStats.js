import { db } from "../../../lib/db"; // Tvůj DB connector

export default async function handler(req, res) {
  const { startDate, endDate, period } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Chybí startDate nebo endDate" });
  }

  let groupBy;
  switch (period) {
    case "week":
      groupBy = "YEAR(orderDate), WEEK(orderDate)";
      break;
    case "month":
      groupBy = "YEAR(orderDate), MONTH(orderDate)";
      break;
    case "year":
    default:
      groupBy = "YEAR(orderDate)";
  }

  try {
    const query = `
      SELECT 
        ${groupBy} AS period,
        COUNT(*) AS ordersCount,
        SUM(totalPrice) AS revenue
      FROM Orders
      WHERE orderDate BETWEEN ? AND ?
      GROUP BY ${groupBy}
      ORDER BY ${groupBy}
    `;

    const stats = await db.query(query, [startDate, endDate]);
    res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru" });
  }
}
