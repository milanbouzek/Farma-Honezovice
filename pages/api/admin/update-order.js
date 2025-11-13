import { supabaseServer } from "../../../lib/supabaseServerClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      id,
      customer_name,
      email,
      phone,
      standard_quantity,
      low_chol_quantity,
      pickup_location,
      pickup_date, // expect YYYY-MM-DD or null
      status,
      paid,
      payment_total,
      payment_currency,
    } = req.body || {};

    if (!id) return res.status(400).json({ error: "Missing order id" });

    // Připravíme objekt pro update (přepišeme všechna pole)
    const updateObj = {
      customer_name: customer_name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      standard_quantity: Number(standard_quantity || 0),
      low_chol_quantity: Number(low_chol_quantity || 0),
      pickup_location: pickup_location ?? null,
      pickup_date: pickup_date ?? null,
      status: status ?? null,
      paid: !!paid,
      payment_total: payment_total !== undefined && payment_total !== null ? Number(payment_total) : null,
      payment_currency: payment_currency ?? "CZK",
    };

    const { error } = await supabaseServer
      .from("orders")
      .update(updateObj)
      .eq("id", id);

    if (error) {
      console.error("Update-order error:", error);
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Update-order catch:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
