import { useState } from "react";
import toast from "react-hot-toast";

const STATUSES = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];

export default function OrdersTable({ orders, refreshOrders }) {
  const [expanded, setExpanded] = useState(false);

  const advanceStatus = async (id) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      toast.success(`Status změněn na: ${data.status}`);
      refreshOrders();
    } catch (err) {
      toast.error("Chyba při změně statusu: " + err.message);
    }
  };

  const renderRow = (order) => {
    let bgColor = "";
    if (order.status === "nová objednávka") bgColor = "bg-red-100";
    if (order.status === "zpracovává se") bgColor = "bg-yellow-100";
    if (["vyřízená", "zrušená"].includes(order.status)) bgColor = "bg-green-100";

    return (
      <tr key={order.id} className={`${bgColor} border-b`}>
        <td className="p-2">{order.id}</td>
        <td className="p-2">{order.customer_name}</td>
        <td className="p-2">{order.email || "-"}</td>
        <td className="p-2">{order.phone || "-"}</td>
        <td className="p-2">{order.standard_quantity}</td>
        <td className="p-2">{order.low_chol_quantity}</td>
        <td className="p-2">{order.pickup_location}</td>
        <td className="p-2">{order.pickup_date}</td>
        <td className="p-2">
          {order.status !== STATUSES[STATUSES.length - 1] && (
            <button
              onClick={() => advanceStatus(order.id)}
              className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              Další stav
            </button>
          )}
        </td>
      </tr>
    );
  };

  const activeOrders = orders.filter((o) =>
    ["nová objednávka", "zpracovává se"].includes(o.status)
  );
  const finishedOrders = orders.filter((o) =>
    ["vyřízená", "zrušená"].includes(o.status)
  );

  return (
    <div className="bg-white shadow rounded-xl p-4 mb-6">
      <h2 className="text-xl font-bold mb-4">Aktivní objednávky</h2>
      <table className="min-w-full bg-white rounded-xl overflow-hidden">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">ID</th>
            <th className="p-2">Jméno</th>
            <th className="p-2">Email</th>
            <th className="p-2">Telefon</th>
            <th className="p-2">Standard</th>
            <th className="p-2">LowChol</th>
            <th className="p-2">Místo</th>
            <th className="p-2">Datum</th>
            <th className="p-2">Akce</th>
          </tr>
        </thead>
        <tbody>{activeOrders.map(renderRow)}</tbody>
      </table>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 px-4 py-1 bg-gray-300 rounded"
      >
        {expanded ? "Skrýt vyřízené a zrušené" : "Zobrazit vyřízené a zrušené"}
      </button>

      {expanded && (
        <table className="min-w-full bg-white rounded-xl overflow-hidden mt-2">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Jméno</th>
              <th className="p-2">Email</th>
              <th className="p-2">Telefon</th>
              <th className="p-2">Standard</th>
              <th className="p-2">LowChol</th>
              <th className="p-2">Místo</th>
              <th className="p-2">Datum</th>
              <th className="p-2">Akce</th>
            </tr>
          </thead>
          <tbody>{finishedOrders.map(renderRow)}</tbody>
        </table>
      )}
    </div>
  );
}
