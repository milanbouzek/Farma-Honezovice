import { supabaseServer } from "../../../lib/supabaseServerClient";

export default async function handler(req, res) {
  try {
    const { data, error } = await supabaseServer
      .from("orders")
      .select("*")
      .order("id", { ascending: true });
    if (error) throw error;
    res.status(200).json({ orders: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
