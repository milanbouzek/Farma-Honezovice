import { useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

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

  const [showCalendar, setShowCalendar] = useState(false);
  const [dateError, setDateError] = useState("");
  const [loading, setLoading] = useState(false);

  const calendarRef = useRef(null);

  // --------- DATUM FUNKCE ---------

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDateOffset = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const formatDateCZ = (d) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}.${d.getFullYear()}`;
  };

  const parseCZ = (cz) => {
    const [dd, mm, yyyy] = cz.split(".");
    if (!dd || !mm || !yyyy) return null;
    const iso = `${yyyy}-${mm}-${dd}`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

  const isValidDate = (date, location = formData.pickupLocation) => {
    let d = date instanceof Date ? new Date(date) : parseCZ(date);
    if (!d) return false;
    d.setHours(0, 0, 0, 0);

    const tomorrow = getDateOffset(1);

    if (d < tomorrow) return false;
    if (location === "Dematic Ostrov u Stříbra 65" && isWeekend(d)) return false;

    return true;
  };

  const handleDateSelect = (date) => {
    if (!date) return;

    if (!isValidDate(date)) {
      if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
        setDateError("❌ Pro Dematic nelze vybrat dnešní den ani víkend.");
      } else {
        setDateError("❌ Datum musí být nejdříve zítra.");
      }
      return;
    }

    setFormData((prev) => ({ ...prev, pickupDate: formatDateCZ(date) }));
    setShowCalendar(false);
    setDateError("");
  };

  const handleDateQuickPick = (offset) => {
    const d = getDateOffset(offset);

    if (!isValidDate(d)) {
      if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
        setDateError("❌ Pro Dematic nelze vybrat dnešní den ani víkend.");
      } else {
        setDateError("❌ Datum musí být nejdříve zítra.");
      }
      return;
    }

    setFormData((prev) => ({ ...prev, pickupDate: formatDateCZ(d) }));
    setDateError("");
  };

  const disabledFn = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const tomorrow = getDateOffset(1);
    if (d < tomorrow) return true;

    if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65" && isWeekend(d)) {
      return true;
    }

    return false;
  };

  // --------- FORM FUNKCE ---------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "standardQuantity" || name === "lowCholQuantity"
          ? value === "" ? "" : parseInt(value, 10)
          : value,
    }));
  };

  const handleAdd = (field, amount) => {
    setFormData((prev) => {
      const cur = parseInt(prev[field] || 0, 10);
      return { ...prev, [field]: Math.max(0, cur + amount) };
    });
  };

  const handlePickupSelect = (loc) => {
    setFormData((prev) => ({ ...prev, pickupLocation: loc }));

    if (formData.pickupDate) {
      const parsed = parseCZ(formData.pickupDate);
      if (!isValidDate(parsed, loc)) {
        setFormData((prev) => ({ ...prev, pickupDate: "" }));
        setDateError(
          loc === "Dematic Ostrov u Stříbra 65"
            ? "❌ Pro Dematic není dnes ani víkend povolen."
            : "❌ Datum musí být nejdříve zítra."
        );
      } else {
        setDateError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const std = parseInt(formData.standardQuantity || 0, 10);
    const low = parseInt(formData.lowCholQuantity || 0, 10);
    const total = std + low;

    if (!formData.name.trim()) return toast.error("❌ Zadejte jméno.");
    if (!formData.pickupLocation) return toast.error("❌ Vyberte místo odběru.");
    if (!formData.pickupDate) return toast.error("❌ Vyberte datum odběru.");

    const parsed = parseCZ(formData.pickupDate);
    if (!isValidDate(parsed)) return toast.error("❌ Neplatné datum odběru.");

    if (total < 10) return toast.error("❌ Minimální objednávka je 10 ks.");
    if (total % 10 !== 0) return toast.error("❌ Počet vajec musí být násobek 10.");
    if (total > 20) return toast.error("❌ Maximálně 20 ks na předobjednávku.");

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
          pickupDate: formData.pickupDate, // DD.MM.YYYY
          standardQty: std,
          lowcholQty: low,
          note: formData.note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "❌ Chyba při odesílání.");
      } else {
        toast.success("✅ Předobjednávka byla odeslána!");
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
      }
    } catch (err) {
      toast.error("❌ Chyba připojení.");
    } finally {
      setLoading(false);
    }
  };

  // --------- RENDER ---------
  return (
    <div className="max-w-lg mx-auto p-4">
      <Toaster position="top-center" />

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 space-y-4"
      >
        {/* NAME */}
        <div>
          <label className="block text-gray-700 mb-1">Jméno a příjmení *</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-xl p-2"
            placeholder="Jan Novák"
          />
        </div>

        {/* PHONE */}
        <div>
          <label className="block text-gray-700 mb-1">Telefon</label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border rounded-xl p-2"
          />
        </div>

        {/* EMAIL */}
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
            className="w-full border rounded-xl p-2"
          />
        </div>

        {/* STANDARD EGGS */}
        <div>
          <label className="block text-gray-700 mb-1">Standardní vejce *</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="standardQuantity"
              value={formData.standardQuantity}
              onChange={handleChange}
              className="w-full border rounded-xl p-2"
            />
            <button onClick={() => handleAdd("standardQuantity", 5)} type="button" className="bg-yellow-400 px-3 py-1 rounded-lg">
              +5
            </button>
            <button onClick={() => handleAdd("standardQuantity", 10)} type="button" className="bg-yellow-400 px-3 py-1 rounded-lg">
              +10
            </button>
          </div>
        </div>

        {/* LOWCHOL EGGS */}
        <div>
          <label className="block text-gray-700 mb-1">LowChol vejce *</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="lowCholQuantity"
              value={formData.lowCholQuantity}
              onChange={handleChange}
              className="w-full border rounded-xl p-2"
            />
            <button onClick={() => handleAdd("lowCholQuantity", 5)} type="button" className="bg-yellow-400 px-3 py-1 rounded-lg">
              +5
            </button>
            <button onClick={() => handleAdd("lowCholQuantity", 10)} type="button" className="bg-yellow-400 px-3 py-1 rounded-lg">
              +10
            </button>
          </div>
        </div>

        {/* PICKUP LOCATION */}
        <div>
          <label className="block text-gray-700 mb-1">Místo vyzvednutí *</label>
          <div className="flex flex-wrap gap-2">
            {["Dematic Ostrov u Stříbra 65", "Honezovice"].map((loc) => (
              <button
                type="button"
                key={loc}
                onClick={() => handlePickupSelect(loc)}
                className={`px-4 py-2 rounded-xl font-semibold shadow-md ${
                  formData.pickupLocation === loc
                    ? "bg-green-500 text-white"
                    : "bg-yellow-400 text-gray-900"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* PICKUP DATE */}
        <div>
          <label className="block text-gray-700 mb-1">Datum vyzvednutí *</label>
          <input
            readOnly
            name="pickupDate"
            value={formData.pickupDate}
            onFocus={() => setShowCalendar(true)}
            className={`w-full border rounded-xl p-2 ${dateError ? "border-red-500" : ""}`}
            placeholder="DD.MM.YYYY"
          />

          {dateError && <p className="text-red-600 text-sm mt-1">{dateError}</p>}

          {showCalendar && (
            <div ref={calendarRef} className="mt-2">
              <DayPicker
                mode="single"
                selected={formData.pickupDate ? parseCZ(formData.pickupDate) : undefined}
                onSelect={handleDateSelect}
                disabled={disabledFn}
                weekStartsOn={1}
              />
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => handleDateQuickPick(1)} className="bg-yellow-400 px-3 py-1 rounded-lg">
              Zítra
            </button>
            <button type="button" onClick={() => handleDateQuickPick(2)} className="bg-yellow-400 px-3 py-1 rounded-lg">
              Pozítří
            </button>
          </div>
        </div>

        {/* NOTE */}
        <div>
          <label className="block text-gray-700 mb-1">Poznámka</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            className="w-full border rounded-xl p-2 h-20"
          />
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-400 w-full px-6 py-3 rounded-xl font-semibold shadow-md"
        >
          {loading ? "Odesílám…" : "Odeslat předobjednávku"}
        </button>

      </form>
    </div>
  );
}
