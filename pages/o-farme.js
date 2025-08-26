import { Card, CardContent } from "@/components/ui/card";

export default function OFarme() {
  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg rounded-2xl p-6">
          <CardContent>
            <h1 className="text-3xl font-bold mb-6 text-green-800">O naší farmě</h1>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-green-700">Naše malá rodinná farma</h2>
              <p className="text-gray-700">
                Naše malá rodinná farma v Honezovicích se zaměřuje na chov slepic v přirozených a pohodlných podmínkách. 
                Slepice žijí v zatepleném kurníku s venkovním výběhem, kde mají dostatek prostoru k pohybu, popelení i hrabání.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-green-700">Krmení a péče</h2>
              <p className="text-gray-700">
                Aby byla vejce vždy chutná a plná živin, dbáme na vyváženou stravu slepic. Krmíme je kvalitními granulemi, 
                čerstvou trávou a doplňkově také pšenicí. Slepice mají vždy přístup k čerstvé vodě a dostávají péči, která podporuje jejich zdraví a pohodu.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-green-700">Naše slepice</h2>
              <p className="text-gray-700 mb-2">
                V současnosti chováme <strong>13 slepic různých plemen DOMINANT</strong>, což zajišťuje pestrou snášku vajec:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>DOMINANT ČERVENÝ D853</li>
                <li>Dominant Leghorn Černobílý D601</li>
                <li>Dominant Leghorn D229</li>
                <li>2× Dominant Modrý D107</li>
                <li>Dominant Žíhaný D959</li>
                <li>2× Dominant Vlaška koroptví D300</li>
                <li>Dominant Černý D109</li>
                <li>DOMINANT GREENSHELL</li>
                <li>DOMINANT BLUESHELL</li>
                <li>DOMINANT DARKSHELL</li>
                <li>DOMINANT DARKGREEN</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2 text-green-700">Proč naše vejce?</h2>
              <p className="text-gray-700">
                Vejce z našeho malochovu jsou vždy čerstvá, pochází z malého počtu slepic a jejich kvalitu zaručuje přirozený způsob chovu. 
                Prodáváme je přímo konečným spotřebitelům – tedy tobě.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
