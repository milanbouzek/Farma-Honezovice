import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import toast, { Toaster } from "react-hot-toast";

export default function AdminPreorders() {
  const [preorders, setPreorders] = useState([]);

  const loadPreorders = async () => {
    const res = await fetch("/api/preorders");
    const data = await res.json();
    setPreorders(data.preorders || []);
  };

  useEffect(() => {
    loadPreorders();
  }, []);

  const confirmPreorder = async (id) => {
    const res = await fetch("/api/preorders/confirm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Chyba při potvrzení.");
      return;
    }

    toast.success("Předobjednávka převedena do objednávek.");
    loadPreorders();
  };

  const cancelPreorder = async (id) => {
    const res = await fetch("/api/preorders/cancel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Chyba při zrušení.");
      return;
    }

    toast.success("Předobjednávka zrušena.");
    loadPreorders();
  };

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">Předobjednávky</h1>

      <table className="w-full bg-white shadow rounded-xl overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Jméno</th>
            <th className="p-2 text-left">Standard</th>
            <th className="p-2 text-left">LowChol</th>
            <th className="p-2 text-left">Datum</th>
            <th className="p-2 text-left">Akce</th>
          </tr>
        </thead>
        <tbody>
          {preorders.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">{p.customer_name}</td>
              <td className="p-2">{p.standard_quantity}</td>
              <td className="p-2">{p.low_chol_quantity}</td>
              <td className="p-2">{p.pickup_date}</td>
              <td className="p-2 flex gap-2">
                {p.status === "předobjednávka" && (
                  <>
                    <button
                      onClick={() => confirmPreorder(p.id)}
                      className="bg-green-600 text-white px-2 py-1 rounded"
                    >
                      Potvrdit
                    </button>
                    <button
                      onClick={() => cancelPreorder(p.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Zrušit
                    </button>
                  </>
                )}
                {p.status !== "předobjednávka" && (
                  <span className="italic text-gray-500">{p.status}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
