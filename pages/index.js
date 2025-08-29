import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import OrderForm from "../components/OrderForm";

export default function Home() {
  const [eggs, setEggs] = useState(0);

  // Načtení aktuálního stavu vajec při načtení stránky
  useEffect(() => {
    async function fetchEggs() {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json();
        setEggs(data.quantity);
      } catch {
        setEggs(0);
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
        Vítejte na stránkách naší malé rodinné farmy v Honezovicích.
        Nabízíme čerstvá vajíčka od slepic chovaných v přirozených podmínkách.
      </p>

      <p className="text-gray-700 leading-relaxed mb-6">
        Vejce jsou určena k <strong>prodeji přímo konečnému spotřebiteli</strong>.
        Maximálně lze prodat <strong>60 vajec jednomu spotřebiteli za týden</strong>.
      </p>

      <p className="mb-6 text-lg text-gray-700">
        🥚 Aktuálně k dispozici: <strong>{eggs}</strong> vajec
      </p>

      {/* Tlačítko scroll na formulář */}
      <motion.button
        type="button"
        onClick={() =>
          document
            .getElementById("order-form")
            .scrollIntoView({ behavior: "smooth" })
        }
        className="bg-yellow-400 text-gray-900 font-bold px-8 py-4 rounded-full shadow-lg hover:bg-yellow-500 mb-8"
        whileHover={{ scale: 1.05 }}
      >
        🥚 Objednat vajíčka
      </motion.button>

      {/* Objednávkový formulář */}
      <div id="order-form">
        <OrderForm />
      </div>
    </Layout>
  );
}
