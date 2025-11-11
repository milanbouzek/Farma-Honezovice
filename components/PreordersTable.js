import React from "react";
import toast from "react-hot-toast";

export default function PreordersTable({ preorders, refresh }) {

  const confirmPreorder = async (id) => {
    try {
      const res = await fetch("/api/preorders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Předobjednávka byla převedena do objednávek");
      refresh();
    } catch (err) {
      toast.error("Chyba: " + err.message);
    }
  };

  const deletePreorder = async (id) => {
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

  return (
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
            <th className="p-2">Akce</th>
          </tr>
        </thead>
        <tbody>
          {preorders.map((p) => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{p.id}</td>
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.phone}</td>
              <td className="p-2">{p.email || "-"}</td>
              <td className="p-2">{p.quantity}</td>
              <td className="p-2">{p.note || "-"}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => confirmPreorder(p.id)}
                  className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                >
                  Převést
                </button>
                <button
                  onClick={() => deletePreorder(p.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Zrušit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
