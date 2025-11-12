import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function PreorderForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    quantity: "",
    note: "",
  });

  const [currentTotal, setCurrentTotal] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [loading, setLoading] = useState(false);

  // Načtení aktuálního počtu ks
  const fetchLimit = async () => {
    try {
      const res = await fetch("/api/preorders");
      const data = await res.json();
      if (res.ok) {
        setCurrentTotal(data.total || 0);
        setLimitReached((data.total || 0) >= 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLimit();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "quantity"
          ? value === "" ? "" : parseInt(value, 10)
          : value,
    }));
  };

  const handleAdd = (amount) => {
    setFormData((prev) => {
      const cur = parseInt(prev.quantity || 0, 10);
      return { ...prev, quantity: Math.min(Math.max(cur + amount, 0), 20) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const qty = Number(formData.quantity);

    if (limitReached) {
      toast.error("❌ Limit 100 ks byl dosažen. Nelze předobjednat.");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("❌ Zadejte jméno a příjmení.");
      return;
    }

    if (!qty || isNaN(qty) || qty <= 0) {
      toast.error("❌ Zadejte počet vajec (1–20).");
      return;
    }

    if (qty > 20) {
      toast.error("❌ Maximální počet vajec na jednu předobjednávku je 20 ks.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/preorders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("✅ Předobjednávka byla úspěšně odeslána!");
        setFormData({
          name: "",
          phone: "",
          email: "",
          quantity: "",
          note: "",
        });
        fetchLimit();
      } else {
        toast.error(data.error || "❌ Došlo k chybě při odesílání.");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Chyba připojení k serveru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <Toaster position="top-center" />

      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-90 shadow-xl rounded-2xl p-6 space-y-4 backdrop-blur-sm"
      >
        <h2 className="text-3xl font-bold text-green-700 text-center mb-2">
          🥚 Předobjednávka vajec
        </h2>

        <p className="text-center text-gray-700 mb-4">
          Aktuálně předobjednáno:{" "}
          <strong className="text-blue-600">{currentTotal}/100</strong> ks
        </p>

        {limitReached ? (
          <p className="text-center text-red-600 font-semibold">
            Limit 100 ks byl dosažen. Předobjednávky jsou uzavřeny.
          </p>
        ) : (
          <>
            <div>
              <label className="block text-gray-800 mb-1">
                Jméno a příjmení *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-green-400"
                placeholder="Zadejte celé jméno"
              />
            </div>

            <div>
              <label className="block text-gray-800 mb-1">Telefon</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-green-400"
                placeholder="+420…"
              />
            </div>

            <div>
              <label className="block text-gray-800 mb-1">E-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-green-400"
                placeholder="např. jan@domena.cz"
              />
            </div>

            <div>
              <label className="block text-gray-800 mb-1">
                Počet vajec *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-green-400"
                />
                <button
                  type="button"
                  onClick={() => handleAdd(5)}
                  className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => handleAdd(10)}
                  className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500"
                >
                  +10
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Max. 20 ks na jednu předobjednávku.
              </p>
            </div>

            <div>
              <label className="block text-gray-800 mb-1">Poznámka</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                className="w-full border rounded-xl p-2 h-20 focus:ring-2 focus:ring-green-400"
                placeholder="Např. preferovaný termín odběru..."
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-400 w-full px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 transform transition"
            >
              {loading ? "Odesílám..." : "Odeslat předobjednávku"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
