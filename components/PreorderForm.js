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
    pickupDate: "",
    note: "",
  });

  const [currentTotal, setCurrentTotal] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  // ======== DATUMOVÁ LOGIKA STEJNÁ JAKO U OBJEDNÁVEK ========

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDateOffset = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const formatDateCZ = (date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const parseDateFromCZ = (cz) => {
    if (!cz) return null;
    const [dd, mm, yyyy] = cz.split(".");
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  const isValidDate = (date, location = formData.pickupLocation) => {
    const d = date instanceof Date ? date : parseDateFromCZ(date);
    if (!d) return false;

    const test = new Date(d);
    const testDay = new Date(test.getFullYear(), test.getMonth(), test.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // ❌ dnešek a minulost
    if (testDay <= todayDay) return false;

    // ❌ víkendy pro Dematic
    if (location === "Dematic Ostrov u Stříbra 65") {
      if (testDay.getDay() === 0 || testDay.getDay() === 6) return false;
    }

    // ❌ max 30 dní dopředu
    const max = new Date();
    max.setDate(max.getDate() + 30);
    const maxDay = new Date(max.getFullYear(), max.getMonth(), max.getDate());

    if (testDay > maxDay) return false;

    return true;
  };

  const disabledFn = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (d <= today) return true;
    if (
      formData.pickupLocation === "Dematic Ostrov u Stříbra 65" &&
      (d.getDay() === 0 || d.getDay() === 6)
    ) {
      return true;
    }
    return false;
  };

  // ====== LIMITY ======
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

  // ===== HANDLERY =====

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

    if (formData.pickupDate) {
      const parsed = parseDateFromCZ(formData.pickupDate);
      if (!isValidDate(parsed, loc)) {
        setFormData((prev) => ({ ...prev, pickupDate: "" }));
        setDateError(
          loc === "Dematic Ostrov u Stříbra 65"
            ? "❌ Nelze vybrat dnešek ani víkend pro Dematic."
            : "❌ Nelze vybrat dnešní den."
        );
      } else {
        setDateError("");
      }
    }
  };

  const handleDateSelect = (date) => {
    if (!date) return;

    if (!isValidDate(date)) {
      setDateError(
        formData.pickupLocation === "Dematic Ostrov u Stříbra 65"
          ? "❌ Nelze vybrat dnešek ani víkend pro Dematic."
          : "❌ Nelze vybrat dnešní den."
      );
      return;
    }

    setFormData((prev) => ({ ...prev, pickupDate: formatDateCZ(date) }));
    setDateError("");
    setShowCalendar(false);
  };

  const handleDateQuickPick = (offset) => {
    const d = getDateOffset(offset);
    if (!isValidDate(d)) {
      setDateError(
        formData.pickupLocation === "Dematic Ostrov u Stříbra 65"
          ? "❌ Nelze vybrat dnešek ani víkend pro Dematic."
          : "❌ Nelze vybrat dnešní den."
      );
    } else {
      setFormData((prev) => ({ ...prev, pickupDate: formatDateCZ(d) }));
      setDateError("");
    }
    setShowCalendar(false);
  };

  // ===== SUBMIT =====

  const handleSubmit = async (e) => {
    e.preventDefault();

    const standard = parseInt(formData.standardQuantity || 0, 10);
    const lowchol = parseInt(formData.lowCholQuantity || 0, 10);
    const totalEggs = standard + lowchol;

    // VALIDACE
    if (!formData.name.trim()) return toast.error("❌ Zadejte jméno.");
    if (!formData.pickupLocation) return toast.error("❌ Vyberte místo odběru.");
    if (!formData.pickupDate) return toast.error("❌ Vyberte datum odběru.");

    const parsed = parseDateFromCZ(formData.pickupDate);
    if (!isValidDate(parsed)) return toast.error("❌ Neplatné datum odběru.");

    if (totalEggs < 10) return toast.error("❌ Minimální objednávka je 10 ks.");
    if (totalEggs % 10 !== 0) return toast.error("❌ Počet musí být násobek 10.");
    if (totalEggs > 20) return toast.error("❌ Maximálně 20 ks.");
    if (currentTotal + totalEggs > 100)
      return toast.error(`❌ K dispozici je pouze ${100 - currentTotal} ks.`);

    // SEND
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
        fetchLimit();
      } else {
        toast.error(data.error || "❌ Chyba při odeslání.");
      }
    } catch {
      toast.error("❌ Chyba připojení k serveru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <Toaster position="top-center" />

      {limitReached ? (
        <p className="text-red-600 font-semibold text-center">
          Limit 100 ks byl dosažen — předobjednávky uzavřeny.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-6 space-y-4">

          {/* Jméno */}
          <div>
            <label className="block mb-1">Jméno a příjmení *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-xl p-2"
            />
          </div>

          {/* Telefon */}
          <div>
            <label className="block mb-1">Telefon</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded-xl p-2"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1">Email</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded-xl p-2"
            />
          </div>

          {/* Standardní vejce */}
          <div>
            <label className="block mb-1">Standardní vejce *</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                name="standardQuantity"
                value={formData.standardQuantity}
                onChange={handleChange}
                className="w-full border rounded-xl p-2"
              />
              <button type="button" onClick={() => handleAdd("standardQuantity", 5)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+5</button>
              <button type="button" onClick={() => handleAdd("standardQuantity", 10)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+10</button>
            </div>
          </div>

          {/* LowChol vejce */}
          <div>
            <label className="block mb-1">LowChol vejce *</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                name="lowCholQuantity"
                value={formData.lowCholQuantity}
                onChange={handleChange}
                className="w-full border rounded-xl p-2"
              />
              <button type="button" onClick={() => handleAdd("lowCholQuantity", 5)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+5</button>
              <button type="button" onClick={() => handleAdd("lowCholQuantity", 10)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+10</button>
            </div>
          </div>

          {/* Místo odběru */}
          <div>
            <label className="block mb-1">Místo vyzvednutí *</label>
            <div className="flex gap-2 flex-wrap">
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

          {/* Datum */}
          <div>
            <label className="block mb-1">Datum vyzvednutí *</label>
            <input
              readOnly
              value={formData.pickupDate}
              onClick={() => setShowCalendar(true)}
              className={`w-full border rounded-xl p-2 ${dateError ? "border-red-500" : ""}`}
              placeholder="DD.MM.YYYY"
            />

            {dateError && <p className="text-red-600 text-sm mt-1">{dateError}</p>}

            {showCalendar && (
              <div className="mt-2">
                <DayPicker
                  mode="single"
                  selected={parseDateFromCZ(formData.pickupDate)}
                  onSelect={handleDateSelect}
                  disabled={disabledFn}
                  weekStartsOn={1}
                />
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => handleDateQuickPick(1)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">Zítra</button>
              <button type="button" onClick={() => handleDateQuickPick(2)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">Pozítří</button>
            </div>
          </div>

          {/* Poznámka */}
          <div>
            <label className="block mb-1">Poznámka</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="w-full border rounded-xl p-2 h-20"
            />
          </div>

          {/* Submit */}
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
