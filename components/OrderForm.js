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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalQuantity = Number(formData.standardQuantity) + Number(formData.lowCholQuantity);
    if (!formData.name || !formData.email || !formData.pickupLocation || !formData.pickupDate || totalQuantity < 10 || totalQuantity % 10 !== 0) {
      alert("Vyplňte všechna povinná pole a zadejte minimálně 10 vajec po násobcích 10 ks.");
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
          standardQuantity: data.remainingStandard,
          lowCholQuantity: data.remainingLowChol,
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
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Aktuálně dostupné množství</h2>
      <div className="mb-4 text-gray-700">
        <p>🥚 Standardní vejce: <strong>{stock.standardQuantity}</strong> ks (5 Kč/ks)</p>
        <p>🥚 Vejce se sníženým cholesterolem: <strong>{stock.lowCholQuantity}</strong> ks (7 Kč/ks)</p>
      </div>

      <div className="mb-6 text-gray-700">
        <p>
          <strong>Minimální objednávka:</strong> 10 vajec a vždy po násobcích 10 ks.
        </p>
        <p className="mt-1">
          Objednávky je nutné zadat do 19:00, pokud je vyzvednutí následující den. 
          Objednávky vystavené po 19:00 nebudou bohužel připraveny druhý den k vyzvednutí.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-gray-700 mb-1">Jméno *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border rounded-xl p-2" />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Email *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border rounded-xl p-2" />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Telefon (nepovinné)</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-xl p-2" />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Počet standardních vajec *</label>
          <input type="number" name="standardQuantity" value={formData.standardQuantity} onChange={handleChange} min="0" className="w-full border rounded-xl p-2" />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Počet vajec se sníženým cholesterolem *</label>
          <input type="number" name="lowCholQuantity" value={formData.lowCholQuantity} onChange={handleChange} min="0" className="w-full border rounded-xl p-2" />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Místo vyzvednutí *</label>
          <select name="pickupLocation" value={formData.pickupLocation} onChange={handleChange} required className="w-full border rounded-xl p-2">
            <option value="">-- Vyberte místo --</option>
            <option value="Dematic Ostrov u Stříbra 65">Dematic Ostrov u Stříbra 65</option>
            <option value="Honezovice">Honezovice</option>
          </select>
        </div
