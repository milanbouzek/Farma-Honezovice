import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [stock, setStock] = useState({ standard_quantity: 0, low_cholesterol_quantity: 0 });

  useEffect(() => {
    async function fetchStock() {
      const res = await fetch("/api/stock");
      const data = await res.json();
      if (data.success) {
        setStock(data.stock);
      }
    }
    fetchStock();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Nabídka vajec</h1>
      <div className="bg-white shadow-lg rounded-2xl p-6 mb-6">
        <p className="text-lg text-gray-700 mb-2">
          <strong>Standardní vejce:</strong> {stock.standard_quantity} ks skladem
        </p>
        <p className="text-lg text-gray-700 mb-4">Cena: 5 Kč / ks</p>

        <p className="text-lg text-gray-700 mb-2">
          <strong>Vejce se sníženým cholesterolem:</strong> {stock.low_cholesterol_quantity} ks skladem
        </p>
        <p className="text-lg text-gray-700 mb-4">Cena: 6 Kč / ks</p>
      </div>

      <Link href="/order">
        <button className="bg-yellow-400 px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 transform transition">
          Přejít k objednávce
        </button>
      </Link>
    </div>
  );
}
