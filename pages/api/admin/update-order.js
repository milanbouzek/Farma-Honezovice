import { supabaseServer } from "../../../../lib/supabaseServerClient";

function parsePossibleCZ(dateStr) {
  if (!dateStr) return null;
  // support DD.MM.YYYY or YYYY-MM-DD or full ISO
  if (dateStr.includes(".")) {
    const [dd, mm, yyyy] = dateStr.split(".");
    if (!dd || !mm || !yyyy) return null;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  // assume already YYYY-MM-DD or ISO
  return dateStr.split("T")[0];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const payload = req.body || {};
    const {
      id,
      customer_name,
      email,
      phone,
      standard_quantity,
      low_chol_quantity,
      pickup_location,
      pickup_date,
      status,
      paid,
      payment_total,
      payment_currency,
    } = payload;

    if (!id) return res.status(400).json({ error: "Missing order id" });

    // prepare update object: only include provided fields
    const update = {};

    if (customer_name !== undefined) update.customer_name = customer_name;
    if (email !== undefined) update.email = email === "" ? null : email;
    if (phone !== undefined) update.phone = phone === "" ? null : phone;
    if (standard_quantity !== undefined)
      update.standard_quantity = Number(standard_quantity || 0);
    if (low_chol_quantity !== undefined)
      update.low_chol_quantity = Number(low_chol_quantity || 0);
    if (pickup_location !== undefined) update.pickup_location = pickup_location;
    if (pickup_date !== undefined) {
      const normalized = parsePossibleCZ(pickup_date);
      update.pickup_date = normalized;
    }
    if (status !== undefined) update.status = status;
    if (paid !== undefined) update.paid = !!paid;
    if (payment_total !== undefined && payment_total !== null)
      update.payment_total = Number(payment_total);
    if (payment_currency !== undefined) update.payment_currency = payment_currency;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { error } = await supabaseServer.from("orders").update(update).eq("id", id);

    if (error) {
      console.error("Update order error:", error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Update order catch:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
