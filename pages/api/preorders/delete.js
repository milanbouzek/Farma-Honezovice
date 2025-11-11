import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Pouze DELETE povolen" });
  }

  try {
    const { id } = req.body;

    const { error } = await supabase
      .from("preorders")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
