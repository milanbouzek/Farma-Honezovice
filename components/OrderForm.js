import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import { format, isSameDay, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import "react-day-picker/dist/style.css";

export default function OrderForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    standardQuantity: "",
    lowCholQuantity: "",
    pickupLocation: "",
    pickupDate: "",
  });

  const [stock, setStock] = useState({ standardQuantity: 0, lowCholQuantity: 0 });
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const today = new Date();

  const totalPrice =
    (parseInt(formData.standardQuantity || 0, 10) * 5) +
    (parseInt(formData.lowCholQuantity || 0, 10) * 7);

  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json();
        setStock({
          standardQuantity: data.standardQuantity || 0,
          lowCholQuantity: data.lowCholQuantity || 0,
        });
      } catch {
        setStock({ standardQuantity: 0, lowCholQuantity: 0 });
      }
    }
    fetchStock();
  }, []);

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isToday = (date) => isSameDay(date, today);

  const isValidDate = (date) => {
    if (!date) return false;
    if (isToday(date)) return false;
    if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65" && isWeekend(date)) return false;
    return true;
  };

  const handleDaySelect = (date) => {
    if (!date) return;

    if (!isValidDate(date)) {
      if (isToday(date)) {
        setDateError(
          formData.pickupLocation === "Dematic Ostrov u Stříbra 65"
            ? "❌ Nelze vybrat dnešní den ani víkend pro Dematic."
            : "❌ Nelze vybrat dnešní den."
        );
      } else if (isWeekend(date) && formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
        setDateError("❌ Nelze vybrat víkend pro Dematic.");
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      pickupDate: format(date, "dd.MM.yyyy", { locale: cs }),
    }));
    setDateError("");
    setShowCalendar(false);
  };

  const handleAdd = (field, amount) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(0, parseInt(prev[field] || 0, 10) + amount),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const standardQty = parseInt(formData.standardQuantity || 0, 10);
    const lowCholQty = parseInt(formData.lowCholQuantity || 0, 10);
    const totalEggs = standardQty + lowCholQty;

    if (totalEggs < 10 || totalEggs % 10 !== 0) {
      toast.error("❌ Minimální objednávka je 10 ks a vždy jen násobky 10.");
      return;
    }

    if (!formData.name || !formData.pickupLocation || !formData.pickupDate) {
      toast.error("❌ Vyplňte všechna povinná pole.");
      return;
    }

    const parsedDate = parseISO(formData.pickupDate.split(".").reverse().join("-"));
    if (!isValidDate(parsedDate)) {
      toast.error("❌ Zvolené datum není platné.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          standardQuantity: standardQty,
          lowCholQuantity: lowCholQty,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`✅ Objednávka byla úspěšně odeslána. Číslo: ${data.orderId}`);
        setStock({
          standardQuantity: data.remaining_standard,
          lowCholQuantity: data.remaining_low_chol,
        });
        setFormData({
          name: "",
          email: "",
          phone: "",
          standardQuantity: "",
          lowCholQuantity: "",
          pickupLocation: "",
          pickupDate: "",
        });
        setDateError("");
      } else {
        toast.error("❌ Chyba: " + (data.error || "Nepodařilo se odeslat objednávku."));
      }
    } catch {
      toast.error("❌ Chyba při odesílání objednávky.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Aktuální dostupné množství */}
      <div className="mb-4 text-lg text-gray-700">
        <h2 className="font-bold mb-1 text-red-600">Aktuální dostupné množství</h2>
        <p>🥚 Standardní vejce: <strong>{stock.standardQuantity}</strong> ks (5 Kč/ks)</p>
        <p>🥚 Vejce se sníženým cholesterolem: <strong>{stock.lowCholQuantity}</strong> ks (7 Kč/ks)</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 space-y-4 max-w-lg"
      >
        <div>
          <label className="block text-gray-700 mb-1">Jméno a příjmení *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full border rounded-xl p-2"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Email (nepovinné)</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full border rounded-xl p-2"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Telefon (nepovinné)</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full border rounded-xl p-2"
          />
        </div>

        {/* Standardní vejce */}
        <div>
          <label className="block text-gray-700 mb-1">Počet standardních vajec</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="standardQuantity"
              value={formData.standardQuantity}
              onChange={(e) => setFormData({ ...formData, standardQuantity: e.target.value })}
              min="0"
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

        {/* Low cholesterol vejce */}
        <div>
          <label className="block text-gray-700 mb-1">Počet vajec se sníženým cholesterolem</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="lowCholQuantity"
              value={formData.lowCholQuantity}
              onChange={(e) => setFormData({ ...formData, lowCholQuantity: e.target.value })}
              min="0"
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

        {/* Celková cena */}
        <div className="text-gray-800 font-semibold">
          Celková cena: <span className="text-green-700">{totalPrice} Kč</span>
        </div>

        {/* Místo vyzvednutí */}
        <div>
          <label className="block text-gray-700 mb-1">Místo vyzvednutí *</label>
          <div className="flex gap-4">
            {["Dematic Ostrov u Stříbra 65", "Honezovice"].map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setFormData({ ...formData, pickupLocation: loc })}
                className={`px-4 py-2 rounded-xl border ${
                  formData.pickupLocation === loc
                    ? "bg-yellow-500 text-white font-bold border-yellow-600"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Datum vyzvednutí */}
        <div>
          <label className="block text-gray-700 mb-1">Datum vyzvednutí *</label>
          <input
            type="text"
            readOnly
            value={formData.pickupDate}
            onClick={() => setShowCalendar(!showCalendar)}
            placeholder="Vyberte datum"
            className={`w-full border rounded-xl p-2 cursor-pointer ${dateError ? "border-red-500" : ""}`}
          />
          {dateError && <p className="text-red-600 text-sm mt-1">{dateError}</p>}

          {showCalendar && (
            <div className="mt-2">
              <DayPicker
                mode="single"
                selected={formData.pickupDate ? parseISO(formData.pickupDate.split(".").reverse().join("-")) : undefined}
                onSelect={handleDaySelect}
                locale={cs}
                weekStartsOn={1}
                modifiers={{
                  disabled: [
                    today,
                    formData.pickupLocation === "Dematic Ostrov u Stříbra 65"
                      ? { daysOfWeek: [0, 6] }
                      : null,
                  ].filter(Boolean),
                }}
                modifiersStyles={{
                  disabled: { color: "#d1d5db", backgroundColor: "#f3f4f6" },
                  selected: { backgroundColor: "#facc15", color: "black" },
                }}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-400 px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 transform transition"
        >
          {loading ? "Odesílám..." : "Odeslat objednávku"}
        </button>
      </form>
    </div>
  );
}
