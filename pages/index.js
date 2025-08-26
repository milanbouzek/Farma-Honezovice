import Layout from "../components/Layout";

export default function Home() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">
        Vejce z malochovu
      </h1>
      <p className="text-gray-700 leading-relaxed mb-4">
        Vítejte na stránkách naší malé rodinné farmy v Honezovicích.
        Nabízíme čerstvá vajíčka od slepic chovaných v přirozených podmínkách.
      </p>
      <p className="text-gray-700 leading-relaxed">
        Vejce jsou určena k <strong>prodeji přímo konečnému spotřebiteli</strong>.
        Maximálně lze prodat <strong>60 vajec jednomu spotřebiteli za týden</strong>.
      </p>
    </Layout>
  );
}
