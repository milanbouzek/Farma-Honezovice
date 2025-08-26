import Layout from "../components/Layout";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
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

      {/* Animované tlačítko na objednávku */}
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

      {/* Fotky farmy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Image
          src="/vajicka.jpg"   // tady nahraď svým obrázkem
          alt="Čerstvá vejce"
          width={400}
          height={300}
          className="rounded-xl shadow-md hover:scale-105 transform transition duration-300"
        />
        <Image
          src="/slepice.jpg"  // nahraď svým obrázkem
          alt="Slepice na farmě"
          width={400}
          height={300}
          className="rounded-xl shadow-md hover:scale-105 transform transition duration-300"
        />
        <Image
          src="/kurnik.jpg"   // nahraď svým obrázkem
          alt="Zateplený kurník"
          width={400}
          height={300}
          className="rounded-xl shadow-md hover:scale-105 transform transition duration-300"
        />
      </div>
    </Layout>
  );
}
