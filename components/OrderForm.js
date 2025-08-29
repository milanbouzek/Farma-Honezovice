import { useState, useEffect } from "react";

export default function OrderForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [remaining, setRemaining] = useState(null);
  const [loading, setLoading] = useState(false);

  // Načtení aktuálního stavu vajec při načtení stránky
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
    if (!name || !email || quantity < 1) {
      alert("Vyplňte všechna pole a zadejte počet vajec větší než 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, quantity: Number(quantity) }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Objednávka přijata! Zbývá vajec: ${data.remaining}`);
        setRemaining(data.remaining);
        setName("");
        setEmail("");
        setQuantity(1);
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
    <div>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Jméno"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Odesílám..." : "Odeslat objednávku"}
        </button>
      </form>
      {remaining !== null && <p>Zbývá vajec: {remaining}</p>}
    </div>
  );
}
