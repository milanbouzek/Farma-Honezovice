import { supabaseServer } from "../../../lib/supabaseServerClient";

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.body || {};

  try {
    if (method === "GET") {
      const { data, error } = await supabaseServer
        .from("orders")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;
      res.status(200).json({ orders: data });
    } else if (method === "POST") {
      if (!id) return res.status(400).json({ error: "Missing order ID" });

      // Načteme aktuální status
      const { data: orderData, error: fetchError } = await supabaseServer
        .from("orders")
        .select("status")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      const statuses = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];
      const currentIndex = statuses.indexOf(orderData.status);
      const nextStatus = currentIndex < statuses.length - 1 ? statuses[currentIndex + 1] : statuses[currentIndex];

      const { error: updateError } = await supabaseServer
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", id);
      if (updateError) throw updateError;

      res.status(200).json({ id, status: nextStatus });
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
