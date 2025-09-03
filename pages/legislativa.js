import Layout from "../components/Layout";

export default function Legislativa() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-6">Legislativa a pravidla pro prodej</h1>

      <div className="space-y-6 text-gray-700">

        <section>
          <h2 className="text-2xl font-bold mb-2">Prodej vajec z malochovu</h2>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Prodáváte pouze čerstvá vejce z vlastního chovu.</li>
            <li>Vejce musí být čistá, bez prasklin a poškození.</li>
            <li>Maximální množství prodávané jednomu spotřebiteli za týden: 60 vajec.</li>
            <li>Musí být zajištěno vhodné skladování a transport (chlazení není povinné při přímém prodeji).</li>
            <li>Prodej je určen přímo konečnému spotřebiteli (ne do obchodních řetězců).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">Prodej čerstvého králičího masa</h2>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Masný králík musí být řádně poražený a hygienicky zpracovaný.</li>
            <li>Masné výrobky musí být uchovávány při vhodné teplotě a zajištěny proti kontaminaci.</li>
            <li>Prodej je určen přímému spotřebiteli nebo na farmářských trzích.</li>
            <li>Je nutné dodržovat platné veterinární a hygienické předpisy.</li>
            <li>Spotřebitel musí být informován o původu masa a způsobu chovu zvířat.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">Obecné rady</h2>
          <p>
            Doporučujeme vést záznamy o prodeji, pravidelně kontrolovat kvalitu produktů a zajistit hygienické podmínky
            při skladování a přepravě. V případě jakýchkoliv pochybností kontaktujte příslušný krajský úřad nebo veterinární
            správu.
          </p>
        </section>

      </div>
    </Layout>
  );
}
