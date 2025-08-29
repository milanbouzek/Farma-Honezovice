import { supabaseServer } from "../../lib/supabaseServerClient";
import nodemailer from "nodemailer";

// NodeMailer transporter pro iCloud
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp.mail.me.com
  port: 587,
  secure: false, // TLS přes port 587
  auth: {
    user: process.env.SMTP_USER, // tvůj iCloud email
    pass: process.env.SMTP_PASS, // app-specific password
  },
});

// Funkce pro odeslání upozornění emailem
async function sendOrderEmail(name, email, quantity) {
  await transporter.sendMail({
    from: `"Domácí vejce" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER, // sem přijde upozornění
    subject: "Nová objednávka vajec",
    text: `Objednávka od ${name} (${email}): ${quantity} vajec.`,
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, quantity } = req.body;

  if (!name || !email || !quantity || quantity < 1) {
    return res.status(400).json({ success: false, error: "Neplatná data." });
  }

  try {
    // 1) Načtení aktuálního počtu vajec
    const { data: stockData, error: stockError } = await supabaseServer
      .from("eggs_stock")
      .select("quantity")
      .limit(1)
      .maybeSingle();

    if (stockError) throw stockError;

    if (!stockData || stockData.quantity < quantity) {
      return res.status(400).json({ success: false, error: "Nedostatek vajec." });
    }

    const newQuantity = stockData.quantity - quantity;

    // 2) Uložení objednávky
    const { error: insertError } = await supabaseServer
      .from("orders")
      .insert([{ name, email, quantity }]);

    if (insertError) throw insertError;

    // 3) Aktualizace zásoby
    const { error: updateError } = await supabaseServer
      .from("eggs_stock")
      .update({ quantity: newQuantity })
      .eq("id", 1);

    if (updateError) throw updateError;

    // 4) Odeslání upozornění emailem
    await sendOrderEmail(name, email, quantity);

    return res.status(200).json({ success: true, remaining: newQuantity });
  } catch (err) {
    console.error("Order API error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  }
}
