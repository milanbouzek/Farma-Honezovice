import { supabaseServer } from "../../../lib/supabaseServerClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: "Missing orderId" });

  try {
    const { error } = await supabaseServer
      .from("orders")
      .update({ processed: true })
      .eq("id", orderId);
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
