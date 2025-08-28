import Layout from "../components/Layout";

export default function Objednavka() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">Objednávka vajec</h1>
      <p className="text-gray-700 mb-6">
        Klikněte na tlačítko níže a vyplňte jednoduchý formulář pro objednávku
        čerstvých vajec. Po odeslání obdržíte potvrzení e-mailem.
      </p>
      <a
        href="https://forms.office.com/Pages/ResponsePage.aspx?id=4CjHEwy790yOEFsycnnW2SR3troeGgtNqAxWTGDgi7RUREtDQ0dHUUNFMUlMRzZQWENHWUswUFlYUi4u"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-yellow-500 hover:scale-105 transform transition duration-300"
      >
        Otevřít objednávkový formulář
      </a>
    </Layout>
  );
}
