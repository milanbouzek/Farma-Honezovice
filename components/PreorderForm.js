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
      return { ...prev, quantity: Math.min(Math.max(0, cur + amount), 20) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (limitReached) {
      toast.error("❌ Už není možné vytvářet další předobjednávky (100/100).");
      return;
    }

    const qty = parseInt(formData.quantity || 0, 10);

    if (!formData.name || qty <= 0) {
      toast.error("❌ Vyplňte jméno a počet vajec.");
      return;
    }

    if (qty > 20) {
      toast.error("❌ Maximální počet na jednu předobjednávku je 20 ks.");
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
      toast.error("❌ Chyba připojení.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <Toaster position="top-center" />

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 space-y-5"
      >
        <h2 className="text-2xl font-bold text-center text-green-800">
          Předobjednávkový formulář
        </h2>

        <p className="text-center text-gray-600">
          Aktuálně předobjednáno:{" "}
          <strong className="text-blue-600">{currentTotal}/100</strong> ks
        </p>

        {limitReached && (
          <p className="text-center text-red-600 font-bold">
            Limit 100 ks byl dosažen. Nelze vytvořit další předobjednávku.
          </p>
        )}

        {!limitReached && (
          <>
            {/* Jméno */}
            <div>
              <label className="block text-gray-700 mb-1">
                Jméno a příjmení *
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border rounded-2xl p-3"
                placeholder="Zadejte celé jméno"
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-gray-700 mb-1">Telefon</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                type="tel"
                className="w-full border rounded-2xl p-3"
                placeholder="+420…"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 mb-1">Email</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                className="w-full border rounded-2xl p-3"
                placeholder="jan@domena.cz"
              />
            </div>

            {/* Počet vajec */}
            <div>
              <label className="block text-gray-700 mb-1">
                Počet vajec *
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  className="w-full border rounded-2xl p-3"
                />
                <button
                  type="button"
                  onClick={() => handleAdd(5)}
                  className="bg-yellow-400 px-4 py-2 rounded-2xl font-semibold hover:bg-yellow-500"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => handleAdd(10)}
                  className="bg-yellow-400 px-4 py-2 rounded-2xl font-semibold hover:bg-yellow-500"
                >
                  +10
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Max. 20 ks na jednu předobjednávku.
              </p>
            </div>

            {/* Poznámka */}
            <div>
              <label className="block text-gray-700 mb-1">Poznámka</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                className="w-full border rounded-2xl p-3 h-24"
                placeholder="Doplňující informace (nepovinné)"
              ></textarea>
            </div>

            {/* Odeslání */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="bg-yellow-400 w-full px-6 py-3 rounded-2xl font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 transform transition"
              >
                {loading ? "Odesílám..." : "Odeslat předobjednávku"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
