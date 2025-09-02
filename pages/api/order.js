import pool from "../../lib/db";
import sendWhatsAppMessage from "../../lib/whatsapp";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { name, email, phone, standardQuantity, lowCholQuantity, pickupLocation, pickupDate } = req.body;

  if (!name || !email || !standardQuantity || !lowCholQuantity || !pickupLocation || !pickupDate) {
    return res.status(400).json({ success: false, error: "Chybí povinná pole" });
  }

  try {
    await pool.query(
      `INSERT INTO orders 
        (name, email, phone, standard_quantity, low_cholesterol_quantity, pickup_location, pickup_date) 
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [name, email, phone, standardQuantity, lowCholQuantity, pickupLocation, pickupDate]
    );

    const msg = `📦 Nová objednávka:
👤 ${name}
📧 ${email}
📞 ${phone || "neuvedeno"}
🥚 Standard: ${standardQuantity}
🥚 Low Chol: ${lowCholQuantity}
📍 Místo: ${pickupLocation}
📅 Datum: ${pickupDate}`;

    await sendWhatsAppMessage(msg);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Chyba při ukládání objednávky:", error);
    res.status(500).json({ success: false, error: "Nepodařilo se uložit objednávku" });
  }
}
