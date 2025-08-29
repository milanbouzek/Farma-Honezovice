import { useState, useEffect } from "react";

export default function OrderForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [remaining, setRemaining] = useState(null);

  // Načtení aktuálního stavu vajec při načtení stránky
  useEffect(() => {
    async function fetchStock() {
      const res = await fetch("/api/stock");
      const data = await res.json();
      setRemaining(data.quantity);
    }
    fetchStock();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, quantity: Number(quantity) }),
    });
    const data = await res.json();
    if (data.success) {
      alert(`Objednávka přijata! Zbývá vajec: ${data.remaining}`);
      setRemaining(data.remaining);
    } else {
      alert(`Chyba: ${data.error}`);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input placeholder="Jméno" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <button type="submit">Odeslat objednávku</button>
      </form>
      {remaining !== null && <p>Zbývá vajec: {remaining}</p>}
    </div>
  );
}
