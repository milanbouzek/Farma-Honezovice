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
        Nabízíme čerstvá vajíčka od slepic chovaných v přirozených podmínkách.
      </p>

      <p className="text-gray-700 leading-relaxed mb-6">
        Vejce jsou určena k <strong>prodeji přímo konečnému spotřebiteli</strong>.
        Maximálně lze prodat <strong>60 vajec jednomu spotřebiteli za týden</strong>.
      </p>

      {/* Aktuální dostupné množství */}
      <div className="mb-4 text-lg text-gray-700">
        <h2 className="font-bold mb-1">Aktuální dostupné množství</h2>
        <p>🥚 Standardní vejce: <strong>{stock.standardQuantity}</strong> ks (5 Kč/ks)</p>
        <p>🥚 Vejce se sníženým cholesterolem: <strong>{stock.lowCholQuantity}</strong> ks (7 Kč/ks)</p>
      </div>

      {/* Minimální objednávka */}
      <div className="mb-4 text-gray-700">
        <h2 className="font-bold">Minimální objednávka</h2>
        <p>10 ks, vždy pouze v násobcích 10 (součet standardních vajec a se sníženým obsahem cholesterolu).</p>
      </div>

      {/* Uzávěrka objednávek */}
      <div className="mb-4 text-gray-700">
        <h2 className="font-bold">Uzávěrka objednávek</h2>
        <p>
          Objednávky je nutné zadat do <strong>19:00</strong>, pokud je vyzvednutí následující den. 
          Objednávky vystavené po 19:00 nebudou bohužel připraveny druhý den k vyzvednutí.
        </p>
      </div>

      {/* Platba při dodání */}
      <div className="mb-6 text-gray-700">
        <h2 className="font-bold">Platba při dodání</h2>
        <p>
          Platba proběhne při dodání vajec – buď bezhotovostně (QR kód), nebo v hotovosti.
        </p>
      </div>

      <button
        onClick={() => router.push("/objednavka")}
        className="bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-yellow-500 hover:scale-105 transform transition duration-300"
      >
        Přejít k objednávce
      </button>
    </Layout>
  );
}
