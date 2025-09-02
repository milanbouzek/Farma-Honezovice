import { useState } from "react";

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

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Odesílám...");

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setStatus("Objednávka byla úspěšně odeslána.");
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
    } catch (err) {
      setStatus("Chyba při odesílání objednávky.");
    } finally {
      setLoading(false);
    }
  };

  return (
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

      {status && <p className="mt-4 text-gray-700">{status}</p>}
    </form>
  );
}
