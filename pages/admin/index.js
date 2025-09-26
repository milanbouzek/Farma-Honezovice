import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "tajneheslo";
const STATUSES = ["nová objednávka", "zpracovává se", "vyřízená", "zrušená"];

function StockBox() {
  const [stock, setStock] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [standard, setStandard] = useState(0);
  const [lowChol, setLowChol] = useState(0);

  const fetchStock = async () => {
    try {
      const res = await fetch("/api/stock");
      const data = await res.json();
      setStock(data);
      setStandard(data.standardQuantity);
      setLowChol(data.lowCholQuantity);
    } catch (err) {
      toast.error("Chyba při načítání skladu: " + err.message);
    }
  };

  const saveStock = async () => {
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standard_quantity: standard,
          low_chol_quantity: lowChol,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStock(data);
        setEditMode(false);
        toast.success("Sklad úspěšně aktualizován");
      } else {
        toast.error(data.error || "Chyba při ukládání");
      }
    } catch (err) {
      toast.error("Chyba při ukládání: " + err.message);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  if (!stock) return <p>Načítám sklad...</p>;

  return (
    <div className="bg-white shadow p-4 rounded-xl mb-6">
      <h2 className="text-xl font-bold mb-2">Stav skladu</h2>
      {editMode ? (
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm">Standard</label>
            <input
              type="number"
              value={standard}
              onChange={(e) => setStandard(Number(e.target.value))}
              className="border rounded px-2 py-1 w-24"
            />
          </div>
          <div>
            <label className="block text-sm">LowChol</label>
            <input
              type="number"
              value={lowChol}
              onChange={(e) => setLowChol(Number(e.target.value))}
              className="border rounded px-2 py-1 w-24"
            />
          </div>
          <button
            onClick={saveStock}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            Uložit
          </button>
          <button
            onClick={() => setEditMode(false)}
            className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
          >
            Zrušit
          </button>
        </div>
      ) : (
        <div className="flex gap-6 items-center">
          <p>
            <b>Standard:</b> {stock.standardQuantity}
          </p>
          <p>
            <b>LowChol:</b> {stock.lowCholQuantity}
          </p>
          <button
            onClick={() => setEditMode(true)}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Aktualizovat stav
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data.orders);
    } catch (err) {
      toast.error("Chyba při načítání objednávek: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      fetchOrders();
    } else {
      toast.error("❌ Špatné heslo");
    }
  };

  useEffect(() => {
    if (authenticated) {
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Toaster position="top-center" />
        <h1 className="text-2xl font-bold mb-4">Admin přihlášení</h1>
        <input
          type="password"
          placeholder="Zadejte heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded mb-2 w-64"
        />
        <button
          onClick={handleLogin}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Přihlásit se
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">Seznam objednávek</h1>

      {/* 🔹 Box se skladem */}
      <StockBox />

      {loading ? (
        <p>Načítám objednávky...</p>
      ) : orders.length === 0 ? (
        <p>Žádné objednávky</p>
      ) : (
        <div className="bg-white shadow rounded-xl p-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex justify-between items-center border-b py-2"
            >
              <div>
                <p>
                  <b>ID:</b> {order.id}
                </p>
                <p>
                  <b>Status:</b> {order.status}
                </p>
                <p>
                  <b>Jméno:</b> {order.name}
                </p>
                <p>
                  <b>Telefon:</b> {order.phone}
                </p>
                <p>
                  <b>Standard:</b> {order.standard_quantity}
                </p>
                <p>
                  <b>LowChol:</b> {order.low_chol_quantity}
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/admin/orders", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: order.id }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      toast.success(
                        `Objednávka ${order.id} → ${data.status}`
                      );
                      fetchOrders();
                    } else {
                      toast.error(data.error || "Chyba při změně stavu");
                    }
                  } catch (err) {
                    toast.error("Chyba: " + err.message);
                  }
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Posunout stav
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
