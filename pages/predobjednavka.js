import Layout from "../components/Layout";
import PreorderForm from "../components/PreorderForm";

export default function Predobjednavka() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">Předobjednávka vajec</h1>
      <p className="text-gray-700 mb-6">
        Vyplňte předobjednávkový formulář níže. Maximální počet na jednu předobjednávku je{" "}
        <strong>20 ks</strong>, celkový limit systému je <strong>100 ks</strong>.
      </p>

      <PreorderForm />
    </Layout>
  );
}
