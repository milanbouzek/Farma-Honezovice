import Layout from "../components/Layout";

export default function Objednavka() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold text-green-700 mb-4">Objednávka vajec</h1>
      <p className="mb-6">Kliknutím na tlačítko níže vyplníte objednávkový formulář.</p>
      <a
        href="TVŮJ_ODKAZ_NA_MS_FORMS"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-green-700 transition"
      >
        Objednat vajíčka
      </a>
    </Layout>
  );
}
