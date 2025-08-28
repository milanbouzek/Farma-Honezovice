import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Home() {
  const [eggs, setEggs] = useState(0);

  useEffect(() => {
    // Fetch aktuální počet vajec, pokud máš zdroj (např. SQL Server)
    fetch("/api/inventory")
      .then(res => res.json())
      .then(data => setEggs(data.eggs))
      .catch(() => setEggs(0)); // fallback, pokud API není k dispozici
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

      <motion.a
        href="https://forms.office.com/Pages/ResponsePage.aspx?id=4CjHEwy790yOEFsycnnW2SR3troeGgtNqAxWTGDgi7RUREtDQ0dHUUNFMUlMRzZQWENHWUswUFlYUi4u"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-yellow-400 text-gray-900 font-bold px-8 py-4 rounded-full shadow-lg hover:bg-yellow-500 mb-8"
        whileHover={{ scale: 1.1, rotate: 2 }}
        animate={{ scale: [1, 1.05, 1], rotate: [0, -2, 2, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
      >
        🥚 Objednat vajíčka
      </motion.a>
    </Layout>
  );
}
