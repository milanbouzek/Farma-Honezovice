import { useEffect, useState } from "react";

/**
 * StockBox
 * - editable = true  -> zobrazuje tlačítko "Aktualizovat stav" a umožní editaci
 * - editable = false -> pouze zobrazuje stav (použít na veřejné stránce)
 *
 * Kompatibilita s různými tvary response:
 *  - { stock: { standard_quantity, low_chol_quantity } }
 *  - { standardQuantity, lowCholQuantity }
 *  - { standard_quantity, low_chol_quantity }
 */
export default function StockBox({ editable = false, initialStock = null }) {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(!initialStock);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    standard_quantity: 0,
    low_chol_quantity: 0,
  });

  // Normalizér různých tvarů odpovědi na { standard_quantity, low_chol_quantity }
  const normalize = (payload) => {
    if (!payload) return { standard_quantity: 0, low_chol_quantity: 0 };

    // případ { stock: { ... } }
    if (payload.stock && typeof payload.stock === "object") {
      const s = payload.stock;
      return {
        standard_quantity:
          s.standard_quantity ?? s.standardQuantity ?? s.standard ?? 0,
        low_chol_quantity:
          s.low_chol_quantity ?? s.lowCholQuantity ?? s.low_chol ?? 0,
      };
    }

    // přímo pole / camelCase / snake_case
    return {
      standard_quantity:
        payload.standard_quantity ?? payload.standardQuantity ?? payload.standard ?? 0,
      low_chol_quantity:
        payload.low_chol_quantity ?? payload.lowCholQuantity ?? payload.low_chol ?? 0,
    };
  };

  useEffect(() => {
    if (initialStock) {
      const norm = normalize(initialStock);
      setStock(norm);
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
        // normalize a nastavit
        const norm = normalize(json);
        if (!mounted) return;
        setStock(norm);
        setForm(norm);
      } catch (err) {
        console.error("Chyba při načítání skladu:", err);
        if (!mounted) return;
        // fallback na 0/0 místo věčného načítání
        setStock({ standard_quantity: 0, low_chol_quantity: 0 });
        setForm({ standard_quantity: 0, low_chol_quantity: 0 });
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
    // POST očekává camelCase podle tvého API: { standardQuantity, lowCholQuantity }
    try {
      setLoading(true);
      const payload = {
        standardQuantity: Number(form.standard_quantity),
        lowCholQuantity: Number(form.low_chol_quantity),
      };
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      // server by měl vrátit nové hodnoty (normálně camelCase) -> normalizujeme
      const norm = normalize(json);
      setStock(norm);
      setForm(norm);
      setEditing(false);
      setLoading(false);
    } catch (err) {
      console.error("Chyba při ukládání skladu:", err);
      setLoading(false);
    }
  };

  if (loading || !stock) return <p>Načítám sklad…</p>;

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
              onClick={() => {
                setEditing(false);
                // obnovit formulář z aktuálního stocku
                setForm(stock);
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
