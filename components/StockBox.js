// components/StockBox.js
import { useState } from "react";

export default function StockBox({ stock = {}, editable = false, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    standardQuantity: stock.standardQuantity ?? 0,
    lowCholQuantity: stock.lowCholQuantity ?? 0,
  });

  const handleSave = () => {
    if (onSave) {
      onSave(form);
    }
    setEditing(false);
  };

  return (
    <div className="mb-6 text-lg text-gray-700">
      <h2 className="font-bold mb-1 text-red-600">Aktuální dostupné množství</h2>
      <p>
        🥚 Standardní vejce:{" "}
        <strong className="text-green-700 text-xl">
          {stock.standardQuantity ?? 0}
        </strong>{" "}
        ks (5 Kč/ks)
      </p>
      <p>
        🥚 Vejce se sníženým cholesterolem:{" "}
        <strong className="text-green-700 text-xl">
          {stock.lowCholQuantity ?? 0}
        </strong>{" "}
        ks (7 Kč/ks)
      </p>

      {editable && !editing && (
        <button
          onClick={() => setEditing(true)}
          className="mt-3 px-4 py-1 bg-blue-500 text-white rounded"
        >
          Aktualizovat stav
        </button>
      )}

      {editable && editing && (
        <div className="mt-3 space-y-2">
          <div>
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
          <div>
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
        </div>
      )}
    </div>
  );
}
