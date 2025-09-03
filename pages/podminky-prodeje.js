import Layout from "../components/Layout";

export default function PodminkyProdeje() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-6">Podmínky prodeje</h1>

      {/* Sekce – Prodej vajec */}
      <section className="mb-8 text-gray-700">
        <h2 className="text-2xl font-bold mb-4">Prodej vajec z malochovu</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Vejce mohou pocházet pouze z vlastního hospodářství.</li>
          <li>Prodejní místa: vlastní hospodářství, tržnice/tržiště, místní maloobchodní prodejna (zásobující konečného spotřebitele).</li>
          <li>Vejce musí být prosvícená a označená (trvanlivost, jméno a adresa chovatele).</li>
          <li>Výjimka: při chovu do 50 nosnic není povinné značit jednotlivá vejce.</li>
          <li>Čerstvá vejce lze prodávat max. <strong>21 dní od snášky</strong>, přičemž minimální trvanlivost je <strong>28 dní od snášky</strong>.</li>
          <li>Uchovávat je nutné při <strong>nekolísavé teplotě</strong>.</li>
        </ul>
        <div className="mt-4">
          <h3 className="font-bold">Množství prodeje:</h3>
          <ul className="list-disc ml-6">
            <li>Konečný spotřebitel: max. <strong>60 vajec / týden</strong></li>
            <li>Tržiště: max. <strong>60 vajec / 1 spotřebitel</strong></li>
            <li>Maloobchodní prodejna: max. <strong>600 vajec / týden</strong></li>
          </ul>
        </div>
      </section>

      {/* Sekce – Prodej králičího masa */}
      <section className="mb-8 text-gray-700">
        <h2 className="text-2xl font-bold mb-4">Prodej čerstvého králičího masa</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Maso musí pocházet z vlastního chovu a lze jej prodávat přímo spotřebiteli pro domácí spotřebu.</li>
          <li>Prodávat lze pouze čerstvé, <strong>neporcované maso</strong> (hlava nesmí být oddělena).</li>
          <li>Prodejní místa: vlastní hospodářství, tržnice/tržiště, místní maloobchodní prodejna.</li>
          <li>V maloobchodní prodejně musí být uvedeno upozornění:<br />
            <em>„Maso není veterinárně vyšetřeno – určeno po tepelné úpravě ke spotřebě v domácnosti spotřebitele.“</em>
          </li>
        </ul>
        <div className="mt-4">
          <h3 className="font-bold">Množství prodeje:</h3>
          <ul className="list-disc ml-6">
            <li>Maximální roční produkce: 2000 ks krůt/hus/kachen nebo 10 000 ks ostatní drůbeže</li>
            <li>Týdně: 10 krůt / 10 hus / 10 kachen / 35 ks ostatní drůbeže</li>
            <li>Králíci: max. <strong>10 kusů týdně</strong></li>
          </ul>
        </div>
      </section>
    </Layout>
  );
}
