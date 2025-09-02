import { useState, useEffect } from "react";

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
  const [status, setStatus] = useState(null);
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalQuantity =
      Number(formData.standardQuantity || 0) + Number(formData.lowCholQuantity || 0);

    if (!formData.name || !formData.email || !formData.pickupLocation || !formData.pickupDate) {
      alert("Vyplňte všechna povinná pole.");
      return;
    }

    if (totalQuantity < 10 || totalQuantity % 10 !== 0) {
      alert("Objednávka musí být minimálně 10 ks a vždy po násobcích 10.");
      return;
    }

    setLoading(true);
    setStatus("Odesílám objednávku...");

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("Objednávka byla úspěšně odeslána.");
        setStock({
          standardQuantity: data.remaining_standard,
          lowCholQuantity: data.remaining_low_chol,
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
        setStatus("Chyba: " + (data.error || "Nepodařilo se odeslat objednávku."));
      }
    } catch {
      setStatus("Chyba při odesílání objednávky.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Aktuální dostupné množství</h2>
      <p className="mb-2 text-lg text-gray-700">
        🥚 Standardní vejce: <strong>{stock.standardQuantity}</strong> ks (5 Kč/ks)
      </p>
      <p className="mb-4 text-lg text-gray-700">
        🥚 Vejce se sníženým cholesterolem: <strong>{stock.lowCholQuantity}</strong> ks (7 Kč/ks)
      </p>

      <h2 className="text-xl font-semibold mb-2">Uzávěrka objednávek</h2>
      <p className="mb-4 text-gray-700">
        Objednávky je nutné zadat do 19:00, pokud je vyzvednutí následující den. Objednávky
        vystavené po 19:00 nebudou bohužel připraveny druhý den k vyzvednutí.
      </p>

      <p className="mb-4 text-gray-700">
        Minimální objednávka je 10 ks a musí být vždy po násobcích 10 (součet standardních a vajec
        se sníženým cholesterolem).
      </p>

      <h2 className="text-xl font-semibold mb-2">Objednávka</h2>
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-gray-700 mb-1">Jméno *</label>
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
          <label className="block text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
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
          <label className="block text-gray-700 mb-1">Počet standardních vajec *</label>
          <input
            type="number"
            name="standardQuantity"
            value={formData.standardQuantity}
            onChange={handleChange}
            min="0"
            required
            className="w-full border rounded-xl p-2"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Počet vajec se sníženým cholesterolem *</label>
          <input
            type="number"
            name="lowCholQuantity"
            value={formData.lowCholQuantity}
            onChange={handleChange}
            min="0"
            required
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
            <option value="Dematic Ostrov u Stříbra 65">Dematic Ostrov u Stříbra 65</option>
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

      {status && <p className="mt-4 text-gray-700">{status}</p>}
    </div>
  );
}
