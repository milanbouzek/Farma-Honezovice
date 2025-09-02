import { useState, useEffect } from "react";

export default function OrderForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pickupLocation, setPickupLocation] = useState("");
  const [remaining, setRemaining] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json();
        setRemaining(data.quantity);
      } catch {
        setRemaining(0);
      }
    }
    fetchStock();
  }, []);

  const handleSubmit = async (e) => {
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
        body: JSON.stringify({ 
          name, 
          email, 
          quantity: Number(quantity),
          pickupLocation 
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Objednávka přijata! Zbývá vajec: ${data.remaining}`);
        setRemaining(data.remaining);
        setName("");
        setEmail("");
        setQuantity(1);
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
    <div className="mt-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-sm">
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
          <option value="">-- Vyberte místo vyzvednutí --</option>
          <option value="Dematic Ostrov u Stříbra 65">
            Dematic Ostrov u Stříbra 65
          </option>
          <option value="Honezovice">Honezovice</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-400 text-gray-900 font-bold px-8 py-4 rounded-full shadow-lg hover:bg-yellow-500"
        >
          {loading ? "Odesílám..." : "Odeslat objednávku"}
        </button>
      </form>
      {remaining !== null && (
        <p className="mt-2 text-gray-700">Zbývá vajec: {remaining}</p>
      )}
    </div>
  );
}
