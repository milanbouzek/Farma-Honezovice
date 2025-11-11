import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function PredobjednavkaPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentTotal, setCurrentTotal] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (limitReached) {
      toast.error("Limit je již dosažen. Předobjednávky nejsou možné.");
      return;
    }

    if (!name || !phone || !quantity) {
      toast.error("Vyplň prosím všechna povinná pole.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/preorders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          quantity: Number(quantity),
          note,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Předobjednávka byla odeslána!");
        setName("");
        setPhone("");
        setEmail("");
        setQuantity(1);
        setNote("");
        fetchLimit(); // aktualizuje počet
      } else {
        toast.error(data.error || "Chyba při odesílání předobjednávky.");
      }

    } catch (err) {
      toast.error("Chyba připojení. Zkus to prosím znovu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <Toaster position="top-center" />

      <div className="max-w-lg mx-auto bg-white p-6 shadow-xl rounded-2xl">
        <h1 className="text-3xl font-bold mb-4 text-center">
          📝 Předobjednávka
        </h1>

        <p className="text-center text-gray-600 mb-6">
          Aktuálně předobjednáno:{" "}
          <strong className="text-blue-600">{currentTotal} / 100 ks</strong>
        </p>

        {limitReached && (
          <p className="text-center text-red-600 font-bold mb-4">
            Limit 100 ks byl naplněn. Předobjednávky nejsou dostupné.
          </p>
        )}

        {!limitReached && (
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block font-semibold mb-1">Jméno a příjmení *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Jan Novák"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Telefon *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="+420 777 123 456"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Email (volitelné)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="email@domena.cz"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Množství *</label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Poznámka</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border rounded p-2 h-24"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Odesílám…" : "Odeslat předobjednávku"}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
