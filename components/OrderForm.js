import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

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

  const totalPrice =
    (parseInt(formData.standardQuantity || 0, 10) * 5) +
    (parseInt(formData.lowCholQuantity || 0, 10) * 7);

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  // Formát datumu český DD.MM.YYYY
  const formatDate = (date) => format(date, "dd.MM.yyyy", { locale: cs });

  const getDateOffset = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  };

  const isWeekend = (date) => [0, 6].includes(date.getDay());
  const isToday = (date) =>
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const isValidDematicDate = (date) => !isWeekend(date) && !isToday(date);

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
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(0, parseInt(prev[field] || 0, 10) + amount),
    }));
  };

  const handlePickupLocation = (location) => {
    setFormData((prev) => ({
      ...prev,
      pickupLocation: location,
      pickupDate: "", // resetovat datum při změně místa
    }));
    setDateError("");
  };

  const handleDateSelect = (date) => {
    // validace podle místa vyzvednutí
    if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
      if (!isValidDematicDate(date)) {
        setDateError("❌ Nelze vybrat dnešní den nebo víkend pro Dematic.");
        return;
      }
    } else if (formData.pickupLocation === "Honezovice") {
      if (isToday(date)) {
        setDateError("❌ Nelze vybrat dnešní den.");
        return;
      }
    }
    setFormData((prev) => ({ ...prev, pickupDate: date }));
    setDateError("");
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

    const pickupDateObj = new Date(formData.pickupDate);
    if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65" && !isValidDematicDate(pickupDateObj)) {
      toast.error("❌ Nelze odeslat objednávku s dnešním dnem nebo víkendem pro Dematic.");
      return;
    }
    if (formData.pickupLocation === "Honezovice" && isToday(pickupDateObj)) {
      toast.error("❌ Nelze odeslat objednávku s dnešním dnem.");
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

  // Generování dní pro mini-kalendář (zítra a pozítří)
  const dateOptions = [getDateOffset(1), getDateOffset(2)];

  return (
    <div>
      {/* Dostupné množství */}
      <div className="mb-4 text-lg text-gray-700">
        <h2 className="font-bold mb-1 text-red-600">Aktuální dostupné množství</h2>
        <p>🥚 Standardní vejce: <strong>{stock.standardQuantity}</strong> ks (5 Kč/ks)</p>
        <p>🥚 Vejce se sníženým cholesterolem: <strong>{stock.lowCholQuantity}</strong> ks (7 Kč/ks)</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-6 space-y-4 max-w-lg">

        {/* Jméno */}
        <div>
          <label className="block text-gray-700 mb-1">Jméno a příjmení *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border rounded-xl p-2"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-700 mb-1">Email (nepovinné)</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-xl p-2"
          />
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-gray-700 mb-1">Telefon (nepovinné)</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
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
              onChange={handleChange}
              min="0"
              className="w-full border rounded-xl p-2"
            />
            <button type="button" onClick={() => handleAdd("standardQuantity", 5)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+5</button>
            <button type="button" onClick={() => handleAdd("standardQuantity", 10)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+10</button>
          </div>
        </div>

        {/* Low cholesterol */}
        <div>
          <label className="block text-gray-700 mb-1">Počet vajec se sníženým cholesterolem</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="lowCholQuantity"
              value={formData.lowCholQuantity}
              onChange={handleChange}
              min="0"
              className="w-full border rounded-xl p-2"
            />
            <button type="button" onClick={() => handleAdd("lowCholQuantity", 5)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+5</button>
            <button type="button" onClick={() => handleAdd("lowCholQuantity", 10)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+10</button>
          </div>
        </div>

        {/* Celková cena */}
        <div className="text-gray-800 font-semibold">
          Celková cena: <span className="text-green-700">{totalPrice} Kč</span>
        </div>

        {/* Místo vyzvednutí */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handlePickupLocation("Dematic Ostrov u Stříbra 65")}
            className={`flex-1 py-2 rounded-lg font-semibold ${formData.pickupLocation === "Dematic Ostrov u Stříbra 65" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Dematic Ostrov u Stříbra 65
          </button>
          <button
            type="button"
            onClick={() => handlePickupLocation("Honezovice")}
            className={`flex-1 py-2 rounded-lg font-semibold ${formData.pickupLocation === "Honezovice" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Honezovice
          </button>
        </div>

        {/* Datum vyzvednutí */}
        <div>
          <label className="block text-gray-700 mb-1 mt-2">Datum vyzvednutí *</label>
          <div className="flex gap-2 items-center">
            {dateOptions.map((d, idx) => {
              let disabled = false;
              if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") disabled = !isValidDematicDate(d);
              if (formData.pickupLocation === "Honezovice") disabled = isToday(d);
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleDateSelect(d)}
                  disabled={disabled}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    disabled ? "bg-gray-300 text-gray-500 cursor-not-allowed" :
                    formData.pickupDate === d ? "bg-green-500 text-white" : "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                  }`}
                >
                  {formatDate(d)}
                </button>
              );
            })}
          </div>
          {dateError && <p className="text-red-600 text-sm mt-1">{dateError}</p>}
        </div>

        <button type="submit" disabled={loading} className="bg-yellow-400 px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 transform transition">
          {loading ? "Odesílám..." : "Odeslat objednávku"}
        </button>
      </form>
    </div>
  );
}
