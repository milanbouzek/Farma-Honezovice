// pages/index.js nebo components/OrderForm.js

import { useState } from "react";

export default function OrderForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    eggsCount: 0,
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form
      action="https://formspree.io/f/xjkoqoao"
      method="POST"
      className="max-w-lg mx-auto p-4 bg-white shadow-md rounded"
    >
      <h2 className="text-2xl font-bold mb-4">Objednávka vajec</h2>

      <label className="block mb-2">
        Jméno:
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded mt-1"
        />
      </label>

      <label className="block mb-2">
        E-mail:
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded mt-1"
        />
      </label>

      <label className="block mb-2">
        Adresa:
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded mt-1"
        />
      </label>

      <label className="block mb-2">
        Telefon:
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full border p-2 rounded mt-1"
        />
      </label>

      <label className="block mb-2">
        Počet vajec:
        <input
          type="number"
          name="eggsCount"
          value={formData.eggsCount}
          onChange={handleChange}
          min="1"
          required
          className="w-full border p-2 rounded mt-1"
        />
      </label>

      <label className="block mb-4">
        Poznámka:
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="w-full border p-2 rounded mt-1"
        />
      </label>

      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Odeslat objednávku
      </button>
    </form>
  );
}
