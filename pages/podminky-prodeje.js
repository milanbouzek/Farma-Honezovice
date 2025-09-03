import Layout from "../components/Layout";

export default function Podminky() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-6">Podmínky prodeje</h1>

      <section className="mb-6 text-gray-700">
        <h2 className="font-bold mb-2">Označování vajec</h2>
        <p>
          Všechna vejce prodávaná z malochovu musí být řádně označena včetně informace o původu, aby byla splněna legislativní pravidla.
        </p>
      </section>

      <section className="mb-6 text-gray-700">
        <h2 className="font-bold mb-2">Prodej čerstvého králičího masa</h2>
        <p>
          Čerstvé králičí maso musí být prodáváno v souladu s hygienickými předpisy a platnou legislativou pro prodej potravin přímo spotřebiteli.
        </p>
      </section>

      <section className="mb-6 text-gray-700">
        <h2 className="font-bold mb-2">Maximální množství prodaných vajec</h2>
        <p>
          Maximálně lze prodat <strong>60 vajec jednomu spotřebiteli za týden</strong>.
        </p>
      </section>
    </Layout>
  );
}
