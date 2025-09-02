import Layout from "../components/Layout";
import { useState, useEffect } from "react";

export default function Home() {
  const [eggs, setEggs] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pickupLocation, setPickupLocation] = useState(""); // nové pole
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchEggs() {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json();
        setEggs(data.quantity);
      } catch {
        setEggs(0);
      }
    }
    fetchEggs();
  }, []);

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!name || !email || quantity < 1 || !pickupLocation) {
      alert("Vyplňte všechna pole a zadejte počet vajec větší než 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, quantity: Number(quantity), pickup_location: pickupLocation }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Objednávka přijata! Zbývá vajec: ${data.remaining}`);
        setEggs(data.remaining);
        setQuantity(1);
        setName("");
        setEmail("");
        setPickupLocation("");
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
      <p className="mb-6 text-lg text-gray-700">
        🥚 Aktuálně k dispozici: <strong>{eggs}</strong> vajec
      </p>

      <form onSubmit={handleOrder} className="mb-8 flex flex-col gap-2 max-w-sm">
        <input
          type="text"
          placeholder="Jméno"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="number"
          min="1"
          placeholder="Počet vajec"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <select
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          className="border p-2 rounded"
          required
        >
          <option value="">Vyberte místo vyzvednutí</option>
          <option value="Dematic Ostrov u Stříbra 65">Dematic Ostrov u Stříbra 65</option>
          <option value="Honezovice">Honezovice</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-400 text-gray-900 font-bold px-8 py-4 rounded-full shadow-lg hover:bg-yellow-500"
        >
          {loading ? "Odesílám..." : "🥚 Objednat vajíčka"}
        </button>
      </form>
    </Layout>
  );
}
