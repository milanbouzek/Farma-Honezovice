import { useState, useEffect } from "react";

export default function OrderForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    pickupLocation: "",
    standardQuantity: "",
    lowCholQuantity: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [stock, setStock] = useState({ standardQuantity: 0, lowCholQuantity: 0 });

  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json();
        setStock({
          standardQuantity: data.standardQuantity || 0,
          lowCholQuantity: data.lowCholQuantity || 0,
        });
      } catch (err) {
        setStock({ standardQuantity: 0, lowCholQuantity: 0 });
      }
    }
    fetchStock();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalQuantity =
      parseInt(formData.standardQuantity || 0) +
      parseInt(formData.lowCholQuantity || 0);

    if (totalQuantity < 10 || totalQuantity % 10 !== 0) {
      setMessage("Minimální objednávka je 10 ks a vždy po násobcích 10.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Objednávka byla úspěšně odeslána!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          pickupLocation: "",
          standardQuantity: "",
          lowCholQuantity: "",
        });
      } else {
        setMessage(data.error || "Došlo k chybě při odesílání objednávky.");
      }
    } catch (err) {
      setMessage("Chyba připojení k serveru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-6 space-y-4"
    >
      <h2 className="text-2xl font-bold text-green-700 mb-4">
        Objednávkový formulář
      </h2>

      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Aktuálně dostupné množství
      </h3>
      <div className="mb-4 text-gray-700">
        <p>🥚 Standardní vejce: <strong>{stock.standardQuantity}</strong> ks (5 Kč/ks)</p>
        <p>🥚 Vejce se sníženým cholesterolem: <strong>{stock.lowCholQuantity}</strong> ks (7 Kč/ks)</p>
      </div>

      <p className="text-gray-700 mb-6">
        <strong>Minimální objednávka:</strong> 10 ks a vždy po násobcích 10 (součet obou typů vajec).
      </p>

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
        <label className="block text-gray-700 mb-1">Telefon *</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
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
          <option value="">Vyberte místo</option>
          <option value="Honezovice">Honezovice</option>
          <option value="Stod">Stod</option>
          <option value="Dobřany">Dobřany</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700 mb-1">
          Počet standardních vajec (5 Kč/ks)
        </label>
        <input
          type="number"
          name="standardQuantity"
          value={formData.standardQuantity}
          onChange={handleChange}
          min="0"
          step="10"
          className="w-full border rounded-xl p-2"
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-1">
          Počet vajec se sníženým cholesterolem (7 Kč/ks)
        </label>
        <input
          type="number"
          name="lowCholQuantity"
          value={formData.lowCholQuantity}
          onChange={handleChange}
          min="0"
          step="10"
          className="w-full border rounded-xl p-2"
        />
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">
        Uzávěrka objednávek
      </h3>
      <p className="text-gray-700 mb-6">
        Objednávky je nutné zadat do <strong>19:00</strong>, pokud je vyzvednutí následující den.  
        Objednávky vystavené po <strong>19:00</strong> nebudou bohužel připraveny druhý den k vyzvednutí.
      </p>

      {message && <p className="text-red-500">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-yellow-400 px-6 py-3 rounded-xl font-semibold shadow hover:bg-yellow-500 transition"
      >
        {loading ? "Odesílání..." : "Odeslat objednávku"}
      </button>
    </form>
  );
}
