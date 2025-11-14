import { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { X } from "lucide-react";
import toast from "react-hot-toast";

export default function PreorderEditModal({ preorder, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const calendarRef = useRef(null);

  // naplnění formuláře
  useEffect(() => {
    if (!preorder) return;

    setForm({
      id: preorder.id,
      name: preorder.name || "",
      email: preorder.email || "",
      phone: preorder.phone || "",
      pickuplocation: preorder.pickuplocation || "",
      pickupdate: preorder.pickupdate || "",
      standardQty: preorder.standardQty ?? 0,
      lowcholQty: preorder.lowcholQty ?? 0,
      note: preorder.note || "",
      status: preorder.status || "čeká",
    });
  }, [preorder]);

  if (!form) return null;

  // pomocné funkce
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDateCZ = (date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const parseDateFromCZ = (cz) => {
    if (!cz) return null;
    const [dd, mm, yyyy] = cz.split(".");
    if (!dd || !mm || !yyyy) return null;
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  };

  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

  const isValidDate = (date, location = form.pickuplocation) => {
    let d = date instanceof Date ? date : parseDateFromCZ(date);
    if (!d) return false;

    d.setHours(0, 0, 0, 0);
    if (d <= today) return false;

    if (location === "Dematic Ostrov u Stříbra 65" && isWeekend(d)) return false;

    return true;
  };

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // výběr data
  const handleDateSelect = (d) => {
    if (!d) return;

    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (!isValidDate(date)) {
      if (form.pickuplocation === "Dematic Ostrov u Stříbra 65") {
        setDateError("❌ Nelze vybrat dnešní den nebo víkend pro Dematic.");
      } else {
        setDateError("❌ Nelze vybrat dnešní den.");
      }
      return;
    }

    setField("pickupdate", formatDateCZ(date));
    setDateError("");
    setShowCalendar(false);
  };

  const handleDateQuickPick = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);

    if (!isValidDate(d, form.pickuplocation)) {
      if (form.pickuplocation === "Dematic Ostrov u Stříbra 65") {
        setDateError("❌ Nelze vybrat dnešní den nebo víkend pro Dematic.");
      } else {
        setDateError("❌ Nelze vybrat dnešní den.");
      }
      return;
    }

    setField("pickupdate", formatDateCZ(d));
    setDateError("");
  };

  // uložení
  const handleSave = async () => {
    setLoading(true);

    try {
      const parsed = parseDateFromCZ(form.pickupdate);
      let isoDate = form.pickupdate;

      if (parsed) {
        isoDate = parsed.toISOString().split("T")[0];
      }

      const payload = {
        ...form,
        pickupdate: isoDate,
      };

      const res = await fetch("/api/preorders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Chyba při ukládání");
      } else {
        toast.success("Předobjednávka upravena");
        onSaved?.();
        onClose?.();
      }
    } catch (err) {
      toast.error("Chyba: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === RETURN ===
  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Upravit předobjednávku #{form.id}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Jméno */}
          <div>
            <label className="block text-sm mb-1">Jméno</label>
            <input
              className="input input-bordered w-full"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
          </div>

          {/* Email / Telefon */}
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm mb-1">Telefon</label>
              <input
                className="input input-bordered w-full"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                className="input input-bordered w-full"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>
          </div>

          {/* Množství */}
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm mb-1">Standardní</label>
              <input
                type="number"
                min="0"
                className="input input-bordered w-full"
                value={form.standardQty}
                onChange={(e) => setField("standardQty", Number(e.target.value || 0))}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">LowChol</label>
              <input
                type="number"
                min="0"
                className="input input-bordered w-full"
                value={form.lowcholQty}
                onChange={(e) => setField("lowcholQty", Number(e.target.value || 0))}
              />
            </div>
          </div>

          {/* Místo odběru */}
          <div>
            <label className="block text-sm mb-1">Místo vyzvednutí</label>
            <div className="flex gap-2 flex-wrap">
              {["Dematic Ostrov u Stříbra 65", "Honezovice"].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setField("pickuplocation", loc)}
                  className={`px-4 py-2 rounded-xl font-semibold shadow ${
                    form.pickuplocation === loc
                      ? "bg-green-500 text-white"
                      : "bg-yellow-400 text-black"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Datum */}
          <div>
            <label className="block text-sm mb-1">Datum vyzvednutí</label>
            <input
              className={`input input-bordered w-full ${dateError ? "border-red-500" : ""}`}
              value={form.pickupdate}
              readOnly
              onFocus={() => setShowCalendar(true)}
            />

            {dateError && <p className="text-red-500 text-xs mt-1">{dateError}</p>}

            {showCalendar && (
              <div className="mt-2">
                <DayPicker
                  mode="single"
                  selected={parseDateFromCZ(form.pickupdate) || undefined}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    if (d <= today) return true;
                    if (form.pickuplocation === "Dematic Ostrov u Stříbra 65" && isWeekend(d))
                      return true;
                    return false;
                  }}
                />
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button className="bg-yellow-400 px-3 py-1 rounded" onClick={() => handleDateQuickPick(1)}>
                Zítra
              </button>
              <button className="bg-yellow-400 px-3 py-1 rounded" onClick={() => handleDateQuickPick(2)}>
                Pozítří
              </button>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm mb-1">Stav</label>
            <select
              className="select select-bordered w-full"
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
            >
              <option value="čeká">čeká</option>
              <option value="potvrzená">potvrzená</option>
              <option value="zrušená">zrušená</option>
            </select>
          </div>

          {/* Poznámka */}
          <div>
            <label className="block text-sm mb-1">Poznámka</label>
            <textarea
              className="textarea textarea-bordered w-full"
              value={form.note}
              onChange={(e) => setField("note", e.target.value)}
            />
          </div>

          {/* Akce */}
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-4 py-2 border rounded-xl" onClick={onClose}>
              Zavřít
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-xl"
              disabled={loading}
              onClick={handleSave}
            >
              {loading ? "Ukládám..." : "Uložit změny"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
