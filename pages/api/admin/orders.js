import { supabaseServer } from "../../../lib/supabaseServerClient";

const STATUSES = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.body || {};

  try {
    if (method === "GET") {
      // Načtení všech objednávek
      const { data, error } = await supabaseServer
        .from("orders")
        .select(
          `id, customer_name, email, phone, standard_quantity, low_chol_quantity, pickup_location, pickup_date, status`
        )
        .order("id", { ascending: true });
      if (error) throw error;
      return res.status(200).json({ orders: data });
    }

    else if (method === "POST") {
      if (!id) return res.status(400).json({ error: "Missing order ID" });

      // Načteme aktuální status objednávky
      const { data: orderData, error: fetchError } = await supabaseServer
        .from("orders")
        .select("status")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      // Posun statusu o jeden dále
      const currentIndex = STATUSES.indexOf(orderData.status);
      const nextStatus =
        currentIndex < STATUSES.length - 1
          ? STATUSES[currentIndex + 1]
          : STATUSES[currentIndex];

      const { error: updateError } = await supabaseServer
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", id);
      if (updateError) throw updateError;

      return res.status(200).json({ id, status: nextStatus });
    }

    else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (err) {
    console.error("Admin orders API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
