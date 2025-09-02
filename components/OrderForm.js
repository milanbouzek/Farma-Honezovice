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
        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border rounded-xl p-2" />
      </div>

      <div>
        <label className="block text-gray-700 mb-1">Email *</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border rounded-xl p-2" />
     
