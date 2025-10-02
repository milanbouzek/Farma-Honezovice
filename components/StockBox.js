import { useEffect, useState } from "react";

/**
 * StockBox
 * - editable = true  -> zobrazuje tlačítko "Aktualizovat stav" a umožní editaci
 * - editable = false -> pouze zobrazuje stav (použít na veřejné stránce)
 *
 * API response očekává:
 * {
 *   stock: { standard_quantity, low_chol_quantity },
 *   prices: { standard_price, low_chol_price }
 * }
 */
export default function StockBox({ editable = false, initialStock = null }) {
  const [stock, setStock] = useState(null);
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(!initialStock);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    standard_quantity: 0,
    low_chol_quantity: 0,
    standard_price: 0,
    low_chol_price: 0,
  });

  // Normalizace dat
  const normalize = (payload) => {
    if (!payload) return { stock: {}, prices: {} };

    const s = payload.stock || payload;
    const p = payload.prices || {};

    return {
      stock: {
        standard_quantity:
          s.standard_quantity ?? s.standardQuantity ?? s.standard ?? 0,
        low_chol_quantity:
          s.low_chol_quantity ?? s.lowCholQuantity ?? s.low_chol ?? 0,
      },
      prices: {
        standard_price:
          p.standard_price ?? p.standardPrice ?? p.standard ?? 0,
        low_chol_price:
          p.low_chol_price ?? p.lowCholPrice ?? p.low_chol ?? 0,
      },
    };
  };

  useEffect(() => {
    if (initialStock) {
      const norm = normalize(initialStock);
      setStock(norm.stock);
      setPrices(norm.prices);
      setForm({ ...norm.stock, ...norm.prices });
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
        setStock(norm.stock);
        setPrices(norm.prices);
        setForm({ ...norm.stock, ...norm.prices });
      } catch (err) {
        console.error("Chyba při načítání skladu:", err);
        if (!mounted) return;
        setStock({ standard_quantity: 0, low_chol_quantity: 0 });
        setPrices({ standard_price: 0, low_chol_price: 0 });
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
      setStock(norm.stock);
      setPrices(norm.prices);
      setForm({ ...norm.stock, ...norm.prices });
      setEditing(false);
      setLoading(false);
    } catch (err) {
      console.error("Chyba při ukládání skladu:", err);
      setLoading(false);
    }
  };

  if (loading || !stock || !prices) return <p>Načítám sklad…</p>;

  return (
    <div className={`mb-6 ${editable ? "p-4 bg-white shadow rounded-xl" : ""}`}>
      <h2 className="text-lg font-bold mb-2 text-red-600">📦 Stav skladu</h2>

      {!editing ? (
        <>
          <p>
            🥚 Standardní vejce:{" "}
            <strong className="text-green-700 text-xl">
              {stock.standard_quantity}
            </strong>{" "}
            ks ({prices.standard_price} Kč/ks)
          </p>
          <p>
            🥚 Vejce se sníženým cholesterolem:{" "}
            <strong className="text-green-700 text-xl">
              {stock.low_chol_quantity}
            </strong>{" "}
            ks ({prices.low_chol_price} Kč/ks)
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
            {/* SKLAD */}
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
              <label className="block text-sm">Nízký cholesterol (ks):</label>
              <input
                type="number"
                value={form.low_chol_quantity}
                onChange={(e) =>
                  setForm({ ...form, low_chol_quantity: Number(e.target.value) })
                }
                className="border px-2 py-1 rounded w-32"
              />
            </div>

            {/* CENY */}
            <div className="mb-2">
              <label className="block text-sm">Cena standard (Kč/ks):</label>
              <input
                type="number"
                value={form.standard_price}
                onChange={(e) =>
                  setForm({ ...form, standard_price: Number(e.target.value) })
                }
                className="border px-2 py-1 rounded w-32"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">
                Cena nízký cholesterol (Kč/ks):
              </label>
              <input
                type="number"
                value={form.low_chol_price}
                onChange={(e) =>
                  setForm({ ...form, low_chol_price: Number(e.target.value) })
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
              onClick={() => {
                setEditing(false);
                setForm({ ...stock, ...prices });
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
