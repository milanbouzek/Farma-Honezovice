import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import OrderEditModal from "./OrderEditModal";

const STATUSES = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];

export default function OrdersTable({ orders, refreshOrders }) {
  const [expanded, setExpanded] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // načíst uložený stav rozbalení z localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ordersExpanded");
      if (stored === "true") setExpanded(true);
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleExpanded = () => {
    const newState = !expanded;
    setExpanded(newState);
    try {
      localStorage.setItem("ordersExpanded", newState);
    } catch (e) {}
  };

  // postup stavu objednávky (POST /api/admin/orders)
  const advanceStatus = async (id) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Status změněn na: ${data.status}`);
        refreshOrders();
      } else {
        toast.error("Chyba: " + (data.error || JSON.stringify(data)));
      }
    } catch (err) {
      toast.error("Chyba při změně statusu: " + (err.message || err));
    }
  };

  // přepnutí zaplaceno (POST /api/admin/toggle-paid)
  const togglePaid = async (id, currentState) => {
    try {
      const res = await fetch("/api/admin/toggle-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, paid: !currentState }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.paid ? "💰 Objednávka označena jako zaplacená" : "❌ Platba zrušena");
        refreshOrders();
      } else {
        toast.error("Nepodařilo se změnit stav platby");
      }
    } catch (err) {
      toast.error("Chyba při komunikaci se serverem: " + (err.message || err));
    }
  };

  // vynulovat cenu (POST /api/admin/reset-price)
  const resetPrice = async (id) => {
    try {
      const res = await fetch("/api/admin/reset-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("💸 Cena objednávky byla vynulována");
        refreshOrders();
      } else {
        toast.error("Nepodařilo se vynulovat cenu");
      }
    } catch (err) {
      toast.error("Chyba při komunikaci se serverem: " + (err.message || err));
    }
  };

  // otevřít modal pro editaci
  const handleEdit = (order) => {
    setEditingOrder(order);
    setModalOpen(true);
  };

  const renderRow = (order) => {
    let bgColor = "";
    if (order.status === "nová objednávka") bgColor = "bg-red-50";
    if (order.status === "zpracovává se") bgColor = "bg-yellow-50";
    if (["vyřízená", "zrušená"].includes(order.status)) bgColor = "bg-gray-50";
    if (order.paid) bgColor = "bg-green-50";

    return (
      <tr key={order.id} className={`${bgColor} border-b`}>
        <td className="p-2 text-sm">{order.id}</td>

        <td className="p-2 text-sm">
          <div className="flex items-center gap-2">
            <span>{order.customer_name}</span>
            {order.paid && <span title="Zaplaceno">💰</span>}
          </div>
        </td>

        <td className="p-2 text-sm">{order.email || "-"}</td>
        <td className="p-2 text-sm">{order.phone || "-"}</td>

        <td className="p-2 text-right text-sm">{order.standard_quantity ?? 0}</td>
        <td className="p-2 text-right text-sm">{order.low_chol_quantity ?? 0}</td>

        <td className="p-2 text-sm">{order.pickup_location || "-"}</td>

        <td className="p-2 text-sm">
          {order.pickup_date ? String(order.pickup_date).slice(0, 10) : "-"}
        </td>

        <td className="p-2 text-right text-sm font-medium">
          {order.payment_total !== null && order.payment_total !== undefined
            ? `${Number(order.payment_total).toFixed(2)} Kč`
            : "-"}
        </td>

        <td className="p-2 text-center">
          <input
            aria-label={`paid-${order.id}`}
            type="checkbox"
            checked={!!order.paid}
            onChange={() => togglePaid(order.id, !!order.paid)}
          />
        </td>

        <td className="p-2 flex flex-wrap gap-2 justify-center">
          {order.status !== STATUSES[STATUSES.length - 1] && (
            <button
              onClick={() => advanceStatus(order.id)}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
            >
              Další stav
            </button>
          )}

          <button
            onClick={() => handleEdit(order)}
            className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 text-sm"
          >
            Upravit
          </button>

          <button
            onClick={() => resetPrice(order.id)}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
          >
            Vynulovat cenu
          </button>
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
      <h2 className="text-xl font-bold mb-4">Seznam objednávek</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Jméno</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Telefon</th>
              <th className="p-2 text-right">Standard</th>
              <th className="p-2 text-right">LowChol</th>
              <th className="p-2 text-left">Místo</th>
              <th className="p-2 text-left">Datum</th>
              <th className="p-2 text-right">Cena</th>
              <th className="p-2 text-center">Zaplaceno</th>
              <th className="p-2 text-center">Akce</th>
            </tr>
          </thead>
          <tbody>{activeOrders.map(renderRow)}</tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={toggleExpanded}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          {expanded ? "Skrýt vyřízené a zrušené" : "Zobrazit vyřízené a zrušené"}
        </button>

        <div className="text-sm text-gray-500">
          Aktivních: {activeOrders.length} • Dokončených: {finishedOrders.length}
        </div>
      </div>

      {expanded && (
        <div className="overflow-x-auto mt-3">
          <table className="min-w-full bg-white rounded-xl overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Jméno</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Telefon</th>
                <th className="p-2 text-right">Standard</th>
                <th className="p-2 text-right">LowChol</th>
                <th className="p-2 text-left">Místo</th>
                <th className="p-2 text-left">Datum</th>
                <th className="p-2 text-right">Cena</th>
                <th className="p-2 text-center">Zaplaceno</th>
                <th className="p-2 text-center">Akce</th>
              </tr>
            </thead>
            <tbody>{finishedOrders.map(renderRow)}</tbody>
          </table>
        </div>
      )}

      {modalOpen && editingOrder && (
        <OrderEditModal
          order={editingOrder}
          onClose={() => {
            setModalOpen(false);
            setEditingOrder(null);
          }}
          onSaved={() => {
            setModalOpen(false);
            setEditingOrder(null);
            refreshOrders();
          }}
        />
      )}
    </div>
  );
}
