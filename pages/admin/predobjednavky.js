import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import toast, { Toaster } from "react-hot-toast";
import PreordersTable from "../../components/PreordersTable";

export default function PreordersAdmin() {
  const [preorders, setPreorders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTotal, setCurrentTotal] = useState(0);

  const fetchPreorders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/preorders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreorders(data.preorders || []);
      setCurrentTotal(data.total || 0);
    } catch (err) {
      toast.error("Chyba: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreorders();
    const interval = setInterval(fetchPreorders, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout>
      <Toaster position="top-center" />

      <h1 className="text-3xl font-bold mb-6">📝 Předobjednávky</h1>

      <div className="mb-4 p-4 bg-white shadow rounded-xl">
        <p className="text-lg">
          <strong>Celkem předobjednáno:</strong>{" "}
          <span className="text-blue-600">{currentTotal} ks</span> / 100 ks limit
        </p>

        {currentTotal >= 100 && (
          <p className="text-red-600 font-bold mt-2">
            Limit 100 ks dosažen — další předobjednávky nejsou možné.
          </p>
        )}
      </div>

      <div className="bg-white shadow rounded-xl p-4">
        {loading ? (
          <p>Načítám…</p>
        ) : (
          <PreordersTable preorders={preorders} refresh={fetchPreorders} />
        )}
      </div>
    </AdminLayout>
  );
}
