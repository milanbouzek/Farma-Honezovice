import Layout from "../components/Layout";
import { useState } from "react";
import OrderForm from "../components/OrderForm";

export default function Objednavka() {
  const [showForm, setShowForm] = useState(false);

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">Objednávka vajec</h1>
      <p className="text-gray-700 mb-6">
        Klikněte na tlačítko níže pro zadání objednávky přímo na našem webu.
      </p>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-yellow-500 hover:scale-105 transform transition duration-300"
        >
          Otevřít objednávkový formulář
        </button>
      )}

      {showForm && <OrderForm />}
    </Layout>
  );
}
