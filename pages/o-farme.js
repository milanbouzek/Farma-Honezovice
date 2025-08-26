import Layout from "../components/Layout";

export default function OFarme() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">O naší farmě</h1>
      <p className="text-gray-700 leading-relaxed mb-4">
        Naše farma v Honezovicích je domovem <strong>13 slepic</strong>, které
        chováme v prostorném a <strong>zatepleném kurníku</strong> s venkovním
        výběhem. Slepice mají dostatek pohybu a přirozený denní rytmus.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        Krmíme je kvalitními granulemi, čerstvou trávou a doplňkově pšenicí,
        aby byla vejce bohatá na živiny a měla výbornou chuť.
      </p>
      <p className="text-gray-700 leading-relaxed">
        Chováme pestrou škálu plemen:
        <br />
        <em>
          Dominant Červený D853, Dominant Leghorn Černobílý D601, Dominant
          Leghorn D229, 2× Dominant Modrý D107, Dominant Žíhaný D959, 2×
          Dominant Vlaška koroptví D300, Dominant Černý D109, Dominant
          Greenshell, Dominant Blueshell, Dominant Darkshell a Dominant
          Darkgreen.
        </em>
      </p>
    </Layout>
  );
}
pages/objednavka.js – Objednávka
jsx
Zkopírovat
Upravit
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
