import Layout from "../components/Layout";
import { useState, useEffect } from "react";

export default function Objednavka() {
  const [eggs, setEggs] = useState(0);
  const [amount, setAmount] = useState(1);

  useEffect(() => {
    fetch("/api/inventory")
      .then(res => res.json())
      .then(data => setEggs(data.eggs));
  }, []);

  const orderEggs = async () => {
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseInt(amount) })
    });
    const data = await res.json();
    setEggs(data.eggs);
    alert(`Objednávka přijata. Aktuální stav: ${data.eggs} vajec`);
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">Objednávka vajec</h1>
      <p className="text-gray-700 mb-6">
        Aktuálně k dispozici: <strong>{eggs}</strong> vajec
      </p>

      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Počet vajec:</label>
        <input
          type="number"
          min="1"
          max={eggs}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border rounded px-3 py-2 w-24"
        />
      </div>

      <button
        onClick={orderEggs}
        className="bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-yellow-500 hover:scale-105 transform transition duration-300"
      >
        Objednat
      </button>

      <p className="mt-6 text-gray-700">
        Nebo použijte tradiční formulář:{" "}
        <a
          href="https://forms.office.com/Pages/ResponsePage.aspx?id=4CjHEwy790yOEFsycnnW2SR3troeGgtNqAxWTGDgi7RUREtDQ0dHUUNFMUlMRzZQWENHWUswUFlYUi4u"
          target="_blank"
          rel="noopener noreferrer"
          className="text-yellow-700 underline"
        >
          otevřít objednávkový formulář
        </a>
      </p>
    </Layout>
  );
}
