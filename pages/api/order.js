import { supabaseServer } from "../../lib/supabaseServerClient";

const STATUSES = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // Načtení všech objednávek
      const { data, error } = await supabaseServer
        .from("orders")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      return res.status(200).json({ orders: data });
    }

    if (req.method === "POST") {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Chybí ID objednávky" });

      // Načtení objednávky
      const { data: orderData, error: selectError } = await supabaseServer
        .from("orders")
        .select("id, status")
        .eq("id", id)
        .single();

      if (selectError) throw selectError;
      if (!orderData) return res.status(404).json({ error: "Objednávka nenalezena" });

      // Posun statusu o jeden dále
      const currentIndex = STATUSES.indexOf(orderData.status);
      const newIndex = currentIndex < STATUSES.length - 1 ? currentIndex + 1 : currentIndex;
      const newStatus = STATUSES[newIndex];

      const { data: updatedOrder, error: updateError } = await supabaseServer
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id)
        .select("id, status")
        .single();

      if (updateError) throw updateError;

      return res.status(200).json(updatedOrder);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Admin orders API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
