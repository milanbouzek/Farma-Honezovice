import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

export default function PreordersAdmin() {
  const [preorders, setPreorders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at_desc");

  useEffect(() => {
    fetchPreorders();
  }, [search, statusFilter, sortBy]);

  async function fetchPreorders() {
    setLoading(true);

    try {
      let queryUrl = `/api/preorders/list?search=${encodeURIComponent(
        search
      )}&status=${encodeURIComponent(statusFilter)}&sort=${sortBy}`;

      const res = await fetch(queryUrl);
      const data = await res.json();

      if (!res.ok) {
        console.error("Chyba při načítání:", data.error);
      } else {
        setPreorders(data.preorders || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }

    setLoading(false);
  }

  // 🔄 API volání – potvrzení předobjednávky
  async function handleConfirm(id) {
    if (!confirm("Opravdu potvrdit tuto předobjednávku?")) return;

    const res = await fetch("/api/preorders/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert("Chyba: " + (data.error || "Nepodařilo se potvrdit."));
      return;
    }

    alert("Předobjednávka byla potvrzena a převedena do objednávek.");
    fetchPreorders(); // refresh tabulky
  }

  // ❌ Smazání
  async function handleDelete(id) {
    if (!confirm("Opravdu smazat tuto předobjednávku?")) return;

    const res = await fetch("/api/preorders/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Chyba při mazání: " + data.error);
    } else {
      fetchPreorders();
    }
  }

  return (
    <AdminLayout title="🥚 Předobjednávky">
      <div className="p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Předobjednávky</h1>

        {/* 🔍 Filtry */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-4">
          <input
            type="text"
            placeholder="Hledat jméno, telefon, e-mail..."
            className="input input-bordered w-full sm:w-1/3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="select select-bordered w-full sm:w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Všechny stavy</option>
            <option value="čeká">čeká</option>
            <option value="potvrzená">potvrzená</option>
            <option value="zrušená">zrušená</option>
          </select>

          <select
            className="select select-bordered w-full sm:w-48"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="created_at_desc">Nejnovější nahoře</option>
            <option value="created_at_asc">Nejstarší nahoře</option>
            <option value="name_asc">Podle jména A–Z</option>
            <option value="name_desc">Podle jména Z–A</option>
          </select>
        </div>

        {/* 📋 Tabulka */}
        {loading ? (
          <div>Načítám data...</div>
        ) : (
          <div className="overflow-x-auto border rounded-lg shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Jméno</th>
                  <th className="p-2 text-left">Telefon</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-right">Standard</th>
                  <th className="p-2 text-right">LowChol</th>
                  <th className="p-2 text-left">Odběr</th>
                  <th className="p-2 text-left">Stav</th>
                  <th className="p-2 text-left">Vytvořeno</th>
                  <th className="p-2 text-center">Akce</th>
                </tr>
              </thead>

              <tbody>
                {preorders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center p-4 text-gray-500">
                      Žádné záznamy
                    </td>
                  </tr>
                ) : (
                  preorders.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{p.name}</td>
                      <td className="p-2">{p.phone}</td>
                      <td className="p-2">{p.email}</td>
                      <td className="p-2 text-right">{p.standardQty}</td>
                      <td className="p-2 text-right">{p.lowcholQty}</td>
                      <td className="p-2">{p.pickupLocation}</td>

                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            p.status === "potvrzená"
                              ? "bg-green-100 text-green-700"
                              : p.status === "zrušená"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="p-2 text-gray-500">
                        {new Date(p.created_at).toLocaleString("cs-CZ")}
                      </td>

                      <td className="p-2 text-center space-x-2">
                        {p.status !== "potvrzená" && (
                          <button
                            onClick={() => handleConfirm(p.id)}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Potvrdit
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(p.id)}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Smazat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
