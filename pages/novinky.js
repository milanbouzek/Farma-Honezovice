import Layout from "../components/Layout";

export default function Novinky() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-6">Novinky</h1>

      <div className="space-y-4 text-gray-700">
        <div>
          <p><strong>3.9.2025:</strong> Spuštění webu a on-line objednávek.</p>
        </div>
        <div>
          <p><strong>16.8.2025:</strong> Nové přírůstky – tři 15-ti týdenní slepičky:</p>
          <ul className="list-disc list-inside ml-4">
            <li>Dominant BLUESHELL</li>
            <li>Dominant DARKSHELL</li>
            <li>Dominant DARKGREEN</li>
          </ul>
          <p>Tyto slepičky budou od 22. týdne (cca polovina října) snášet vajíčka se sníženým obsahem cholesterolu (barva vajec: modrá, tmavě hnědá, olivově zelená).</p>
        </div>
      </div>
    </Layout>
  );
}
