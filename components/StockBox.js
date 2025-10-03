import { useEffect, useState } from "react";

/**
 * StockBox
 * - editable = true  -> umožní editaci stavu a cen
 * - editable = false -> jen zobrazí stav a ceny
 */
export default function StockBox({ editable = false, initialStock = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!initialStock);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    standard_quantity: 0,
    low_chol_quantity: 0,
    standard_price: 0,
    low_chol_price: 0,
  });

  // Normalizace odpovědi API
  const normalize = (payload) => {
    if (!payload) {
      return {
        standard_quantity: 0,
        low_chol_quantity: 0,
        standard_price: 0,
        low_chol_price: 0,
      };
    }
    return {
      standard_quantity:
        payload.stock?.standard_quantity ?? payload.standard_quantity ?? 0,
      low_chol_quantity:
        payload.stock?.low_chol_quantity ?? payload.low_chol_quantity ?? 0,
      standard_price:
        payload.prices?.standard_price ?? payload.standard_price ?? 0,
      low_chol_price:
        payload.prices?.low_chol_price ?? payload.low_chol_price ?? 0,
    };
  };

  useEffect(() => {
    if (initialStock) {
      const norm = normalize(initialStock);
      setData(norm);
      setForm(norm);
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/stock", { cache: "no-store" });
        const json = await res.json();
        const norm = normalize(json);
        if (!mounted) return;
        setData(norm);
        setForm(norm);
      } catch (err) {
        console.error("Chyba při načítání skladu:", err);
        if (!mounted) return;
        setData({
          standard_quantity: 0,
          low_chol_quantity: 0,
          standard_price: 0,
          low_chol_price: 0,
        });
        setForm({
          standard_quantity: 0,
          low_chol_quantity: 0,
          standard_price: 0,
          low_chol_price: 0,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [initialStock]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        standardQuantity: Number(form.standard_quantity),
        lowCholQuantity: Number(form.low_chol_quantity),
        standardPrice: Number(form.standard_price),
        lowCholPrice: Number(form.low_chol_price),
      };

      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      const norm = normalize(json);

      setData(norm);
      setForm(norm);
      setEditing(false);
      setLoading(false);
    } catch (err) {
      console.error("Chyba při ukládání skladu/cen:", err);
      setLoading(false);
    }
  };

  if (loading || !data) return <p>Načítám sklad…</p>;

  return (
    <div className={`mb-6 ${editable ? "p-4 bg-white shadow rounded-xl" : ""}`}>
      <h2 className="text-lg font-bold mb-2 text-red-600">📦 Stav skladu & ceny</h2>

      {!editing ? (
        <>
          <p>
            🥚 Standardní vejce:{" "}
            <strong className="text-green-700 text-xl">
              {data.standard_quantity}
            </strong>{" "}
            ks ({data.standard_price} Kč/ks)
          </p>
          <p>
            🥚 Vejce se sníženým cholesterolem:{" "}
            <strong className="text-green-700 text-xl">
              {data.low_chol_quantity}
            </strong>{" "}
            ks ({data.low_chol_price} Kč/ks)
          </p>

          {editable && (
            <button
              onClick={() => setEditing(true)}
              className="mt-3 px-4 py-1 bg-blue-500 text-white rounded"
            >
              Aktualizovat stav a ceny
            </button>
          )}
        </>
      ) : (
        editable && (
          <>
            {/* Standardní vejce */}
            <div className="mb-2">
              <label className="block text-sm">Standardní vejce (ks):</label>
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
              <label className="block text-sm">Cena standardních (Kč/ks):</label>
              <input
                type="number"
                value={form.standard_price}
                onChange={(e) =>
                  setForm({ ...form, standard_price: Number(e.target.value) })
                }
                className="border px-2 py-1 rounded w-32"
              />
            </div>

            {/* Nízký cholesterol */}
            <div className="mb-2">
              <label className="block text-sm">Vejce se sníženým cholesterolem (ks):</label>
              <input
                type="number"
                value={form.low_chol_quantity}
                onChange={(e) =>
                  setForm({ ...form, low_chol_quantity: Number(e.target.value) })
                }
                className="border px-2 py-1 rounded w-32"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Cena nízký cholesterol (Kč/ks):</label>
              <input
                type="number"
                value={form.low_chol_price}
                onChange={(e) =>
                  setForm({ ...form, low_chol_price: Number(e.target.value) })
                }
                className="border px-2 py-1 rounded w-32"
              />
            </div>

            {/* Ovládací tlačítka */}
            <button
              onClick={handleSave}
              className="px-4 py-1 bg-green-500 text-white rounded mr-2"
            >
              Uložit
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setForm(data); // reset zpět na hodnoty z DB
              }}
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
