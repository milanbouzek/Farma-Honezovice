import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const [stock, setStock] = useState({ standardQuantity: 0, lowCholQuantity: 0 });
  const router = useRouter();

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

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">Vejce z malochovu</h1>
      
      <p className="text-gray-700 leading-relaxed mb-4">
        Vítejte na stránkách naší malé rodinné farmy v Honezovicích.
        Nabízíme čerstvá vejce od slepic chovaných v přirozených podmínkách.
      </p>

      <p className="text-gray-700 leading-relaxed mb-6">
        Vejce jsou určena k <strong>prodeji přímo konečnému spotřebiteli</strong>.
        Maximálně lze prodat <strong>60 vajec jednomu spotřebiteli za týden</strong>.
      </p>

      {/* Stav zásob */}
      <h2 className="font-bold text-lg mb-2">Aktuální dostupné množství</h2>
      <p className="mb-2 text-gray-700">
        🥚 Standardní vejce: <strong>{stock.standardQuantity}</strong> ks (5 Kč/ks)
      </p>
      <p className="mb-2 text-gray-700">
        🥚 Vejce se sníženým cholesterolem: <strong>{stock.lowCholQuantity}</strong> ks (7 Kč/ks)
      </p>

      {/* Minimální objednávka */}
      <p className="mb-4 text-gray-700">
        <strong>Minimální objednávka:</strong> 10 ks, vždy po násobcích 10.
      </p>

      <button
        onClick={() => router.push("/objednavka")}
        className="bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-yellow-500 hover:scale-105 transform transition duration-300"
      >
        Přejít k objednávce
      </button>
    </Layout>
  );
}
