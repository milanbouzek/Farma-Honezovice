import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function OrderForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    standardQuantity: 0,
    lowCholQuantity: 0,
    pickupLocation: "",
    pickupDate: "",
  });

  const [stock, setStock] = useState({ standardQuantity: 0, lowCholQuantity: 0 });
  const [loading, setLoading] = useState(false);

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
          ? parseInt(value || 0, 10)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalEggs = formData.standardQuantity + formData.lowCholQuantity;

    if (totalEggs < 10 || totalEggs % 10 !== 0) {
      toast.error(
        "❌ Minimální objednávka je 10 ks a vždy jen násobky 10 (součet standardních a low cholesterol vajec)."
      );
      return;
    }

    if (!formData.name || !formData.pickupLocation || !formData.pickupDate) {
      toast.error("❌ Vyplňte všechna povinná pole.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(
          `✅ Objednávka byla úspěšně odeslána. Celková cena je ${data.totalPrice} Kč.`
        );
        setStock({
          standardQuantity: data.remaining.standard,
          lowCholQuantity: data.remaining.lowChol,
        });
        setFormData({
          name: "",
          email: "",
          phone: "",
          standardQuantity: 0,
          lowCholQuantity: 0,
          pickupLocation: "",
          pickupDate: "",
        });
      } else {
        toast.error("❌ " + (data.error || "Nepodařilo se odeslat objednávku."));
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
          🥚 Standardní vejce:{" "}
          <strong>{stock.standardQuantity}</strong> ks (5 Kč/ks)
        </p>
        <p>
          🥚 Vejce se sníženým cholesterolem:{" "}
          <strong>{stock.lowCholQuantity}</strong> ks (7 Kč/ks)
        </p>
      </div>

      {/* Minimální objednávka */}
      <div className="mb-4 text-gray-700">
        <h2 className="font-bold">Minimální objednávka</h2>
        <p>
          10 ks, vždy pouze v násobcích 10 (součet standardních a low cholesterol
          vajec).
        </p>
      </div>

      {/* Uzávěrka objednávek */}
      <div className="mb-4 text-gray-700">
        <h2 className="font-bold">Uzávěrka objednávek</h2>
        <p>
          Objednávky je nutné zadat do <strong>19:00</strong>, pokud je vyzvednutí
          následující den. Objednávky vystavené po 19:00 nebudou bohužel připraveny
          druhý den k vyzvednutí.
        </p>
      </div>

      {/* Platba */}
      <div className="mb-6 text-gray-700">
        <h2 className="font-bold">Platba</h2>
        <p>
          Platba proběhne při dodání vajec - buď bezhotovostně (QR kód) nebo v
          hotovosti.
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

        <div>
          <label className="block text-gray-700 mb-1">
            Počet standardních vajec
          </label>
          <input
            type="number"
            name="standardQuantity"
            value={formData.standardQuantity}
            onChange={handleChange}
            min="0"
            className="w-full border rounded-xl p-2"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">
            Počet vajec se sníženým cholesterolem
          </label>
          <input
            type="number"
            name="lowCholQuantity"
            value={formData.lowCholQuantity}
            onChange={handleChange}
            min="0"
            className="w-full border rounded-xl p-2"
          />
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
            <option value="Dematic Ostrov u Stříbra 65">
              Dematic Ostrov u Stříbra 65
            </option>
            <option value="Honezovice">Honezovice</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Datum vyzvednutí *</label>
          <input
            type="date"
            name="pickupDate"
            value={formData.pickupDate}
            onChange={handleChange}
            required
            className="w-full border rounded-xl p-2"
          />
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
