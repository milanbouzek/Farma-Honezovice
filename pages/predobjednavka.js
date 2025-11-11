import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function PreorderPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [standardQty, setStandardQty] = useState(0);
  const [lowcholQty, setLowcholQty] = useState(0);
  const [pickupLocation, setPickupLocation] = useState("Honezovice");
  const [loading, setLoading] = useState(false);

  const perOrderLimit = 20;
  const totalOrderLimit = 100;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const total = Number(standardQty) + Number(lowcholQty);

    if (total === 0) {
      toast.error("Musíte objednat alespoň 1 ks.");
      return;
    }

    if (total > perOrderLimit) {
      toast.error(`Maximální množství na jednu předobjednávku je ${perOrderLimit} ks.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/preorders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          standardQty: Number(standardQty),
          lowcholQty: Number(lowcholQty),
          pickupLocation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.currentTotal !== undefined) {
          toast.error(
            `Nelze vytvořit. Celkový limit je ${totalOrderLimit} ks. Momentálně je předobjednáno ${data.currentTotal} ks.`
          );
        } else {
          toast.error(data.error || "Chyba při vytváření předobjednávky.");
        }
      } else {
        toast.success("Předobjednávka byla úspěšně vytvořena!");
        setName("");
        setEmail("");
        setPhone("");
        setStandardQty(0);
        setLowcholQty(0);
        setPickupLocation("Honezovice");
      }
    } catch (err) {
      toast.error("Chyba při komunikaci se serverem: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6">
      <Toaster position="top-center" />
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">🥚 Předobjednávka vajec</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg p-4 sm:p-6 rounded-xl space-y-4"
      >
        <div>
          <label className="font-semibold mb-1 block">Jméno a příjmení</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded p-2 text-sm sm:text-base"
            placeholder="Jan Novák"
          />
        </div>

        <div>
          <label className="font-semibold mb-1 block">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded p-2 text-sm sm:text-base"
            placeholder="jan@novak.cz"
          />
        </div>

        <div>
          <label className="font-semibold mb-1 block">Telefon</label>
          <input
            type="text"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded p-2 text-sm sm:text-base"
            placeholder="123 456 789"
          />
        </div>

        <div>
          <label className="font-semibold mb-1 block">Výběr místa</label>
          <select
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            className="w-full border rounded p-2 text-sm sm:text-base"
          >
            <option value="Honezovice">Honezovice</option>
            <option value="Dematic">Dematic</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold mb-1 block">Počet kusů – Standard</label>
            <input
              type="number"
              min="0"
              max="20"
              value={standardQty}
              onChange={(e) => setStandardQty(e.target.value)}
              className="w-full border rounded p-2 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="font-semibold mb-1 block">Počet kusů – Low Cholesterol</label>
            <input
              type="number"
              min="0"
              max="20"
              value={lowcholQty}
              onChange={(e) => setLowcholQty(e.target.value)}
              className="w-full border rounded p-2 text-sm sm:text-base"
            />
          </div>
        </div>

        <button
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 w-full py-2 text-white font-bold rounded-xl text-sm sm:text-base"
        >
          {loading ? "Odesílám…" : "Vytvořit předobjednávku"}
        </button>
      </form>
    </div>
  );
}
