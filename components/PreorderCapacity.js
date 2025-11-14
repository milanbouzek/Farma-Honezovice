import { useState, useEffect } from "react";

export default function PreorderCapacity() {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  // každých 10 sekund obnovit
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/preorders/count");
        const data = await res.json();
        setCurrent(data.total || 0);
        setLoading(false);
      } catch (err) {
        console.error("Chyba načítání kapacity:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const max = 100;
  const percent = Math.min(100, Math.round((current / max) * 100));

  let color = "bg-green-500";
  if (percent >= 50 && percent < 80) color = "bg-orange-500";
  if (percent >= 80) color = "bg-red-600";

  return (
    <div className="mb-4">
      {/* text */}
      <p className="font-semibold text-gray-800 mb-1">
        Celkový limit systému:{" "}
        <span className="font-bold">{current} / {max} ks</span>
      </p>

      {/* progress bar */}
      <div className="w-full h-4 bg-gray-200 rounded-xl overflow-hidden shadow-inner">
        <div
          className={`${color} h-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>

      {!loading && (
        <p className="text-sm text-gray-600 mt-1">{percent}% kapacity</p>
      )}
    </div>
  );
}
