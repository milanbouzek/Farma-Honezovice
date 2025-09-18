import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, addDays, isWeekend, isToday, parse } from "date-fns";

export default function OrderForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    standardQuantity: "",
    lowCholQuantity: "",
    pickupLocation: "",
    pickupDate: "",
  });
  const [stock, setStock] = useState({ standardQuantity: 0, lowCholQuantity: 0 });
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const calendarRef = useRef(null);

  // Výpočet ceny
  const totalPrice =
    (parseInt(formData.standardQuantity || 0, 10) * 5) +
    (parseInt(formData.lowCholQuantity || 0, 10) * 7);

  const today = new Date();

  // Spočítá datum podle offsetu (1 = zítra, 2 = pozítří)
  const getDateOffset = (offset) => {
    return addDays(today, offset);
  };

  // Formát do českého tvaru
  const formatCzechDate = (date) => {
    return format(date, "dd.MM.yyyy");
  };

  // Kontrola validního dne pro Dematic
  const isValidDate = (date) => {
    if (isToday(date)) return false; // dnes vždy blokováno
    if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65" && isWeekend(date)) return false;
    return true;
  };

  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json();
        setStock({
          standardQuantity: data.standardQuantity || 0,
          lowCholQuantity: data.lowCholQuantity || 0,
        });
      } catch {
        setStock({ standardQuantity: 0, lowCholQuantity: 0 });
      }
    }
    fetchStock();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "standardQuantity" || name === "lowCholQuantity"
          ? value === "" ? "" : parseInt(value, 10)
          : value,
    }));

    // validace datumu při ručním zadávání
    if (name === "pickupDate") {
      const parsed = parse(value, "dd.MM.yyyy", new Date());
      if (!isValidDate(parsed)) {
        setDateError(
          formData.pickupLocation === "Dematic Ostrov u Stříbra 65"
            ? "❌ Nelze vybrat dnešní den nebo víkend pro Dematic."
            : "❌ Nelze vybrat dnešní den."
        );
      } else {
        setDateError("");
      }
    }
  };

  const handleAdd = (field, amount) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(0, parseInt(prev[field] || 0, 10) + amount),
    }));
  };

  const handleDateQuickPick = (offset) => {
    const date = getDateOffset(offset);
    setFormData((prev) => ({
      ...prev,
      pickupDate: formatCzechDate(date),
    }));

    if (!isValidDate(date)) {
      setDateError(
        formData.pickupLocation === "Dematic Ostrov u Stříbra 65"
          ? "❌ Nelze vybrat dnešní den nebo víkend pro Dematic."
          : "❌ Nelze vybrat dnešní den."
      );
    } else {
      setDateError("");
    }
  };

  const handleDayClick = (day) => {
    if (!isValidDate(day)) return;
    setFormData((prev) => ({
      ...prev,
      pickupDate: formatCzechDate(day),
    }));
    setDateError("");
    setShowCalendar(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const standardQty = parseInt(formData.standardQuantity || 0, 10);
    const lowCholQty = parseInt(formData.lowCholQuantity || 0, 10);
    const totalEggs = standardQty + lowCholQty;

    if (totalEggs < 10 || totalEggs % 10 !== 0) {
      toast.error("❌ Minimální objednávka je 10 ks a vždy jen násobky 10.");
      return;
    }

    if (!formData.name || !formData.pickupLocation || !formData.pickupDate) {
      toast.error("❌ Vyplňte všechna povinná pole.");
      return;
    }

    // kontrola datumu při odeslání
    const [day, month, year] = formData.pickupDate.split(".");
    const selectedDate = new Date(year, month - 1, day);
    if (!isValidDate(selectedDate)) {
      toast.error(
        formData.pickupLocation === "Dematic Ostrov u Stříbra 65"
          ? "❌ Nelze odeslat objednávku s dnešním dnem nebo víkendem pro Dematic."
          : "❌ Nelze odeslat objednávku s dnešním dnem."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          standardQuantity: standardQty,
          lowCholQuantity: lowCholQty,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`✅ Objednávka byla úspěšně odeslána. Číslo: ${data.orderId}`);
        setStock({
          standardQuantity: data.remaining_standard,
          lowCholQuantity: data.remaining_low_chol,
        });
        setFormData({
          name: "",
          email: "",
          phone: "",
          standardQuantity: "",
          lowCholQuantity: "",
          pickupLocation: "",
          pickupDate: "",
        });
        setDateError("");
      } else {
        toast.error("❌ Chyba: " + (data.error || "Nepodařilo se odeslat objednávku."));
      }
    } catch {
      toast.error("❌ Chyba při odesílání objednávky.");
    } finally {
      setLoading(false);
    }
  };

  const handleClickOutside = (e) => {
    if (calendarRef.current && !calendarRef.current.contains(e.target)) {
      setShowCalendar(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
      {/* Aktuální dostupné množství */}
      <div className="mb-4 text-lg text-gray-700">
        <h2 className="font-bold mb-1 text-red-600">Aktuální dostupné množství</h2>
        <p>🥚 Standardní vejce: <strong>{stock.standardQuantity}</strong> ks (5 Kč/ks)</p>
        <p>🥚 Vejce se sníženým cholesterolem: <strong>{stock.lowCholQuantity}</strong> ks (7 Kč/ks)</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 space-y-4 max-w-lg"
      >
        {/* Jméno */}
        <div>
          <label className="block text-gray-700 mb-1">Jméno a příjmení *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border rounded-xl p-2"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-700 mb-1">Email (nepovinné)</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-xl p-2"
          />
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-gray-700 mb-1">Telefon (nepovinné)</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border rounded-xl p-2"
          />
        </div>

        {/* Standardní vejce */}
        <div>
          <label className="block text-gray-700 mb-1">Počet standardních vajec</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="standardQuantity"
              value={formData.standardQuantity}
              onChange={handleChange}
              min="0"
              className="w-full border rounded-xl p-2"
            />
            <button type="button" onClick={() => handleAdd("standardQuantity", 5)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+5</button>
            <button type="button" onClick={() => handleAdd("standardQuantity", 10)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+10</button>
          </div>
        </div>

        {/* Low cholesterol vejce */}
        <div>
          <label className="block text-gray-700 mb-1">Počet vajec se sníženým cholesterolem</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="lowCholQuantity"
              value={formData.lowCholQuantity}
              onChange={handleChange}
              min="0"
              className="w-full border rounded-xl p-2"
            />
            <button type="button" onClick={() => handleAdd("lowCholQuantity", 5)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+5</button>
            <button type="button" onClick={() => handleAdd("lowCholQuantity", 10)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+10</button>
          </div>
        </div>

        {/* Celková cena */}
        <div className="text-gray-800 font-semibold">
          Celková cena: <span className="text-green-700">{totalPrice} Kč</span>
        </div>

        {/* Místo vyzvednutí */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setFormData(prev => ({...prev, pickupLocation:"Dematic Ostrov u Stříbra 65"}))}
            className={`px-4 py-2 rounded-xl ${formData.pickupLocation==="Dematic Ostrov u Stříbra 65"?"bg-green-500 text-white":"bg-yellow-400"}`}
          >
            Dematic Ostrov u Stříbra 65
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({...prev, pickupLocation:"Honezovice"}))}
            className={`px-4 py-2 rounded-xl ${formData.pickupLocation==="Honezovice"?"bg-green-500 text-white":"bg-yellow-400"}`}
          >
            Honezovice
          </button>
        </div>

        {/* Datum vyzvednutí */}
        <div ref={calendarRef}>
          <label className="block text-gray-700 mb-1">Datum vyzvednutí *</label>
          <input
            type="text"
            readOnly
            name="pickupDate"
            value={formData.pickupDate}
            onClick={() => setShowCalendar(true)}
            className={`w-full border rounded-xl p-2 ${dateError?"border-red-500":""}`}
          />
          {showCalendar && (
            <DayPicker
              mode="single"
              selected={formData.pickupDate ? parse(formData.pickupDate,"dd.MM.yyyy", new Date()):undefined}
              onSelect={handleDayClick}
              disabled={[
                today,
                formData.pickupLocation==="Dematic Ostrov u Stříbra 65"?{daysOfWeek:[0,6]}:null
              ]}
              weekStartsOn={1}
            />
          )}
          {dateError && <p className="text-red-600 text-sm mt-1">{dateError}</p>}
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={()=>handleDateQuickPick(1)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">Zítra</button>
            <button type="button" onClick={()=>handleDateQuickPick(2)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">Pozítří</button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-400 px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 transform transition"
        >
          {loading ? "Odesílám..." : "Odeslat objednávku"}
        </button>
      </form>
    </div>
  );
}
