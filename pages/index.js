import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 p-6">
      <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-lg text-center space-y-6">
        <h1 className="text-3xl font-bold text-green-700">Vejce z malochovu</h1>
        
        <p className="text-gray-700 leading-relaxed">
          Čerstvá nebalená vejce mohou být prodána nejpozději <strong>21 dnů po snášce</strong>.
          Datum minimální trvanlivosti je <strong>28 dnů po snášce</strong>.
        </p>
        
        <p className="text-gray-700 leading-relaxed">
          Uchovávejte při nekolísavé teplotě <strong>+5 až +18 °C</strong>.
        </p>

        <p className="text-gray-700 leading-relaxed">
          Vejce jsou určena k <strong>prodeji přímo konečnému spotřebiteli</strong>.
          Maximálně lze prodat <strong>60 vajec jednomu spotřebiteli za týden</strong>.
        </p>

        {/* Fotka vajec */}
        <div className="my-6">
          <Image
            src="/vajicka.jpg"
            alt="Vajíčka z malochovu"
            width={600}
            height={400}
            className="rounded-xl shadow-md mx-auto"
          />
        </div>

        {/* Informace o velikostech */}
        <div className="bg-green-50 p-4 rounded-lg text-gray-700 text-sm leading-relaxed">
          <p><strong>Standardní vejce</strong>: převážně velikosti M (průměr 59 g)</p>
          <p><strong>Zelená vejce</strong>: velikost S (průměr 52 g)</p>
        </div>

        {/* Tlačítko na MS Forms */}
        <a
          href="https://forms.office.com/Pages/ResponsePage.aspx?id=4CjHEwy790yOEFsycnnW2SR3troeGgtNqAxWTGDgi7RUREtDQ0dHUUNFMUlMRzZQWENHWUswUFlYUi4u"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block bg-green-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-green-700 transition"
        >
          Objednat vajíčka
        </a>
      </div>
    </div>
  );
}


