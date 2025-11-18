import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { X } from "lucide-react";
import PreorderCapacity from "./PreorderCapacity";

export default function PreorderForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    standardQuantity: "",
    lowCholQuantity: "",
    pickupLocation: "",
    pickupDate: "",
    note: "",
  });

  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const [minDate, setMinDate] = useState(null);
  const [minDateCZ, setMinDateCZ] = useState("");

  const calendarRef = useRef(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // === helpers ===
  const formatDateCZ = (date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const parseDateFromCZ = (cz) => {
    if (!cz) return null;
    const [dd, mm, yyyy] = cz.split(".");
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  };

  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

  const isDateAllowed = (d, location = formData.pickupLocation) => {
    if (!(d instanceof Date)) d = parseDateFromCZ(d);
    if (!d || !minDate) return false;

    d.setHours(0, 0, 0, 0);

    if (d < minDate) return false;
    if (location === "Dematic Ostrov u Stříbra 65" && isWeekend(d)) return false;

    return true;
  };

  // === dynamic minDate loader ===
  useEffect(() => {
    const qty =
      parseInt(formData.standardQuantity || 0, 10) +
      parseInt(formData.lowCholQuantity || 0, 10);

    if (qty <= 0) return;

    (async () => {
      try {
        const res = await fetch(`/api/preorders/min-date?qty=${qty}`);
        const data = await res.json();

        if (data.minDate) {
          const d = new Date(data.minDate);
          d.setHours(0, 0, 0, 0);

          setMinDate(d);
          setMinDateCZ(data.minDateCZ);
        }
      } catch (err) {
        console.error("min-date fetch error:", err);
      }
    })();
  }, [formData.standardQuantity, formData.lowCholQuantity]);

  // === handlers ===
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

  const handlePickupSelect = (loc) => {
    setFormData((prev) => ({ ...prev, pickupLocation: loc }));
  };

  const handleAdd = (field, amount) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(0, parseInt(prev[field] || 0, 10) + amount),
    }));
  };

  const handleDateSelect = (date) => {
    if (!date) return;

    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setHours(0, 0, 0, 0);

    if (!isDateAllowed(d)) {
      setDateError(`❌ Nejbližší možný termín je ${minDateCZ}.`);
      return;
    }

    setFormData((prev) => ({ ...prev, pickupDate: formatDateCZ(d) }));
    setDateError("");
    setShowCalendar(false);
  };

  const handleDateQuickPick = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);

    if (!isDateAllowed(d)) {
      setDateError(`❌ Nejbližší možný termín je ${minDateCZ}.`);
      return;
    }

    setFormData((prev) => ({ ...prev, pickupDate: formatDateCZ(d) }));
    setDateError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const std = parseInt(formData.standardQuantity || 0, 10);
    const low = parseInt(formData.lowCholQuantity || 0, 10);
    const total = std + low;

    if (!formData.name.trim())
      return toast.error("❌ Zadejte jméno a příjmení.");

    if (!formData.pickupLocation)
      return toast.error("❌ Vyberte místo odběru.");

    const d = parseDateFromCZ(formData.pickupDate);
    if (!isDateAllowed(d))
      return toast.error(`❌ Neplatné datum. Min.: ${minDateCZ}`);

    if (total < 10 || total % 10 !== 0)
      return toast.error("❌ Minimální objednávka je 10 ks a násobky 10.");

    if (total > 20)
      return toast.error("❌ Maximálně 20 ks.");

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
          standardQty: std,
          lowcholQty: low,
          note: formData.note,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Předobjednávka vytvořena (#${data.id})`);

        if (window.updatePreorderCapacity) {
          window.updatePreorderCapacity();
        }

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
      } else {
        toast.error(data.error || "❌ Chyba při odesílání.");
      }
    } catch (err) {
      toast.error("❌ Chyba připojení.");
    } finally {
      setLoading(false);
    }
  };

  // === UI ===
  return (
    <div className="max-w-lg mx-auto p-4">
      <Toaster position="top-center" />

      <PreorderCapacity />

      {minDateCZ && (
        <div className="bg-blue-100 text-blue-700 p-3 rounded-xl mb-3 text-sm">
          Nejbližší možný termín vyzvednutí: <strong>{minDateCZ}</strong>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 space-y-4"
      >
        {/* Name */}
        <div>
          <label className="block text-gray-700 mb-1">Jméno a příjmení *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-xl p-2"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-gray-700 mb-1">Telefon</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border rounded-xl p-2"
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
          />
        </div>

        {/* Quantities */}
        <div>
          <label className="block mb-1">Počet standardních vajec *</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="standardQuantity"
              value={formData.standardQuantity}
              onChange={handleChange}
              className="w-full border rounded-xl p-2"
            />
            <button
              type="button"
              onClick={() => handleAdd("standardQuantity", 5)}
              className="bg-yellow-400 px-3 py-1 rounded-lg"
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => handleAdd("standardQuantity", 10)}
              className="bg-yellow-400 px-3 py-1 rounded-lg"
            >
              +10
            </button>
          </div>
        </div>

        <div>
          <label className="block mb-1">
            Počet vajec se sníženým cholesterolem *
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="lowCholQuantity"
              value={formData.lowCholQuantity}
              onChange={handleChange}
              className="w-full border rounded-xl p-2"
            />
            <button
              type="button"
              onClick={() => handleAdd("lowCholQuantity", 5)}
              className="bg-yellow-400 px-3 py-1 rounded-lg"
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => handleAdd("lowCholQuantity", 10)}
              className="bg-yellow-400 px-3 py-1 rounded-lg"
            >
              +10
            </button>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block mb-1">Místo vyzvednutí *</label>
          <div className="flex gap-2">
            {["Dematic Ostrov u Stříbra 65", "Honezovice"].map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => handlePickupSelect(loc)}
                className={`px-4 py-2 rounded-xl ${
                  formData.pickupLocation === loc
                    ? "bg-green-500 text-white"
                    : "bg-yellow-400"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block mb-1">Datum vyzvednutí *</label>
          <input
            type="text"
            value={formData.pickupDate}
            readOnly
            onFocus={() => setShowCalendar(true)}
            className={`w-full border rounded-xl p-2 ${
              dateError ? "border-red-500" : ""
            }`}
            placeholder="Vyberte datum"
          />

          {dateError && (
            <p className="text-red-600 text-sm mt-1">{dateError}</p>
          )}

          {showCalendar && (
            <div ref={calendarRef} className="mt-2">
              <DayPicker
                mode="single"
                selected={
                  formData.pickupDate
                    ? parseDateFromCZ(formData.pickupDate)
                    : undefined
                }
                onSelect={handleDateSelect}
                weekStartsOn={1}
                disabled={(day) => {
                  if (!minDate) return true;

                  const d = new Date(
                    day.getFullYear(),
                    day.getMonth(),
                    day.getDate()
                  );
                  d.setHours(0, 0, 0, 0);

                  if (d < minDate) return true;
                  if (
                    formData.pickupLocation ===
                      "Dematic Ostrov u Stříbra 65" &&
                    isWeekend(d)
                  )
                    return true;

                  return false;
                }}
              />
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleDateQuickPick(1)}
              className="bg-yellow-400 px-3 py-1 rounded-lg"
            >
              Zítra
            </button>
            <button
              type="button"
              onClick={() => handleDateQuickPick(2)}
              className="bg-yellow-400 px-3 py-1 rounded-lg"
            >
              Pozítří
            </button>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block mb-1">Poznámka</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            className="w-full border rounded-xl p-2"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-400 w-full px-6 py-3 rounded-xl font-semibold"
        >
          {loading ? "Odesílám…" : "Odeslat předobjednávku"}
        </button>
      </form>
    </div>
  );
}
