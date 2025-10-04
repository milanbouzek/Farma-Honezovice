import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { id, paid } = req.body;

  if (typeof id === "undefined" || typeof paid === "undefined") {
    return res.status(400).json({ success: false, message: "Chybí parametry" });
  }

  const { error } = await supabase
    .from("orders")
    .update({ paid })
    .eq("id", id);

  if (error) {
    return res.status(500).json({ success: false, message: error.message });
  }

  res.status(200).json({ success: true, paid });
}
