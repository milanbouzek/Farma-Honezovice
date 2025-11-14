// pages/api/admin/delete-order.js
import { supabase } from "@/lib/supabaseServerClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Pouze POST metoda je povolena." });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Chybí ID objednávky." });
  }

  try {
    // Zkontrolujeme, zda objednávka existuje
    const { data: existing, error: selectError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", id)
      .single();

    if (selectError) {
      return res.status(500).json({ error: "Chyba při ověřování objednávky." });
    }

    if (!existing) {
      return res.status(404).json({ error: "Objednávka nenalezena." });
    }

    // SMAZAT OBJEDNÁVKU
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete order error:", deleteError);
      return res.status(500).json({ error: "Chyba při mazání objednávky." });
    }

    return res.status(200).json({
      success: true,
      message: "Objednávka byla úspěšně smazána.",
    });

  } catch (err) {
    console.error("Unhandled delete error:", err);
    return res.status(500).json({
      error: "Neočekávaná chyba serveru.",
      details: err.message,
    });
  }
}
