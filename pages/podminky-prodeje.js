import Layout from "../components/Layout";

export default function PodminkyProdeje() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-6">Podmínky prodeje</h1>

      <p className="mb-4 text-gray-700">
        Prodej potravin z vlastního chovu, včetně vajec a čerstvého králičího masa,
        podléhá určitým legislativním pravidlům a hygienickým předpisům. Níže uvádíme
        základní informace pro konečné spotřebitele a prodejce z malochovu:
      </p>

      <h2 className="text-xl font-semibold text-green-700 mb-2">1. Vejce z malochovu</h2>
      <ul className="list-disc pl-6 mb-4 text-gray-700">
        <li>Vejce lze prodávat přímo konečnému spotřebiteli bez speciální registrace,
            pokud jde o malochov (maximálně 60 vajec týdně na jednoho spotřebitele).</li>
        <li>Musí být dodržena základní hygiena při sběru a skladování vajec – chladné, čisté a bez poškození.</li>
        
      </ul>

      <h2 className="text-xl font-semibold text-green-700 mb-2">2. Čerstvé králičí maso</h2>
      <ul className="list-disc pl-6 mb-4 text-gray-700">
        <li>Prodej králičího masa podléhá hygienickým předpisům pro potraviny živočišného původu.</li>
        <li>Musí být dodržen chladicí řetězec (0–4 °C) při skladování a přepravě k zákazníkovi.</li>
        
      </ul>

      <h2 className="text-xl font-semibold text-green-700 mb-2">3. Doporučení pro spotřebitele</h2>
      <ul className="list-disc pl-6 mb-4 text-gray-700">
        <li>Spotřebujte vejce a čerstvé maso co nejdříve po zakoupení, nejlépe do několika dní.</li>
        <li>Skladujte vejce v chladničce při teplotě 4–8 °C a maso při 0–4 °C.</li>
        <li>Objednávky z malochovu je vhodné zadávat s dostatečným předstihem, aby bylo možné zaručit čerstvost.</li>
      </ul>

      <p className="text-gray-700">
        Tyto informace mají informativní charakter a nenahrazují oficiální legislativní
        dokumenty.
      </p>
    </Layout>
  );
}
