import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { X } from "lucide-react";

export default function PreorderForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    standardQty: "",
    lowcholQty: "",
    pickupLocation: "",
  });

  const [loading, setLoading] = useState(false);
  const [totalPreordered, setTotalPreordered] = useState(0);

  const MAX_PER_ORDER = 20;
  const MAX_TOTAL = 100;

  // Načtení aktuálního celkového počtu předobjednávek
  useEffect(() => {
    const fetchTotal = async () => {
      try {
        const res = await fetch("/api/preorders/total");
        const data = await res.json();
        if (data.total !== undefined) setTotalPreordered(data.total);
      } catch (err) {
        console.error("Error fetching total preorders:", err);
      }
    };
    fetchTotal();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "standardQty" || name === "lowcholQty"
          ? value === ""
            ? ""
            : parseInt(value, 10)
          : value,
    }));
  };

  const handleAdd = (field, amount) => {
    setFormData((prev) => {
      const cur = parseInt(prev[field] || 0, 10);
      return { ...prev, [field]: Math.min(cur + amount, MAX_PER_ORDER) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const standardQty = parseInt(formData.standardQty || 0, 10);
    const lowcholQty = parseInt(formData.lowcholQty || 0, 10);
    const orderTotal = standardQty + lowcholQty;

    // Validace
    if (!formData.name || !formData.pickupLocation) {
      toast.error("❌ Vyplňte jméno a místo vyzvednutí.");
      return;
    }

    if (orderTotal === 0) {
      toast.error("❌ Zadejte počet vajec.");
      return;
    }

    if (orderTotal > MAX_PER_ORDER) {
      toast.error(`❌ Nelze objednat více než ${MAX_PER_ORDER} ks na jednu objednávku.`);
      return;
    }

    if (totalPreordered + orderTotal > MAX_TOTAL) {
      toast.error(`❌ Celkový limit předobjednávek je ${MAX_TOTAL} ks. Aktuálně dostupných: ${MAX_TOTAL - totalPreordered}`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/preorders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          standardQty,
          lowcholQty,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.custom((t) => (
          <div
            className={`bg-white shadow-lg rounded-2xl p-5 max-w-md w-full relative ${
              t.visible ? "animate-enter" : "animate-leave"
            }`}
          >
            <button
              onClick={() => toast.dismiss(t.id)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-2">✅ Předobjednávka byla úspěšně odeslána</h3>
            <p className="mb-1">Celkem objednáno: {orderTotal} ks</p>
            <p className="mb-1">Místo vyzvednutí: {formData.pickupLocation}</p>
          </div>
        ), { duration: 5000 });

        // reset formuláře
        setFormData({
          name: "",
          email: "",
          phone: "",
          standardQty: "",
          lowcholQty: "",
          pickupLocation: "",
        });

        // aktualizace celkového počtu
        setTotalPreordered((prev) => prev + orderTotal);
      } else {
        toast.error("❌ Chyba při odesílání předobjednávky.");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Chyba při odesílání předobjednávky.");
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
        {/* Jméno */}
        <div>
          <label className="block text-gray-700 mb-1">Jméno a příjmení *</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Zadejte celé jméno"
            className="w-full border rounded-xl p-2"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="např. jan.novak@email.cz"
            className="w-full border rounded-xl p-2"
          />
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-gray-700 mb-1">Telefon</label>
          <input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+420 123 456 789"
            className="w-full border rounded-xl p-2"
          />
        </div>

        {/* Místo vyzvednutí */}
        <div>
          <label className="block text-gray-700 mb-1">Místo vyzvednutí *</label>
          <div className="flex flex-wrap gap-2">
            {["Dematic Ostrov u Stříbra 65", "Honezovice"].map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, pickupLocation: loc }))}
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

        {/* Počet vajec */}
        <div>
          <label className="block text-gray-700 mb-1">Počet standardních vajec</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="standardQty"
              value={formData.standardQty}
              onChange={handleChange}
              min="0"
              placeholder="0"
              className="w-full border rounded-xl p-2"
            />
            <button type="button" onClick={() => handleAdd("standardQty", 5)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+5</button>
            <button type="button" onClick={() => handleAdd("standardQty", 10)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+10</button>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Počet vajec se sníženým cholesterolem</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="lowcholQty"
              value={formData.lowcholQty}
              onChange={handleChange}
              min="0"
              placeholder="0"
              className="w-full border rounded-xl p-2"
            />
            <button type="button" onClick={() => handleAdd("lowcholQty", 5)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+5</button>
            <button type="button" onClick={() => handleAdd("lowcholQty", 10)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+10</button>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-400 w-full px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 transform transition"
          >
            {loading ? "Odesílám..." : "Odeslat předobjednávku"}
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Celkově předobjednáno: {totalPreordered}/{MAX_TOTAL} ks
        </p>
      </form>
    </div>
  );
}
