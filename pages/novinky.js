// pages/novinky.js
import Layout from "../components/Layout";

export default function Novinky() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-6">Novinky</h1>
      
      <div className="space-y-4 text-gray-700 leading-relaxed">
        <p>
          🐓 <strong>1. září 2025:</strong> Přidali jsme novou možnost objednávky vajec se sníženým cholesterolem.
        </p>
        <p>
          🌱 <strong>15. srpna 2025:</strong> Naše slepice mají nově rozšířený výběh.
        </p>
        <p>
          🥚 <strong>1. července 2025:</strong> Spustili jsme online objednávkový systém.
        </p>
      </div>
    </Layout>
  );
}
