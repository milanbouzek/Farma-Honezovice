import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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
    let query = supabase.from("preorders").select("*");

    // 🔍 Filtr podle textu (name, phone, email)
    if (search.trim() !== "") {
      query = query.or(
        `name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // ⚙️ Filtr podle statusu
    if (statusFilter !== "") {
      query = query.eq("status", statusFilter);
    }

    // ↕️ Třídění
    if (sortBy === "created_at_desc") query = query.order("created_at", { ascending: false });
    if (sortBy === "created_at_asc") query = query.order("created_at", { ascending: true });
    if (sortBy === "name_asc") query = query.order("name", { ascending: true });
    if (sortBy === "name_desc") query = query.order("name", { ascending: false });

    const { data, error } = await query;

    if (error) console.error("Chyba při načítání předobjednávek:", error);
    else setPreorders(data || []);

    setLoading(false);
  }

  return (
    <AdminLayout title="🥚 Předobjednávky">
      <div className="p-4 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Předobjednávky</h1>

        {/* 🔍 Panel filtrů */}
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
                </tr>
              </thead>
              <tbody>
                {preorders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center p-4 text-gray-500">
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
