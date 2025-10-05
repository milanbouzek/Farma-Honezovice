import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import toast from "react-hot-toast";

export default function NakladyPage() {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ date: "", amount: "", description: "" });

  const fetchExpenses = async () => {
    const res = await fetch("/api/admin/expenses");
    const data = await res.json();
    setExpenses(data.expenses);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = async () => {
    if (!newExpense.date || !newExpense.amount) return toast.error("Vyplňte datum a částku");
    const res = await fetch("/api/admin/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newExpense),
    });
    const data = await res.json();
    if (data.expense) {
      toast.success("✅ Náklad přidán");
      setNewExpense({ date: "", amount: "", description: "" });
      fetchExpenses();
    } else toast.error("❌ Nepodařilo se přidat náklad");
  };

  const deleteExpense = async (id) => {
    if (!confirm("Opravdu smazat tento náklad?")) return;
    const res = await fetch(`/api/admin/expenses?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      toast.success("🗑️ Náklad smazán");
      fetchExpenses();
    } else toast.error("❌ Chyba při mazání");
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">📉 Náklady</h1>

      {/* formulář pro přidání */}
      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">➕ Přidat náklad</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={newExpense.date}
            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            className="border rounded p-2"
          />
          <input
            type="number"
            placeholder="Částka (Kč)"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            className="border rounded p-2"
          />
          <input
            type="text"
            placeholder="Popis"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            className="border rounded p-2 flex-1"
          />
          <button
            onClick={addExpense}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Přidat
          </button>
        </div>
      </div>

      {/* přehled nákladů */}
      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-xl font-bold mb-4">💸 Přehled nákladů</h2>
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Datum</th>
              <th className="border p-2 text-right">Částka (Kč)</th>
              <th className="border p-2 text-left">Popis</th>
              <th className="border p-2 text-center">Akce</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length > 0 ? (
              expenses.map((e) => (
                <tr key={e.id}>
                  <td className="border p-2">{e.date}</td>
                  <td className="border p-2 text-right">{e.amount}</td>
                  <td className="border p-2">{e.description || "-"}</td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => deleteExpense(e.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Smazat
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center p-4 text-gray-500">
                  Žádné náklady zatím nejsou.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
