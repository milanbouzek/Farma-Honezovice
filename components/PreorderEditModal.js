import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

/**
 * PreorderEditModal
 * props:
 * - preorder (object)
 * - onClose()
 * - onSaved()
 */
export default function PreorderEditModal({ preorder, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    if (!preorder) return;
    setForm({
      id: preorder.id,
      name: preorder.name || "",
      email: preorder.email || "",
      phone: preorder.phone || "",
      standardQty: preorder.standardQty ?? 0,
      lowcholQty: preorder.lowcholQty ?? 0,
      pickuplocation: preorder.pickuplocation || "",
      pickupdate: preorder.pickupdate || "", // date string YYYY-MM-DD or null
      note: preorder.note || "",
      status: preorder.status || "nová",
    });
  }, [preorder]);

  if (!form) return null;

  const today = new Date(); today.setHours(0,0,0,0);
  const parseDateFromCZ = (cz) => {
    if (!cz) return null;
    if (cz.includes(".")) {
      const [dd, mm, yyyy] = cz.split(".");
      if (!dd || !mm || !yyyy) return null;
      const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    } else {
      const d = new Date(cz);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  };

  const formatDateCZ = (date) => {
    if (!date) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
  const isValidDate = (date, location = form.pickuplocation) => {
    let d = date instanceof Date ? new Date(date) : parseDateFromCZ(date);
    if (!d) return false;
    d.setHours(0,0,0,0);
    if (d <= today) return false;
    if (location === "Dematic Ostrov u Stříbra 65" && isWeekend(d)) return false;
    return true;
  };

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleDateSelect = (date) => {
    if (!date) return;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (!isValidDate(d, form.pickuplocation)) {
      setDateError("Neplatné datum (dnešek / víkend pro Dematic).");
      return;
    }
    setField("pickupdate", d.toISOString().split("T")[0]);
    setDateError("");
    setShowCalendar(false);
  };

  const disabledFn = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (d <= today) return true;
    if (form.pickuplocation === "Dematic Ostrov u Stříbra 65") {
      return d.getDay() === 0 || d.getDay() === 6;
    }
    return false;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        id: form.id,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        pickuplocation: form.pickuplocation,
        pickupdate: form.pickupdate || null, // YYYY-MM-DD
        standardQty: Number(form.standardQty || 0),
        lowcholQty: Number(form.lowcholQty || 0),
        note: form.note || null,
        status: form.status || null,
      };

      const res = await fetch("/api/preorders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Neznámá chyba");

      toast.success("Předobjednávka uložena");
      onSaved && onSaved();
    } catch (err) {
      toast.error("Chyba: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">Upravit předobjednávku #{form.id}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">Zavřít</button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700">Jméno</label>
            <input className="w-full border rounded-xl p-2" value={form.name} onChange={(e)=>setField("name", e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-gray-700">Email</label>
              <input type="email" className="w-full border rounded-xl p-2" value={form.email||""} onChange={(e)=>setField("email", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Telefon</label>
              <input type="tel" className="w-full border rounded-xl p-2" value={form.phone||""} onChange={(e)=>setField("phone", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-gray-700">Standard Qty</label>
              <input type="number" min="0" className="w-full border rounded-xl p-2" value={form.standardQty} onChange={(e)=>setField("standardQty", Number(e.target.value||0))}/>
            </div>
            <div>
              <label className="block text-sm text-gray-700">LowChol Qty</label>
              <input type="number" min="0" className="w-full border rounded-xl p-2" value={form.lowcholQty} onChange={(e)=>setField("lowcholQty", Number(e.target.value||0))}/>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700">Místo vyzvednutí</label>
            <div className="flex gap-2 mt-2">
              {["Dematic Ostrov u Stříbra 65","Honezovice"].map(loc=>(
                <button key={loc} type="button" onClick={()=>setField("pickuplocation", loc)} className={`px-4 py-2 rounded-xl ${form.pickuplocation===loc?"bg-green-500 text-white":"bg-yellow-400"}`}>{loc}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700">Datum vyzvednutí</label>
            <input type="text" readOnly value={form.pickupdate ? formatDateCZ(new Date(form.pickupdate)) : ""} onFocus={()=>setShowCalendar(true)} placeholder="DD.MM.YYYY" className="w-full border rounded-xl p-2" />
            {dateError && <p className="text-red-600 text-sm">{dateError}</p>}
            {showCalendar && <div className="mt-2"><DayPicker mode="single" selected={form.pickupdate ? new Date(form.pickupdate) : undefined} onSelect={handleDateSelect} disabled={disabledFn} weekStartsOn={1} /></div>}
          </div>

          <div>
            <label className="block text-sm text-gray-700">Status</label>
            <select value={form.status || ""} onChange={(e)=>setField("status", e.target.value)} className="w-full border rounded-xl p-2">
              <option value="nová">nová</option>
              <option value="potvrzená">potvrzená</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700">Poznámka</label>
            <textarea className="w-full border rounded-xl p-2" value={form.note||""} onChange={(e)=>setField("note", e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-xl">Zrušit</button>
            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-xl">{loading ? "Ukládám..." : "Uložit"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
