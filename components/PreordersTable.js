import React, { useState } from "react";
import toast from "react-hot-toast";
import PreorderEditModal from "./PreorderEditModal"; // nový modal

const STATUSES = ["nová", "potvrzená"];

export default function PreordersTable({ preorders, refresh }) {
  const [editing, setEditing] = useState(null);

  // změna statusu
  const advanceStatus = async (id, currentStatus) => {
    const nextStatus =
      STATUSES[(STATUSES.indexOf(currentStatus) + 1) % STATUSES.length];

    try {
      const res = await fetch("/api/preorders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Status změněn");
      refresh();
    } catch (err) {
      toast.error("Chyba: " + err.message);
    }
  };

  // převod do objednávek
  const convertPreorder = async (id) => {
    try {
      const res = await fetch("/api/preorders/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Předobjednávka převedena do objednávek");
      refresh();
    } catch (err) {
      toast.error("Chyba: " + err.message);
    }
  };

  // smazání
  const deletePreorder = async (id) => {
    if (!confirm("Opravdu chcete zrušit předobjednávku?")) return;

    try {
      const res = await fetch("/api/preorders/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Předobjednávka byla zrušena");
      refresh();
    } catch (err) {
      toast.error("Chyba: " + err.message);
    }
  };

  const renderRow = (p) => {
    const total = (p.standardQty || 0) + (p.lowcholQty || 0);

    return (
      <tr key={p.id} className="border-b hover:bg-gray-50">
        <td className="p-2">{p.id}</td>
        <td className="p-2">{p.name}</td>
        <td className="p-2">{p.phone || "-"}</td>
        <td className="p-2">{p.email || "-"}</td>

        <td className="p-2 font-semibold">{total} ks</td>

        <td className="p-2">{p.note || "-"}</td>

        <td className="p-2">{p.status}</td>

        <td className="p-2 flex flex-col gap-1">
          <button
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            onClick={() => setEditing(p)}
          >
            Editovat
          </button>

          <button
            className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
            onClick={() => advanceStatus(p.id, p.status)}
          >
            Další stav
          </button>

          <button
            className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
            onClick={() => convertPreorder(p.id)}
          >
            Převést na objednávku
          </button>

          <button
            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            onClick={() => deletePreorder(p.id)}
          >
            Zrušit
          </button>
        </td>
      </tr>
    );
  };

  return (
    <>
      {editing && (
        <PreorderEditModal
          preorder={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Jméno</th>
              <th className="p-2">Telefon</th>
              <th className="p-2">Email</th>
              <th className="p-2">Množství</th>
              <th className="p-2">Poznámka</th>
              <th className="p-2">Status</th>
              <th className="p-2">Akce</th>
            </tr>
          </thead>

          <tbody>{preorders.map(renderRow)}</tbody>
        </table>
      </div>
    </>
  );
}
