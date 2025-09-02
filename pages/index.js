import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const [stock, setStock] = useState({ standard: 0, lowChol: 0 });
  const router = useRouter();

  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json();
        setStock({ standard: data.standard, lowChol: data.lowChol });
      } catch {
        setStock({ standard: 0, lowChol: 0 });
      }
    }
    fetchStock();
  }, []);

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">Vejce z malochovu</h1>
      <p className="text-gray-700 mb-4">
        Vítejte na stránkách naší malé rodinné farmy v Honezovicích.
        Nabízíme čerstvá vajíčka od slepic chovaných v přirozených podmínkách.
      </p>

      <p className="text-gray-700 mb-6">
        🥚 Aktuálně k dispozici:
        <strong> {stock.standard}</strong> standardních vajec,
        <strong> {stock.lowChol}</strong> vajec se sníženým cholesterolem
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
