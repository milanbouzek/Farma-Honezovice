import { useEffect, useState } from "react";

export default function PreorderCapacity() {
  const [total, setTotal] = useState(0);
  const LIMIT = 100;

  async function load() {
    try {
      const res = await fetch("/api/preorders");
      const data = await res.json();

      if (res.ok) {
        // API už vrací total = jen "čeká"
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Chyba při načítání limitu:", err);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const percent = Math.min(100, Math.round((total / LIMIT) * 100));

  // barva podle vytížení
  const barColor =
    percent < 50 ? "bg-green-500" : percent < 80 ? "bg-orange-500" : "bg-red-500";

  return (
    <div className="mb-4 bg-white p-4 rounded-xl shadow">
      <p className="font-semibold text-gray-700 mb-1">
        Celkový limit systému: {total} / {LIMIT} ks
      </p>

      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${barColor} h-full transition-all`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>

      <p className="text-sm text-gray-600 mt-1">{percent}% kapacity</p>
    </div>
  );
}
