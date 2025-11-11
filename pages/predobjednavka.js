import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function PreorderPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !phone || quantity <= 0) {
      toast.error("Vyplňte prosím všechna povinná pole.");
      return;
    }

    if (quantity > 20) {
      toast.error("Na jednu předobjednávku lze objednat maximálně 20 ks.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/preorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          quantity,
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Chyba při odeslání předobjednávky");
        setLoading(false);
        return;
      }

      toast.success("Předobjednávka byla úspěšně odeslána ✅");

      // Reset formuláře
      setName("");
      setPhone("");
      setEmail("");
      setQuantity(0);
      setNote("");

    } catch (err) {
      toast.error("Nastala chyba při odesílání");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <Toaster position="top-center" />

      <h1 className="text-3xl font-bold mb-6">
        🥚 Předobjednávka vajec
      </h1>
      <p className="mb-6 text-gray-700">
        Vyplňte formulář a my vás budeme kontaktovat, jakmile budou vejce k dispozici.
        Maximálně lze předobjednat <strong>20 ks</strong>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 shadow rounded-xl">

        <div>
          <label className="block font-semibold">Jméno a příjmení *</label>
          <input
            type="text"
            className="border rounded w-full p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-semibold">Telefon *</label>
          <input
            type="tel"
            className="border rounded w-full p-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-semibold">Email (nepovinné)</label>
          <input
            type="email"
            className="border rounded w-full p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-semibold">Počet vajec *</label>
          <input
            type="number"
            className="border rounded w-full p-2"
            value={quantity}
            min="1"
            max="20"
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Maximální počet na jednu předobjednávku je 20 ks.
          </p>
        </div>

        <div>
          <label className="block font-semibold">Poznámka (nepovinné)</label>
          <textarea
            className="border rounded w-full p-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          ></textarea>
        </div>

        <button
          disabled={loading}
          className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700"
        >
          {loading ? "Odesílám…" : "Odeslat předobjednávku"}
        </button>
      </form>
    </div>
  );
}
