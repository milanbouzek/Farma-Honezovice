import { useEffect, useState } from "react";

export default function StockBox({ editable = false, stock: initialStock }) {
  const [stock, setStock] = useState(initialStock || null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    standard_quantity: 0,
    low_chol_quantity: 0,
  });

  // Načti sklad, pokud není předán přes props
  useEffect(() => {
    if (!initialStock) {
      fetch("/api/stock")
        .then((res) => res.json())
        .then((data) => {
          setStock(data.stock);
          setForm(data.stock);
        })
        .catch((err) => console.error("Chyba při načítání skladu:", err));
    } else {
      setForm(initialStock);
    }
  }, [initialStock]);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setStock(data.stock);
      setEditing(false);
    } catch (err) {
      console.error("Chyba při ukládání skladu:", err);
    }
  };

  if (!stock) return <p>Načítám sklad…</p>;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold mb-2 text-red-600">📦 Stav skladu</h2>
      {!editing ? (
        <>
          <p>
            🥚 Standardní vejce:{" "}
            <strong className="text-green-700 text-xl">
              {stock.standard_quantity}
            </strong>{" "}
            ks (5 Kč/ks)
          </p>
          <p>
            🥚 Vejce se sníženým cholesterolem:{" "}
            <strong className="text-green-700 text-xl">
              {stock.low_chol_quantity}
            </strong>{" "}
            ks (7 Kč/ks)
          </p>
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
        editable && (
          <>
            <div className="mb-2">
              <label className="block text-sm">Standardní vejce:</label>
              <input
                type="number"
                value={form.standard_quantity}
                onChange={(e) =>
                  setForm({ ...form, standard_quantity: Number(e.target.value) })
                }
                className="border px-2 py-1 rounded w-32"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Nízký cholesterol:</label>
              <input
                type="number"
                value={form.low_chol_quantity}
                onChange={(e) =>
                  setForm({ ...form, low_chol_quantity: Number(e.target.value) })
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
        )
      )}
    </div>
  );
}
