import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Link from "next/link";

export default function Home() {
  const [eggs, setEggs] = useState({ standardQuantity: 0, lowCholQuantity: 0 });

  useEffect(() => {
    async function fetchEggs() {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json();
        setEggs({
          standardQuantity: data.standardQuantity || 0,
          lowCholQuantity: data.lowCholQuantity || 0,
        });
      } catch {
        setEggs({ standardQuantity: 0, lowCholQuantity: 0 });
      }
    }
    fetchEggs();
  }, []);

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">
        Vejce z malochovu
      </h1>

      <p className="text-gray-700 leading-relaxed mb-4">
        Vítejte na stránkách naší malé rodinné farmy v Honezovicích. Nabízíme čerstvá
        vajíčka od slepic chovaných v přirozených podmínkách.
      </p>

      <p className="text-gray-700 leading-relaxed mb-6">
        Vejce jsou určena k <strong>prodeji přímo konečnému spotřebiteli</strong>.
        Maximálně lze prodat <strong>60 vajec jednomu spotřebiteli za týden</strong>.
      </p>

      <p className="mb-2 text-lg text-gray-700">
        🥚 Aktuálně k dispozici: <strong>{eggs.standardQuantity}</strong> standardních
      </p>
      <p className="mb-2 text-lg text-gray-700">
        🥚 Nízký cholesterol: <strong>{eggs.lowCholQuantity}</strong>
      </p>

      <p className="mb-2 text-gray-700">
        🥚 Cena standardních vajec: <strong>5 Kč/ks</strong>
      </p>
      <p className="mb-6 text-gray-700">
        🥚 Cena vajec se sníženým cholesterolem: <strong>7 Kč/ks</strong>
      </p>

      <Link href="/objednavka">
        <button className="bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-yellow-500 hover:scale-105 transform transition duration-300">
          Přejít k objednávce
        </button>
      </Link>
    </Layout>
  );
}
