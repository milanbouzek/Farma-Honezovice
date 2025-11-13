import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { X } from "lucide-react";

/**
 * PreorderForm.js
 * Formulář pro předobjednávky vajec
 * Povinná pole: jméno, počet vajec (min 10, násobky 10), místo vyzvednutí, datum vyzvednutí
 * Nepovinná pole: email, telefon, poznámka
 *
 * Po odeslání očekáváme od /api/preorders/create odpověď:
 * { success: true, id: <preorder id>, totalPrice: <number> }
 * a zobrazíme persistentní toast s číslem objednávky a cenou.
 */

export default function PreorderForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    standardQuantity: "",
    lowCholQuantity: "",
    pickupLocation: "",
    pickupDate: "", // DD.MM.YYYY
    note: "",
  });

  const [currentTotal, setCurrentTotal] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const calendarRef = useRef(null);

  // dnešek (00:00)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDateOffset = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const formatDateCZ = (date) => {
    if (!date) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const parseDateFromCZ = (cz) => {
    if (!cz) return null;
    const [dd, mm, yyyy] = cz.split(".");
    if (!dd || !mm || !yyyy) return null;
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

  const isValidDate = (date, location = formData.pickupLocation) => {
    let d = date instanceof Date ? new Date(date) : parseDateFromCZ(date);
    if (!d) return false;

    d.setHours(0, 0, 0, 0);

    if (d <= today) return false;
    if (location === "Dematic Ostrov u Stříbra 65" && isWeekend(d)) return false;

    return true;
  };

  // načtení dostupných kusů (limit 100 ks)
  const fetchLimit = async () => {
    try {
      const res = await fetch("/api/preorders");
      const data = await res.json();
      if (res.ok) {
        // Pozor: server endpoint vrací objekt s total (součet všech kusů)
        const total = data.total || 0;
        setCurrentTotal(total);
        setLimitReached(total >= 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLimit();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "standardQuantity" || name === "lowCholQuantity"
          ? value === ""
            ? ""
            : parseInt(value, 10)
          : value,
    }));
  };

  const handleAdd = (field, amount) => {
    setFormData((prev) => {
      const cur = parseInt(prev[field] || 0, 10);
      return { ...prev, [field]: Math.max(0, cur + amount) };
    });
  };

  const clearDateAndSetError = (msg) => {
    setFormData((prev) => ({ ...prev, pickupDate: "" }));
    setDateError(msg || "");
  };

  const handlePickupSelect = (loc) => {
    setFormData((prev) => ({ ...prev, pickupLocation: loc }));

    if (formData.pickupDate) {
      const parsed = parseDateFromCZ(formData.pickupDate);
      if (!isValidDate(parsed, loc)) {
        if (loc === "Dematic Ostrov u Stříbra 65") {
          clearDateAndSetError("❌ Nelze vybrat dnešní den nebo víkend pro Dematic.");
        } else {
          clearDateAndSetError("❌ Nelze vybrat dnešní den.");
        }
      } else {
        setDateError("");
      }
    }
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (!isValidDate(d)) {
      if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
        clearDateAndSetError("❌ Nelze vybrat dnešní den nebo víkend pro Dematic.");
      } else {
        clearDateAndSetError("❌ Nelze vybrat dnešní den.");
      }
      return;
    }

    setFormData((prev) => ({ ...prev, pickupDate: formatDateCZ(d) }));
    setDateError("");
    setShowCalendar(false);
  };

  const handleDateQuickPick = (offset) => {
    const d = getDateOffset(offset);

    if (!isValidDate(d)) {
      if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
        clearDateAndSetError("❌ Nelze vybrat dnešní den nebo víkend pro Dematic.");
      } else {
        clearDateAndSetError("❌ Nelze vybrat dnešní den.");
      }
    } else {
      setFormData((prev) => ({ ...prev, pickupDate: formatDateCZ(d) }));
      setDateError("");
    }

    setShowCalendar(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const standard = parseInt(formData.standardQuantity || 0, 10);
    const lowchol = parseInt(formData.lowCholQuantity || 0, 10);
    const totalEggs = standard + lowchol;

    // validace
    if (!formData.name.trim()) {
      toast.error("❌ Zadejte jméno a příjmení.");
      return;
    }
    if (!formData.pickupLocation) {
      toast.error("❌ Vyberte místo vyzvednutí.");
      return;
    }
    if (!formData.pickupDate || !isValidDate(formData.pickupDate)) {
      toast.error("❌ Neplatné nebo chybějící datum vyzvednutí.");
      return;
    }
    if (totalEggs < 10 || totalEggs % 10 !== 0) {
      toast.error("❌ Minimální objednávka je 10 ks a násobky 10.");
      return;
    }
    if (totalEggs > 20) {
      toast.error("❌ Maximálně 20 ks na jednu předobjednávku.");
      return;
    }
    if (currentTotal + totalEggs > 100) {
      toast.error(
        `❌ Celkový limit 100 ks překročen. Dostupných: ${100 - currentTotal}`
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/preorders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          pickupLocation: formData.pickupLocation,
          pickupDate: formData.pickupDate,
          standardQty: standard,
          lowcholQty: lowchol,
          note: formData.note,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // ---- CUSTOM TOAST with preorder ID + price ----
        toast.custom(
          (t) => (
            <div
              className={`bg-white shadow-lg rounded-2xl p-5 max-w-md w-full relative ${
                t.visible ? "animate-enter" : "animate-leave"
              }`}
            >
              <button
                onClick={() => toast.dismiss(t.id)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              >
                <X size={18} />
              </button>

              <h3 className="text-lg font-bold mb-2">✅ Předobjednávka byla úspěšně odeslána</h3>

              <p className="mb-1">
                Číslo předobjednávky:{" "}
                <strong>{data.id ?? data.preorderId ?? "—"}</strong>
              </p>

              <p className="mb-1">
                Celková cena:{" "}
                <strong>{(data.totalPrice ?? data.price ?? 0)} Kč</strong>
              </p>

              <p className="text-sm text-gray-500 mt-2">
                Uloženo do systému — čeká na potvrzení.
              </p>
            </div>
          ),
          { duration: 10000 }
        );

        // reset formuláře
        setFormData({
          name: "",
          email: "",
          phone: "",
          standardQuantity: "",
          lowCholQuantity: "",
          pickupLocation: "",
          pickupDate: "",
          note: "",
        });

        setDateError("");
        fetchLimit();
      } else {
        toast.error(data.error || "❌ Chyba při odesílání.");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Chyba připojení k serveru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <Toaster position="top-center" />

      {limitReached ? (
        <p className="text-center text-red-600 font-semibold">
          Limit 100 ks byl dosažen. Předobjednávky jsou uzavřeny.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-2xl p-6 space-y-4"
        >
          {/* Jméno */}
          <div>
            <label className="block text-gray-700 mb-1">Jméno a příjmení *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-xl p-2"
              placeholder="Zadejte celé jméno"
            />
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded-xl p-2"
              placeholder="+420…"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded-xl p-2"
              placeholder="např. jan@domena.cz"
            />
          </div>

          {/* Standard */}
          <div>
            <label className="block text-gray-700 mb-1">Počet standardních vajec *</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                name="standardQuantity"
                value={formData.standardQuantity}
                onChange={handleChange}
                min="0"
                placeholder="0"
                className="w-full border rounded-xl p-2"
              />
              <button
                type="button"
                onClick={() => handleAdd("standardQuantity", 5)}
                className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => handleAdd("standardQuantity", 10)}
                className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500"
              >
                +10
              </button>
            </div>
          </div>

          {/* LowChol */}
          <div>
            <label className="block text-gray-700 mb-1">Počet vajec se sníženým cholesterolem *</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                name="lowCholQuantity"
                value={formData.lowCholQuantity}
                onChange={handleChange}
                min="0"
                placeholder="0"
                className="w-full border rounded-xl p-2"
              />
              <button
                type="button"
                onClick={() => handleAdd("lowCholQuantity", 5)}
                className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => handleAdd("lowCholQuantity", 10)}
                className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500"
              >
                +10
              </button>
            </div>
          </div>

          {/* Místo vyzvednutí */}
          <div>
            <label className="block text-gray-700 mb-1">Místo vyzvednutí *</label>
            <div className="flex flex-wrap gap-2">
              {["Dematic Ostrov u Stříbra 65", "Honezovice"].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handlePickupSelect(loc)}
                  className={`px-4 py-2 rounded-xl font-semibold shadow-md ${
                    formData.pickupLocation === loc
                      ? "bg-green-500 text-white"
                      : "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* DATUM VYZVEDNUTÍ */}
          <div>
            <label className="block text-gray-700 mb-1">Datum vyzvednutí *</label>

            <input
              type="text"
              name="pickupDate"
              value={formData.pickupDate}
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
                  selected={formData.pickupDate ? parseDateFromCZ(formData.pickupDate) : undefined}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    if (d <= today) return true;
                    if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65" && isWeekend(d)) return true;
                    return false;
                  }}
                  weekStartsOn={1}
                />
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleDateQuickPick(1)}
                className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500"
              >
                Zítra
              </button>

              <button
                type="button"
                onClick={() => handleDateQuickPick(2)}
                className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500"
              >
                Pozítří
              </button>
            </div>
          </div>

          {/* Poznámka */}
          <div>
            <label className="block text-gray-700 mb-1">Poznámka</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="w-full border rounded-xl p-2 h-20"
            />
          </div>

          {/* Odeslat */}
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-400 w-full px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 transform transition"
          >
            {loading ? "Odesílám..." : "Odeslat předobjednávku"}
          </button>
        </form>
      )}
    </div>
  );
}
