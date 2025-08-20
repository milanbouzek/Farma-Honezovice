import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    jmeno: "",
    prijmeni: "",
    telefon: "",
    email: "milan.bouzek@icloud.com", // předvyplněný e-mail
    pocetVajec: 0,
    dalsiPoznamky: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Objednávka vajec</h1>
      <form
        action="https://formspree.io/f/xjkoqoao"
        method="POST"
        className="flex flex-col gap-4"
      >
        <input
          type="text"
          name="jmeno"
          placeholder="Jméno"
          value={formData.jmeno}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="prijmeni"
          placeholder="Příjmení"
          value={formData.prijmeni}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="tel"
          name="telefon"
          placeholder="Telefon"
          value={formData.telefon}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="E-mail"
          value={formData.email}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="number"
          name="pocetVajec"
          placeholder="Počet vajec"
          value={formData.pocetVajec}
          onChange={handleChange}
          min="0"
          required
          className="border p-2 rounded"
        />
        <textarea
          name="dalsiPoznamky"
          placeholder="Další poznámky"
          value={formData.dalsiPoznamky}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Odeslat objednávku
        </button>
      </form>
    </div>
  );
}
