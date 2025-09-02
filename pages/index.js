import Layout from "../components/Layout";
import { useState, useEffect } from "react";

export default function Home() {
  const [stock, setStock] = useState({ standard_quantity: 0, low_cholesterol_quantity: 0 });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [standardQty, setStandardQty] = useState(0);
  const [lowCholQty, setLowCholQty] = useState(0);
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json();
        setStock(data);
      } catch {
        setStock({ standard_quantity: 0, low_cholesterol_quantity: 0 });
      }
    }
    fetchStock();
  }, []);

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!name || !email || pickupLocation === "" || !pickupDate || (standardQty < 0 || lowCholQty < 0)) {
      alert("Vyplňte všechna povinná pole a zadejte množství větší nebo rovno 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          standardQty: Number(standardQty),
          lowCholQty: Number(lowCholQty),
          pickupLocation,
          pickupDate,
          phone
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Objednávka přijata! Zbývá Standard: ${data.remaining.standard_quantity}, Low Cholesterol: ${data.remaining.low_cholesterol_quantity}`);
        setStock(data.remaining);
        setStandardQty(0);
        setLowCholQty(0);
        setName("");
        setEmail("");
        setPickupLocation("");
        setPickupDate("");
        setPhone("");
      } else {
        alert(`Chyba: ${data.error}`);
      }
    } catch {
      alert("Chyba při odesílání objednávky.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">Vejce z malochovu</h1>
      <p className="text-gray-700 leading-relaxed mb-4">
        Vítejte na stránkách naší malé rodinné farmy. Nabízíme čerstvá vejce standardní i se sníženým obsahem cholesterolu.
      </p>

      <p className="mb-6 text-lg text-gray-700">
        🥚 Aktuálně k dispozici: <br/>
        Standard: <strong>{stock.standard_quantity}</strong> vajec <br/>
        Low Cholesterol: <strong>{stock.low_cholesterol_quantity}</strong> vajec
      </p>

      <form onSubmit={handleOrder} className="mb-8 flex flex-col gap-2 max-w-sm">
        <input type="text" placeholder="Jméno" value={name} onChange={(e) => setName(e.target.value)} className="border p-2 rounded" required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 rounded" required />

        <label>Množství Standard</label>
        <input type="number" min="0" value={standardQty} onChange={(e) => setStandardQty(e.target.value)} className="border p-2 rounded" />

        <label>Množství Low Cholesterol</label>
        <input type="number" min="0" value={lowCholQty} onChange={(e) => setLowCholQty(e.target.value)} className="border p-2 rounded" />

        <label>Místo vyzvednutí *</label>
        <select value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="border p-2 rounded" required>
          <option value="">Vyberte...</option>
          <option value="Dematic Ostrov u Stříbra 65">Dematic Ostrov u Stříbra 65</option>
          <option value="Honezovice">Honezovice</option>
        </select>

        <label>Datum vyzvednutí *</label>
        <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="border p-2 rounded" required />

        <label>Telefonní číslo</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="border p-2 rounded" />

        <button type="submit" disabled={loading} className="bg-yellow-400 text-gray-900 font-bold px-8 py-4 rounded-full shadow-lg hover:bg-yellow-500">
          {loading ? "Odesílám..." : "🥚 Objednat vajíčka"}
        </button>
      </form>
    </Layout>
  );
}
