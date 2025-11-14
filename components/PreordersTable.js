// components/PreordersTable.js
import React, { useState } from "react";
import toast from "react-hot-toast";

/**
 * PreordersTable
 * props:
 *  - preorders: array
 *  - refresh(): function to reload
 */
export default function PreordersTable({ preorders = [], refresh }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const confirmPreorder = async (id) => {
    try {
      const res = await fetch("/api/preorders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      toast.success("Předobjednávka byla převedena do objednávek");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Chyba: " + (err.message || err));
    }
  };

  const deletePreorder = async (id) => {
    if (!confirm("Opravdu zrušit předobjednávku?")) return;
    try {
      const res = await fetch("/api/preorders/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      toast.success("Předobjednávka byla zrušena");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Chyba: " + (err.message || err));
    }
  };

  const openEdit = (p) => {
    // připravíme form objekt stejný jako DB klíče (pickupdate jako DD.MM.YYYY)
    const toDDMMYYYY = (d) => {
      if (!d) return "";
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return d; // už může být ve formátu DD.MM.YYYY
      const dd = String(dt.getDate()).padStart(2, "0");
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const yyyy = dt.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    };

    setEditing({
      id: p.id,
      name: p.name || "",
      email: p.email || "",
      phone: p.phone || "",
      pickuplocation: p.pickuplocation || "",
      pickupdate: toDDMMYYYY(p.pickupdate || p.pickupdate), // podporuje date i string
      standardQty: p.standardQty || 0,
      lowcholQty: p.lowcholQty || 0,
      note: p.note || "",
      status: p.status || "",
    });
  };

  const setField = (k, v) =>
    setEditing((s) => (s ? { ...s, [k]: v } : s));

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/preorders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          name: editing.name,
          email: editing.email,
          phone: editing.phone,
          pickupLocation: editing.pickuplocation,
          pickupDate: editing.pickupdate,
          standardQty: Number(editing.standardQty || 0),
          lowcholQty: Number(editing.lowcholQty || 0),
          note: editing.note,
          status: editing.status,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || JSON.stringify(data));
      }
      toast.success("Předobjednávka uložena");
      setEditing(null);
      refresh();
    } catch (err) {
      console.error("Save preorder error:", err);
      toast.error("Chyba při ukládání: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const calcTotal = (p) => {
    const s = Number(p.standardQty || 0);
    const l = Number(p.lowcholQty || 0);
    return s + l;
  };

  const calcPrice = (p) => {
    const s = Number(p.standardQty || 0);
    const l = Number(p.lowcholQty || 0);
    return s * 5 + l * 7;
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
      <table className="min-w-full">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">ID</th>
            <th className="p-2">Jméno</th>
            <th className="p-2">Tel</th>
            <th className="p-2">Email</th>
            <th className="p-2">Std</th>
            <th className="p-2">Low</th>
            <th className="p-2">Celkem</th>
            <th className="p-2">Cena</th>
            <th className="p-2">Místo</th>
            <th className="p-2">Datum</th>
            <th className="p-2">Stav</th>
            <th className="p-2">Pozn.</th>
            <th className="p-2">Akce</th>
          </tr>
        </thead>
        <tbody>
          {preorders.map((p) => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{p.id}</td>
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.phone || "-"}</td>
              <td className="p-2">{p.email || "-"}</td>
              <td className="p-2 text-right">{p.standardQty}</td>
              <td className="p-2 text-right">{p.lowcholQty}</td>
              <td className="p-2 text-right">{calcTotal(p)}</td>
              <td className="p-2 text-right">{calcPrice(p)} Kč</td>
              <td className="p-2">{p.pickuplocation}</td>
              <td className="p-2">{p.pickupdate ? (typeof p.pickupdate === "string" ? p.pickupdate : new Date(p.pickupdate).toLocaleDateString("cs-CZ")) : "-"}</td>
              <td className="p-2">{p.status}</td>
              <td className="p-2">{p.note || "-"}</td>
              <td className="p-2 space-x-2">
                <button onClick={() => openEdit(p)} className="px-2 py-1 bg-blue-500 text-white rounded">Editovat</button>
                <button onClick={() => confirmPreorder(p.id)} className="px-2 py-1 bg-green-500 text-white rounded">Převést</button>
                <button onClick={() => deletePreorder(p.id)} className="px-2 py-1 bg-red-500 text-white rounded">Zrušit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">Upravit předobjednávku #{editing.id}</h3>
              <button onClick={() => setEditing(null)} className="px-3 py-1 rounded border">Zavřít</button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm text-gray-700">Jméno</label>
                <input value={editing.name} onChange={(e) => setField("name", e.target.value)} className="w-full border rounded-xl p-2" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-gray-700">Telefon</label>
                  <input value={editing.phone} onChange={(e) => setField("phone", e.target.value)} className="w-full border rounded-xl p-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Email</label>
                  <input value={editing.email} onChange={(e) => setField("email", e.target.value)} className="w-full border rounded-xl p-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm text-gray-700">Standard</label>
                  <input type="number" min="0" value={editing.standardQty} onChange={(e) => setField("standardQty", Number(e.target.value||0))} className="w-full border rounded-xl p-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">LowChol</label>
                  <input type="number" min="0" value={editing.lowcholQty} onChange={(e) => setField("lowcholQty", Number(e.target.value||0))} className="w-full border rounded-xl p-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Celkem</label>
                  <input value={(Number(editing.standardQty||0)+Number(editing.lowcholQty||0))} readOnly className="w-full border rounded-xl p-2 bg-gray-50" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700">Místo vyzvednutí</label>
                <input value={editing.pickuplocation} onChange={(e) => setField("pickuplocation", e.target.value)} className="w-full border rounded-xl p-2" />
              </div>

              <div>
                <label className="block text-sm text-gray-700">Datum (DD.MM.YYYY)</label>
                <input value={editing.pickupdate} onChange={(e) => setField("pickupdate", e.target.value)} className="w-full border rounded-xl p-2" />
              </div>

              <div>
                <label className="block text-sm text-gray-700">Status</label>
                <select value={editing.status} onChange={(e) => setField("status", e.target.value)} className="w-full border rounded-xl p-2">
                  <option value="čeká">čeká</option>
                  <option value="čeká na potvrzení">čeká na potvrzení</option>
                  <option value="potvrzená">potvrzená</option>
                  <option value="zrušená">zrušená</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700">Poznámka</label>
                <textarea value={editing.note} onChange={(e) => setField("note", e.target.value)} className="w-full border rounded-xl p-2" />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-xl">Zrušit</button>
                <button onClick={saveEdit} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-xl">
                  {saving ? "Ukládám..." : "Uložit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
