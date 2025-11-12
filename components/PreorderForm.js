import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { X } from "lucide-react";

/**
 * PreorderForm.js
 * Formulář pro předobjednávky vajec
 * Povinná pole: jméno, počet vajec (min 10, násobky 10), místo vyzvednutí
 * Nepovinná pole: email, telefon, poznámka
 */

export default function PreorderForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    standardQuantity: "",
    lowCholQuantity: "",
    pickupLocation: "",
    note: "",
  });

  const [currentTotal, setCurrentTotal] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (totalEggs < 10) {
      toast.error("❌ Minimální objednávka je 10 ks.");
      return;
    }
    if (totalEggs % 10 !== 0) {
      toast.error("❌ Počet vajec musí být násobek 10.");
      return;
    }
    if (totalEggs > 20) {
      toast.error("❌ Maximálně 20 ks na jednu předobjednávku.");
      return;
    }
    if (currentTotal + totalEggs > 100) {
      toast.error(
        `❌ Celkový limit 100 ks překročen. Aktuálně dostupných ${
          100 - currentTotal
        } ks.`
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
    standardQty: parseInt(formData.standardQuantity || 0, 10),
    lowcholQty: parseInt(formData.lowCholQuantity || 0, 10),
    note: formData.note,
  }),
});

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("✅ Předobjednávka byla úspěšně odeslána!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          standardQuantity: "",
          lowCholQuantity: "",
          pickupLocation: "",
          note: "",
        });
        fetchLimit();
      } else {
        toast.error(data.error || "❌ Došlo k chybě při odesílání.");
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
          className="bg-white bg-opacity-90 shadow-xl rounded-2xl p-6 space-y-4 backdrop-blur-sm"
        >
          <div>
            <label className="block text-gray-800 mb-1">Jméno a příjmení *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-green-400"
              placeholder="Zadejte celé jméno"
            />
          </div>

          <div>
            <label className="block text-gray-800 mb-1">Telefon</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-green-400"
              placeholder="+420…"
            />
          </div>

          <div>
            <label className="block text-gray-800 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-green-400"
              placeholder="např. jan@domena.cz"
            />
          </div>

          <div>
            <label className="block text-gray-800 mb-1">Počet standardních vajec *</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                name="standardQuantity"
                value={formData.standardQuantity}
                onChange={handleChange}
                min="0"
                className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-green-400"
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

          <div>
            <label className="block text-gray-800 mb-1">Počet vajec se sníženým cholesterolem *</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                name="lowCholQuantity"
                value={formData.lowCholQuantity}
                onChange={handleChange}
                min="0"
                className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-green-400"
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

          <div>
            <label className="block text-gray-800 mb-1">Místo vyzvednutí *</label>
            <select
              name="pickupLocation"
              value={formData.pickupLocation}
              onChange={handleChange}
              className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-green-400"
            >
              <option value="">Vyberte místo</option>
              <option value="Dematic Ostrov u Stříbra 65">Dematic Ostrov u Stříbra 65</option>
              <option value="Honezovice">Honezovice</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-800 mb-1">Poznámka</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="w-full border rounded-xl p-2 h-20 focus:ring-2 focus:ring-green-400"
              placeholder="Např. preferovaný termín odběru..."
            ></textarea>
          </div>

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
