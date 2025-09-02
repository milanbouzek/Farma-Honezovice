import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function Home() {
  const [stock, setStock] = useState({ standard: 0, lowChol: 0 });

  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json();
        setStock(data);
      } catch {
        setStock({ standard: 0, lowChol: 0 });
      }
    }
    fetchStock();
  }, []);

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">Vejce z malochovu</h1>
      <p className="text-gray-700 mb-6">
        Aktuálně k dispozici: <strong>{stock.standard}</strong> standardních vajec a{" "}
        <strong>{stock.lowChol}</strong> vajec se sníženým cholesterolem.
      </p>
      <a
        href="/objednávka"
        className="bg-yellow-400 px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 transform transition"
      >
        Přejít k objednávce
      </a>
    </Layout>
  );
}
