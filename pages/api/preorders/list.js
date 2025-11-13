import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  try {
    const search = req.query.search || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "created_at_desc";

    let query = supabase.from("preorders").select("*");

    // Filtrování textu
    if (search.trim() !== "") {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    // Filtrování statusu
    if (status !== "") {
      query = query.eq("status", status);
    }

    // Třídění
    if (sort === "created_at_desc") query = query.order("created_at", { ascending: false });
    if (sort === "created_at_asc") query = query.order("created_at", { ascending: true });
    if (sort === "name_asc") query = query.order("name", { ascending: true });
    if (sort === "name_desc") query = query.order("name", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({ preorders: data });
  } catch (err) {
    console.error("List error:", err);
    res.status(500).json({ error: "Failed to load preorders." });
  }
}
