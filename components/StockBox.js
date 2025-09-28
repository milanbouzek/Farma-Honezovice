import { useEffect, useState } from "react";

export default function StockBox({ editable = false }) {
  const [stock, setStock] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ standardQuantity: 0, lowCholQuantity: 0 });

  useEffect(() => {
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => {
        setStock(data);
        setForm(data);
      })
      .catch((err) => console.error("Chyba při načítání skladu:", err));
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setStock(data);
      setEditing(false);
    } catch (err) {
      console.error("Chyba při ukládání skladu:", err);
    }
  };

  if (!stock) return <p>Načítám sklad…</p>;

  return (
    <div className="p-4 mb-6 border rounded bg-gray-50">
      <h2 className="text-lg font-bold mb-2">📦 Stav skladu</h2>

      {!editing ? (
        <>
          <p>Standardní vejce: {stock.standardQuantity}</p>
          <p>Nízký cholesterol: {stock.lowCholQuantity}</p>

          {editable && (
            <button
              onClick={() => setEditing(true)}
              className="mt-3 px-4 py-1 bg-blue-500 text-white rounded"
            >
              Aktualizovat stav
            </button>
          )}
        </>
      ) : (
        <>
          <div className="mb-2">
            <label className="block text-sm">Standardní vejce:</label>
            <input
              type="number"
              value={form.standardQuantity}
              onChange={(e) =>
                setForm({ ...form, standardQuantity: Number(e.target.value) })
              }
              className="border px-2 py-1 rounded w-32"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm">Nízký cholesterol:</label>
            <input
              type="number"
              value={form.lowCholQuantity}
              onChange={(e) =>
                setForm({ ...form, lowCholQuantity: Number(e.target.value) })
              }
              className="border px-2 py-1 rounded w-32"
            />
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-1 bg-green-500 text-white rounded mr-2"
          >
            Uložit
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-1 bg-gray-400 text-white rounded"
          >
            Zrušit
          </button>
        </>
      )}
    </div>
  );
}
