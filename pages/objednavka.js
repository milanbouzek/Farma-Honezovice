import Layout from "../components/Layout";
import { useState } from "react";
import OrderForm from "../components/OrderForm";

export default function Objednavka() {
  const [showForm, setShowForm] = useState(true);

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">Objednávka vajec</h1>
      <p className="text-gray-700 mb-6">
        Vyplňte objednávkový formulář a zadejte počet vajec, která chcete objednat.
      </p>
      {showForm && <OrderForm />}
    </Layout>
  );
}
