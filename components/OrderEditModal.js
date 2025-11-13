import { useEffect, useState, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { X } from "lucide-react";
import toast from "react-hot-toast";

/**
 * OrderEditModal
 * Props:
 * - order: objekt objednávky (není null)
 * - onClose(): zavře modal
 * - onSaved(): callback po úspěšném uložení (např. refresh)
 *
 * Design + logika data + blokování víkendů pro Dematic kopírováno z OrderForm.
 */
export default function OrderEditModal({ order, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [manualPrice, setManualPrice] = useState(false);

  const calendarRef = useRef(null);

  useEffect(() => {
    if (!order) return;
    setForm({
      id: order.id,
      customer_name: order.customer_name || "",
      email: order.email || "",
      phone: order.phone || "",
      standard_quantity: order.standard_quantity ?? 0,
      low_chol_quantity: order.low_chol_quantity ?? 0,
      pickup_location: order.pickup_location || "",
      pickup_date: order.pickup_date || "", // expecting YYYY-MM-DD or DD.MM.YYYY depending on your DB; we will keep string and display as DD.MM.YYYY if needed
      status: order.status || "",
      paid: !!order.paid,
      payment_total: order.payment_total !== null && order.payment_total !== undefined ? Number(order.payment_total) : 0,
      payment_currency: order.payment_currency || "CZK",
    });

    // pokud původní cena existuje a liší se od vypočtené, zapnout manual flag
    const calc = (Number(order.standard_quantity || 0) * 5) + (Number(order.low_chol_quantity || 0) * 7);
    setManualPrice(Number(order.payment_total) !== calc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  if (!form) return null;

  // helpers (kopie z OrderForm)
  const today = new Date(); today.setHours(0,0,0,0);
  const formatDateCZ = (date) => {
    if (!date) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };
  const parseDateFromCZ = (cz) => {
    if (!cz) return null;
    // support DD.MM.YYYY and ISO YYYY-MM-DD
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
  const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;
  const isValidDate = (date, location = form.pickup_location) => {
    let d = date instanceof Date ? new Date(date) : parseDateFromCZ(date);
    if (!d) return false;
    d.setHours(0,0,0,0);
    if (d <= today) return false;
    if (location === "Dematic Ostrov u Stříbra 65" && isWeekend(d)) return false;
    return true;
  };

  const calcPrice = (std, low) => {
    const s = Number(std || 0);
    const l = Number(low || 0);
    return s * 5 + l * 7;
  };

  // změny polí
  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    // auto přepočet ceny pokud není manual
    if (!manualPrice && (k === "standard_quantity" || k === "low_chol_quantity")) {
      const std = k === "standard_quantity" ? v : form.standard_quantity;
      const low = k === "low_chol_quantity" ? v : form.low_chol_quantity;
      setForm((p) => ({ ...p, payment_total: calcPrice(std, low) }));
    }
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (!isValidDate(d, form.pickup_location)) {
      if (form.pickup_location === "Dematic Ostrov u Stříbra 65") {
        setDateError("❌ Nelze vybrat dnešní den nebo víkend pro Dematic.");
      } else {
        setDateError("❌ Nelze vybrat dnešní den.");
      }
      return;
    }
    setField("pickup_date", formatDateCZ(d));
    setDateError("");
    setShowCalendar(false);
  };

  const handleDateQuickPick = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0,0,0,0);
    if (!isValidDate(d, form.pickup_location)) {
      if (form.pickup_location === "Dematic Ostrov u Stříbra 65") {
        setDateError("❌ Nelze vybrat dnešní den nebo víkend pro Dematic.");
      } else {
        setDateError("❌ Nelze vybrat dnešní den.");
      }
      return;
    }
    setField("pickup_date", formatDateCZ(d));
    setDateError("");
    setShowCalendar(false);
  };

  const disabledFn = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (d <= today) return true;
    if (form.pickup_location === "Dematic Ostrov u Stříbra 65") {
      const day = d.getDay();
      if (day === 0 || day === 6) return true;
    }
    return false;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // normalize pickup_date to YYYY-MM-DD for server if it's DD.MM.YYYY
      let pickupDateOut = form.pickup_date;
      const parsed = parseDateFromCZ(form.pickup_date);
      if (parsed) {
        pickupDateOut = parsed.toISOString().split("T")[0];
      }

      const payload = {
        id: form.id,
        customer_name: form.customer_name,
        email: form.email || null,
        phone: form.phone || null,
        standard_quantity: Number(form.standard_quantity || 0),
        low_chol_quantity: Number(form.low_chol_quantity || 0),
        pickup_location: form.pickup_location,
        pickup_date: pickupDateOut,
        status: form.status,
        paid: !!form.paid,
        payment_total: Number(form.payment_total || 0),
        payment_currency: form.payment_currency || "CZK",
      };

      const res = await fetch("/api/admin/update-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Objednávka uložena");
        onSaved && onSaved();
        onClose && onClose();
      } else {
        toast.error(data.error || "Nepodařilo se uložit objednávku");
      }
    } catch (err) {
      console.error("Update order error:", err);
      toast.error("Chyba při ukládání: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">Upravit objednávku #{form.id}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* jméno */}
          <div>
            <label className="block text-sm text-gray-700">Jméno</label>
            <input
              value={form.customer_name}
              onChange={(e) => setField("customer_name", e.target.value)}
              className="w-full border rounded-xl p-2"
            />
          </div>

          {/* email / phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-gray-700">Email</label>
              <input
                value={form.email || ""}
                onChange={(e) => setField("email", e.target.value)}
                className="w-full border rounded-xl p-2"
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Telefon</label>
              <input
                value={form.phone || ""}
                onChange={(e) => setField("phone", e.target.value)}
                className="w-full border rounded-xl p-2"
                type="tel"
              />
            </div>
          </div>

          {/* quantities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-gray-700">Standardní množství</label>
              <input
                type="number"
                min="0"
                value={form.standard_quantity}
                onChange={(e) => setField("standard_quantity", Number(e.target.value || 0))}
                className="w-full border rounded-xl p-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">LowChol množství</label>
              <input
                type="number"
                min="0"
                value={form.low_chol_quantity}
                onChange={(e) => setField("low_chol_quantity", Number(e.target.value || 0))}
                className="w-full border rounded-xl p-2"
              />
            </div>
          </div>

          {/* price */}
          <div>
            <label className="block text-sm text-gray-700">Cena</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={form.payment_total}
                onChange={(e) => { setField("payment_total", Number(e.target.value || 0)); setManualPrice(true); }}
                className="w-full border rounded-xl p-2"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={manualPrice}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setManualPrice(on);
                    if (!on) {
                      // revert to auto
                      const auto = calcPrice(form.standard_quantity, form.low_chol_quantity);
                      setForm((p) => ({ ...p, payment_total: auto }));
                    }
                  }}
                />
                Manual price
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Automatická cena = 5 Kč × standard + 7 Kč × lowChol (přepočítává se při změně množství pokud není zapnutý Manual).
            </p>
          </div>

          {/* pickup location */}
          <div>
            <label className="block text-sm text-gray-700">Místo vyzvednutí</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {["Dematic Ostrov u Stříbra 65", "Honezovice"].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setField("pickup_location", loc)}
                  className={`px-4 py-2 rounded-xl font-semibold shadow-md ${
                    form.pickup_location === loc
                      ? "bg-green-500 text-white"
                      : "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* pickup date */}
          <div>
            <label className="block text-sm text-gray-700">Datum vyzvednutí</label>
            <input
              type="text"
              name="pickup_date"
              value={form.pickup_date}
              onFocus={() => setShowCalendar(true)}
              readOnly
              placeholder="DD.MM.YYYY"
              className={`w-full border rounded-xl p-2 ${dateError ? "border-red-500" : ""}`}
            />
            {dateError && <p className="text-red-600 text-sm mt-1">{dateError}</p>}
            {showCalendar && (
              <div ref={calendarRef} className="mt-2">
                <DayPicker
                  mode="single"
                  selected={parseDateFromCZ(form.pickup_date) || undefined}
                  onSelect={handleDateSelect}
                  disabled={disabledFn}
                  weekStartsOn={1}
                />
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button onClick={() => handleDateQuickPick(1)} className="bg-yellow-400 px-3 py-1 rounded-lg">Zítra</button>
              <button onClick={() => handleDateQuickPick(2)} className="bg-yellow-400 px-3 py-1 rounded-lg">Pozítří</button>
            </div>
          </div>

          {/* status / paid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="w-full border rounded-xl p-2"
              >
                <option value="nová objednávka">nová objednávka</option>
                <option value="zpracovává se">zpracovává se</option>
                <option value="vyřízená">vyřízená</option>
                <option value="zrušená">zrušená</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700">Zaplaceno</label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={form.paid}
                  onChange={(e) => setField("paid", !!e.target.checked)}
                />
                <span className="text-sm">{form.paid ? "Ano" : "Ne"}</span>
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border">Zrušit</button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
            >
              {loading ? "Ukládám..." : "Uložit změny"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
