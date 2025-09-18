import { useState, useEffect } from "react";
import toast from "react-hot-toast";

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

  // výpočet ceny
  const totalPrice =
    (parseInt(formData.standardQuantity || 0, 10) * 5) +
    (parseInt(formData.lowCholQuantity || 0, 10) * 7);

  // spočítá datum podle offsetu (1 = zítra, 2 = pozítří)
  const getDateOffset = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  // zítřejší datum jako minimum pro input
  const tomorrow = getDateOffset(1);

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

  const validateDate = (dateValue, location) => {
    if (!dateValue) return "";

    const selectedDate = new Date(dateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // kontrola: dnešní nebo starší datum
    if (selectedDate <= today) {
      return "❌ Datum musí být nejdříve zítřek.";
    }

    // kontrola: víkend pro Dematic
    if (location === "Dematic Ostrov u Stříbra 65") {
      const day = selectedDate.getDay(); // 0 = neděle, 6 = sobota
      if (day === 0 || day === 6) {
        return "❌ Pro vyzvednutí v Dematic nelze zvolit víkend.";
      }
    }

    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // pokud jde o datum, validujeme hned
    if (name === "pickupDate") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setDateError(validateDate(value, formData.pickupLocation));
      return;
    }

    // pokud jde o místo, přepočítáme validaci pro datum
    if (name === "pickupLocation") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (formData.pickupDate) {
        setDateError(validateDate(formData.pickupDate, value));
      }
      return;
    }

    // standardní změny
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

  const handleDateQuickPick = (offset) => {
    const newDate = getDateOffset(offset);
    setFormData((prev) => ({
      ...prev,
      pickupDate: newDate,
    }));
    setDateError(validateDate(newDate, formData.pickupLocation));
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

    // kontrola povinných polí
    if (!formData.name || !formData.pickupLocation || !formData.pickupDate) {
      toast.error("❌ Vyplňte všechna povinná pole.");
      return;
    }

    // kontrola datumu
    const validationMsg = validateDate(formData.pickupDate, formData.pickupLocation);
    if (validationMsg) {
      setDateError(validationMsg);
      toast.error("❌ " + validationMsg);
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
        <p>
          🥚 Standardní vejce: <strong>{stock.standardQuantity}</strong> ks (5 Kč/ks)
        </p>
        <p>
          🥚 Vejce se sníženým cholesterolem:{" "}
          <strong>{stock.lowCholQuantity}</strong> ks (7 Kč/ks)
        </p>
      </div>

      {/* Formulář */}
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
            onChange={handleChange}
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
            onChange={handleChange}
            className="w-full border rounded-xl p-2"
          />
        </div>

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
              onChange={handleChange}
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

        <div>
          <label className="block text-gray-700 mb-1">Místo vyzvednutí *</label>
          <select
            name="pickupLocation"
            value={formData.pickupLocation}
            onChange={handleChange}
            required
            className="w-full border rounded-xl p-2"
          >
            <option value="">-- Vyberte místo --</option>
            <option value="Dematic Ostrov u Stříbra 65">Dematic Ostrov u Stříbra 65</option>
            <option value="Honezovice">Honezovice</option>
          </select>
        </div>

        {/* Datum vyzvednutí */}
        <div>
          <label className="block text-gray-700 mb-1">Datum vyzvednutí *</label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              name="pickupDate"
              value={formData.pickupDate}
              onChange={handleChange}
              min={tomorrow}
              required
              className="w-full border rounded-xl p-2"
            />
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
          {dateError && <p className="text-red-600 text-sm mt-1">{dateError}</p>}
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
