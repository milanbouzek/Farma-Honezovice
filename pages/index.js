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

      <div className="mb-4 text-lg text-gray-700">
        <p>🥚 Standardní vejce: <strong>{stock.standardQuantity}</strong> ks (5 Kč/ks)</p>
        <p>🥚 Vejce se sníženým cholesterolem: <strong>{stock.lowCholQuantity}</strong> ks (7 Kč/ks)</p>
      </div>

      <div className="mb-6 text-gray-700">
        <p>
          <strong>Minimální objednávka:</strong> 10 vajec a vždy po násobcích 10 ks (součet standardních a vajec se sníženým cholesterolem).
        </p>
        <p>
          Objednávky je nutné zadat do 19:00, pokud je vyzvednutí následující den. 
          Objednávky vystavené po 19:00 nebudou bohužel připraveny druhý den k vyzvednutí.
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
