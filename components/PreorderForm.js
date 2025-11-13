import { useState, useEffect, useRef } from "react";
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

  const [currentTotal, setCurrentTotal] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateError, setDateError] = useState("");

  const calendarRef = useRef(null);

  // === DATUM FUNKCE ===
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
    const d = date instanceof Date ? date : parseDateFromCZ(date);
    if (!d) return false;

    const test = new Date(d);
    test.setHours(0, 0, 0, 0);

    if (test <= today) return false;

    if (location === "Dematic Ostrov u Stříbra 65" && isWeekend(test))
      return false;

    const max = getDateOffset(30);
    if (test > max) return false;

    return true;
  };

  // === LIMIT FETCH ===
  const fetchLimit = async () => {
    try {
      const res = await fetch("/api/preorders");
      const data = await res.json();
      if (res.ok) {
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

  // === HANDLERY ===
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
      return { ...prev, [field]: Math.min(Math.max(cur + amount, 0), 20) };
    });
  };

  const handlePickupSelect = (loc) => {
    setFormData((prev) => ({ ...prev, pickupLocation: loc }));

    // revalidace datumu
    if (formData.pickupDate) {
      const d = parseDateFromCZ(formData.pickupDate);
      if (!isValidDate(d, loc)) {
        setFormData((prev) => ({ ...prev, pickupDate: "" }));
        setDateError("Vyberte jiné datum pro toto místo.");
      } else {
        setDateError("");
      }
    }
  };

  const handleDateSelect = (d) => {
    if (!d) return;

    const test = new Date(d);
    test.setHours(0, 0, 0, 0);

    if (!isValidDate(test)) {
      if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
        setDateError("❌ Pro Dematic nelze dnešek ani víkend.");
      } else {
        setDateError("❌ Nelze vybrat dnešní nebo minulý den.");
      }
      return;
    }

    setFormData((prev) => ({ ...prev, pickupDate: formatDateCZ(test) }));
    setDateError("");
    setShowCalendar(false);
  };

  const handleDateQuickPick = (offset) => {
    const d = getDateOffset(offset);
    handleDateSelect(d);
  };

  // === SUBMIT ===
  const handleSubmit = async (e) => {
    e.preventDefault();

    const standard = parseInt(formData.standardQuantity || 0, 10);
    const lowchol = parseInt(formData.lowCholQuantity || 0, 10);
    const totalEggs = standard + lowchol;

    if (!formData.name.trim()) return toast.error("❌ Zadejte jméno.");
    if (!formData.pickupLocation) return toast.error("❌ Zvolte místo odběru.");

    if (!formData.pickupDate)
      return toast.error("❌ Vyberte datum vyzvednutí.");

    if (!isValidDate(formData.pickupDate))
      return toast.error("❌ Datum není platné.");

    if (totalEggs < 10) return toast.error("❌ Minimum 10 ks.");
    if (totalEggs % 10 !== 0) return toast.error("❌ Násobky 10.");
    if (totalEggs > 20) return toast.error("❌ Max 20 ks.");

    if (currentTotal + totalEggs > 100)
      return toast.error(
        `❌ Celkový limit překročen. Zbývá ${100 - currentTotal} ks.`
      );

    const pickupISO = parseDateFromCZ(formData.pickupDate)
      .toISOString()
      .split("T")[0]; // YYYY-MM-DD

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
          pickupDate: pickupISO,
          standardQty: standard,
          lowcholQty: lowchol,
          note: formData.note,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("✅ Předobjednávka odeslána!");
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
        toast.error(data.error || "Chyba při odeslání.");
      }
    } catch (err) {
      toast.error("Chyba serveru.");
    } finally {
      setLoading(false);
    }
  };

  // === DISABLED DAYS ===
  const disabledFn = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (d <= today) return true;

    if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
      const day = d.getDay();
      if (day === 0 || day === 6) return true;
    }

    return false;
  };

  // === RENDER ===
  return (
    <div className="max-w-lg mx-auto p-4">
      <Toaster position="top-center" />

      {limitReached ? (
        <p className="text-center text-red-600 font-semibold">
          Limit 100 ks byl dosažen.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-2xl p-6 space-y-4"
        >
          {/* Jméno */}
          <div>
            <label className="block text-gray-700 mb-1">
              Jméno a příjmení *
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-xl p-2"
            />
          </div>

          {/* Email */}
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

          {/* Telefon */}
          <div>
            <label className="block text-gray-700 mb-1">Telefon</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              type="tel"
              className="w-full border rounded-xl p-2"
            />
          </div>

          {/* Počty vajec */}
          <div>
            <label className="block text-gray-700 mb-1">
              Standardní vejce *
            </label>
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
            <label className="block text-gray-700 mb-1">
              LowChol vejce *
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

          {/* Místo odběru */}
          <div>
            <label className="block text-gray-700 mb-1">
              Místo vyzvednutí *
            </label>
            <div className="flex flex-wrap gap-2">
              {["Dematic Ostrov u Stříbra 65", "Honezovice"].map((loc) => (
                <button
                  type="button"
                  key={loc}
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

          {/* Datum odběru */}
          <div>
            <label className="block text-gray-700 mb-1">
              Datum vyzvednutí *
            </label>
            <input
              type="text"
              name="pickupDate"
              value={formData.pickupDate}
              readOnly
              onFocus={() => setShowCalendar(true)}
              onClick={() => setShowCalendar(true)}
              placeholder="DD.MM.YYYY"
              className={`w-full border rounded-xl p-2 ${
                dateError ? "border-red-500" : ""
              }`}
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
                  disabled={disabledFn}
                  weekStartsOn={1}
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
            className="bg-yellow-400 w-full px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 transition"
          >
            {loading ? "Odesílám..." : "Odeslat předobjednávku"}
          </button>
        </form>
      )}
    </div>
  );
}
