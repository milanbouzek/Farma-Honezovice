// pages/api/preorders/update.js
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Pouze POST povolen" });
  }

  try {
    const {
      id,
      name,
      email = null,
      phone = null,
      pickupLocation,
      pickupDate, // očekáváme YYYY-MM-DD nebo DD.MM.YYYY
      standardQty = 0,
      lowcholQty = 0,
      note = null,
      status = null,
    } = req.body;

    if (!id) return res.status(400).json({ error: "Chybí id předobjednávky" });
    if (!name || !pickupLocation) {
      return res.status(400).json({ error: "Chybí povinné údaje (name/pickupLocation)" });
    }

    // Normalizujeme datum: pokud DD.MM.YYYY => převést na YYYY-MM-DD
    let pickupdateOut = null;
    if (pickupDate) {
      if (pickupDate.includes(".")) {
        const [dd, mm, yyyy] = pickupDate.split(".");
        if (dd && mm && yyyy) pickupdateOut = `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
      } else {
        // předpokládej ISO
        pickupdateOut = pickupDate;
      }
    }

    const { error } = await supabase
      .from("preorders")
      .update({
        name,
        email,
        phone,
        pickuplocation: pickupLocation,
        pickupdate: pickupdateOut,
        standardQty: Number(standardQty || 0),
        lowcholQty: Number(lowcholQty || 0),
        note,
        status,
      })
      .eq("id", id);

    if (error) {
      console.error("Update preorder error:", error);
      throw error;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Update preorder catch:", err);
    res.status(500).json({ success: false, error: err.message || err });
  }
}
