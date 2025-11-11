import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function PredobjednavkaPage() {
  const [jmeno, setJmeno] = useState("");
  const [email, setEmail] = useState("");
  const [pocet, setPocet] = useState(1);

  const [celkemPredobjednano, setCelkemPredobjednano] = useState(0);
  const [loading, setLoading] = useState(false);

  const MAX_NA_OBJEDNAVKU = 20;
  const MAX_GLOBAL_LIMIT = 100;

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/preorders/stats");
      const data = await res.json();
      setCelkemPredobjednano(data.celkem);
    } catch (err) {
      console.error("Chyba načítání statistik:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pocet < 1) {
      toast.error("Musíte objednat alespoň 1 kus.");
      return;
    }

    if (pocet > MAX_NA_OBJEDNAVKU) {
      toast.error(`Maximální počet na jednu předobjednávku je ${MAX_NA_OBJEDNAVKU}.`);
      return;
    }

    if (celkemPredobjednano + pocet > MAX_GLOBAL_LIMIT) {
      toast.error(
        `Limit dosažen. Momentálně lze předobjednat už jen ${
          MAX_GLOBAL_LIMIT - celkemPredobjednano
        } ks.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/preorders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jmeno, email, pocet }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Chyba při vytváření předobjednávky");

      toast.success("Předobjednávka byla odeslána!");
      setJmeno("");
      setEmail("");
      setPocet(1);
      fetchStats();
    } catch (err) {
      toast.error("Nepodařilo se odeslat: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Toaster />
      <h1 className="text-3xl font-bold mb-4">🟢 Předobjednávka vajec</h1>

      <div className="bg-white p-4 shadow rounded-lg mb-4">
        <p>
          Celkem lze předobjednat: <b>{MAX_GLOBAL_LIMIT}</b> ks
        </p>
        <p>
          Již předobjednáno: <b>{celkemPredobjednano}</b> ks
        </p>
        <p>
          Zbývá:{" "}
          <b className="text-green-600">
            {MAX_GLOBAL_LIMIT - celkemPredobjednano} ks
          </b>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow p-4 rounded-lg">
        <label className="block mb-2">Jméno:</label>
        <input
          type="text"
          value={jmeno}
          onChange={(e) => setJmeno(e.target.value)}
          className="border p-2 w-full mb-4"
          required
        />

        <label className="block mb-2">Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full mb-4"
          required
        />

        <label className="block mb-2">Počet ks (max 20):</label>
        <input
          type="number"
          value={pocet}
          onChange={(e) => setPocet(parseInt(e.target.value))}
          className="border p-2 w-full mb-4"
          min={1}
          max={MAX_NA_OBJEDNAVKU}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-300"
        >
          {loading ? "Odesílám..." : "Odeslat předobjednávku"}
        </button>
      </form>
    </div>
  );
}
