import Layout from "../components/Layout";
import OrderForm from "../components/OrderForm";

export default function Objednavka() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">Objednávka vajec</h1>
      <p className="text-gray-700 mb-6">
        Vyplňte níže formulář a objednejte si čerstvá vejce přímo z naší farmy.
      </p>

      {/* Formulář je nyní zobrazený přímo */}
      <OrderForm />
    </Layout>
  );
}
