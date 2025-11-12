import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function PreorderForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    standardQty: "",
    lowcholQty: "",
    pickupLocation: "",
    note: "",
  });

  const [currentTotal, setCurrentTotal] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [loading, setLoading] = useState(false);

  const MAX_PER_ORDER = 20;
  const MAX_TOTAL = 100;

  // Načtení aktuálního počtu ks
  const fetchLimit = async () => {
    try {
      const res = await fetch("/api/preorders");
      const data = await res.json();
      if (res.ok) {
        setCurrentTotal(data.total || 0);
        setLimitReached((data.total || 0) >= MAX_TOTAL);
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
        name === "standardQty" || name === "lowcholQty"
          ? value === "" ? "" : parseInt(value, 10)
          : value,
    }));
  };

  const handleAdd = (field, amount) => {
    setFormData((prev) => {
      const cur = parseInt(prev[field] || 0, 10);
      return { ...prev, [field]: Math.min(Math.max(cur + amount, 0), MAX_PER_ORDER) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const standardQty = parseInt(formData.standardQty || 0, 10);
    const lowcholQty = parseInt(formData.lowcholQty || 0, 10);
    const totalQty = standardQty + lowcholQty;

    if (limitReached) {
      toast.error(`❌ Celkový limit ${MAX_TOTAL} ks byl dosažen.`);
      return;
    }

    // Povinná pole
    if (!formData.name.trim()) {
      toast.error("❌ Zadejte jméno a příjmení.");
      return;
    }

    if (!formData.pickupLocation) {
      toast.error("❌ Vyberte místo vyzvednutí.");
      return;
    }

    if (totalQty <= 0) {
      toast.error("❌ Zadejte počet vajec.");
      return;
    }

    if (totalQty > MAX_PER_ORDER) {
      toast.error(`❌ Max. ${MAX_PER_ORDER} ks na jednu předobjednávku.`);
      return;
    }

    if (currentTotal + totalQty > MAX_TOTAL) {
      toast.error(`❌ Celkový limit ${MAX_TOTAL} ks překročen. Aktuálně dostupných: ${MAX_TOTAL - currentTotal} ks.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/preorders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          pickupLocation: formData.pickupLocation,
          standardQty,
          lowcholQty,
          note: formData.note || null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("✅ Předobjednávka byla úspěšně odeslána!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          standardQty: "",
          lowcholQty: "",
          pickupLocation: "",
          note: "",
        });
        fetchLimit();
      } else {
        toast.error(data.error || "❌ Chyba při odesílání předobjednávky.");
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
        className="bg-white shadow-lg rounded-2xl p-6 space-y-4"
      >
        <h2 className="text-3xl font-bold text-green-700 text-center mb-2">
          🥚 Předobjednávka vajec
        </h2>

        <p className="text-center text-gray-700 mb-4">
          Aktuálně předobjednáno: <strong className="text-blue-600">{currentTotal}/{MAX_TOTAL}</strong> ks
        </p>

        {limitReached && (
          <p className="text-center text-red-600 font-semibold">
            Limit {MAX_TOTAL} ks byl dosažen. Předobjednávky jsou uzavřeny.
          </p>
        )}

        {/* Jméno */}
        <div>
          <label className="block text-gray-800 mb-1">Jméno a příjmení *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-green-400"
            placeholder="Zadejte celé jméno"
          />
        </div>

        {/* Telefon */}
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

        {/* Email */}
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

        {/* Počet standardních vajec */}
        <div>
          <label className="block text-gray-800 mb-1">Počet standardních vajec</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="standardQty"
              value={formData.standardQty}
              onChange={handleChange}
              min="0"
              max={MAX_PER_ORDER}
              className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-green-400"
            />
            <button
              type="button"
              onClick={() => handleAdd("standardQty", 5)}
              className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500"
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => handleAdd("standardQty", 10)}
              className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500"
            >
              +10
            </button>
          </div>
        </div>

        {/* Počet vajec se sníženým cholesterolem */}
        <div>
          <label className="block text-gray-800 mb-1">Počet vajec se sníženým cholesterolem</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="lowcholQty"
              value={formData.lowcholQty}
              onChange={handleChange}
              min="0"
              max={MAX_PER_ORDER}
              className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-green-400"
            />
            <button
              type="button"
              onClick={() => handleAdd("lowcholQty", 5)}
              className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500"
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => handleAdd("lowcholQty", 10)}
              className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500"
            >
              +10
            </button>
          </div>
        </div>

        {/* Místo vyzvednutí */}
        <div>
          <label className="block text-gray-800 mb-1">Místo vyzvednutí *</label>
          <div className="flex flex-wrap gap-2">
            {["Dematic Ostrov u Stříbra 65", "Honezovice"].map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, pickupLocation: loc }))}
                className={`px-4 py-2 rounded-xl font-semibold shadow-md ${
                  formData.pickupLocation === loc
                    ? "bg-green-500 text-white"
                    : "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Poznámka */}
        <div>
          <label className="block text-gray-800 mb-1">Poznámka</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Nepovinné pole – např. preferovaný termín odběru..."
            className="w-full border rounded-xl p-2 h-20 focus:ring-2 focus:ring-green-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading || limitReached}
          className="bg-yellow-400 w-full px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 transform transition"
        >
          {loading ? "Odesílám..." : "Odeslat předobjednávku"}
        </button>
      </form>
    </div>
  );
}
