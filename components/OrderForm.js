import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

/**
 * OrderForm.js
 * Kompletní formulář objednávky s validacemi a QR modalem.
 *
 * Důležité:
 * - Posílá datum ve formátu DD.MM.YYYY (server očekává tento formát a převádí ho do ISO).
 * - Pokud je místo "Dematic Ostrov u Stříbra 65", kalendář blokuje víkendy.
 * - Dnešní a minulé dny jsou vždy zablokované.
 * - Po úspěšném odeslání zobrazí persistentní toast s číslem objednávky a tlačítkem pro QR modal.
 */

const ACCOUNT_DOMESTIC = "19-3296360227/0100"; // zobrazí se v modalu, používá se k vygenerování IBAN pro QR

function computeIbanCheckDigits(countryCode, bban) {
  const countryNums = countryCode
    .split("")
    .map((c) => (c.charCodeAt(0) - 55).toString())
    .join("");
  const rearranged = bban + countryNums + "00";
  const remainder = BigInt(rearranged) % 97n;
  const check = 98n - remainder;
  return String(check).padStart(2, "0");
}

function domesticToIBAN(domestic) {
  if (!domestic || typeof domestic !== "string") return "";
  const parts = domestic.split("/");
  if (parts.length !== 2) return "";
  const left = parts[0].replace(/\D/g, "");
  const bank = parts[1].replace(/\D/g, "").padStart(4, "0").slice(-4);
  const accountPadded = left.padStart(16, "0").slice(-16);
  const bban = bank + accountPadded;
  const check = computeIbanCheckDigits("CZ", bban);
  return `CZ${check}${bban}`;
}

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

  const [stock, setStock] = useState({
    standardQuantity: 0,
    lowCholQuantity: 0,
    standardPrice: 5,
    lowCholPrice: 7,
  });

  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const calendarRef = useRef(null);

  const totalPrice =
    (parseInt(formData.standardQuantity || 0, 10) * (stock.standardPrice || 0)) +
    (parseInt(formData.lowCholQuantity || 0, 10) * (stock.lowCholPrice || 0));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDateOffset = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const formatDateCZ = (date) => {
    if (!date) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const parseDateFromCZ = (cz) => {
    if (!cz) return null;
    const [dd, mm, yyyy] = cz.split(".");
    if (!dd || !mm || !yyyy) return null;
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

  const isValidDate = (date, location = formData.pickupLocation) => {
    let d = date instanceof Date ? new Date(date) : parseDateFromCZ(date);
    if (!d) return false;
    d.setHours(0, 0, 0, 0);
    if (d <= today) return false;
    if (location === "Dematic Ostrov u Stříbra 65" && isWeekend(d)) return false;
    return true;
  };

  useEffect(() => {
    let mounted = true;
    async function fetchStock() {
      try {
        const res = await fetch("/api/stock");
        const json = await res.json();
        if (!mounted) return;
        setStock((prev) => ({
          standardQuantity: json.standardQuantity || 0,
          lowCholQuantity: json.lowCholQuantity || 0,
          standardPrice: prev.standardPrice,
          lowCholPrice: prev.lowCholPrice,
        }));
      } catch (err) {
        if (!mounted) return;
        setStock((prev) => ({
          standardQuantity: 0,
          lowCholQuantity: 0,
          standardPrice: prev.standardPrice,
          lowCholPrice: prev.lowCholPrice,
        }));
      }
    }
    fetchStock();
    return () => { mounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "standardQuantity" || name === "lowCholQuantity"
          ? value === ""
            ? ""
            : parseInt(value, 10)
          : value,
    }));
  };

  const handleAdd = (field, amount) => {
    setFormData((prev) => {
      const cur = parseInt(prev[field] || 0, 10);
      return { ...prev, [field]: Math.max(0, cur + amount) };
    });
  };

  const clearDateAndSetError = (msg) => {
    setFormData((prev) => ({ ...prev, pickupDate: "" }));
    setDateError(msg || "");
  };

  const handlePickupSelect = (loc) => {
    setFormData((prev) => ({ ...prev, pickupLocation: loc }));

    if (formData.pickupDate) {
      const parsed = parseDateFromCZ(formData.pickupDate);
      if (!isValidDate(parsed, loc)) {
        if (loc === "Dematic Ostrov u Stříbra 65") {
          clearDateAndSetError("❌ Nelze vybrat dnešní den nebo víkend pro Dematic.");
        } else {
          clearDateAndSetError("❌ Nelze vybrat dnešní den.");
        }
      } else {
        setDateError("");
      }
    } else {
      setDateError("");
    }
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (!isValidDate(d)) {
      if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
        clearDateAndSetError("❌ Nelze vybrat dnešní den nebo víkend pro Dematic.");
      } else {
        clearDateAndSetError("❌ Nelze vybrat dnešní den.");
      }
      return;
    }
    setFormData((prev) => ({ ...prev, pickupDate: formatDateCZ(d) }));
    setDateError("");
    setShowCalendar(false);
  };

  const handleDateQuickPick = (offset) => {
    const d = getDateOffset(offset);
    if (!isValidDate(d)) {
      if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
        clearDateAndSetError("❌ Nelze vybrat dnešní den nebo víkend pro Dematic.");
      } else {
        clearDateAndSetError("❌ Nelze vybrat dnešní den.");
      }
    } else {
      setFormData((prev) => ({ ...prev, pickupDate: formatDateCZ(d) }));
      setDateError("");
    }
    setShowCalendar(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const standardQty = parseInt(formData.standardQuantity || 0, 10);
    const lowCholQty = parseInt(formData.lowCholQuantity || 0, 10);
    const totalEggs = (standardQty || 0) + (lowCholQty || 0);

    if (totalEggs < 10 || totalEggs % 10 !== 0) {
      toast.error("❌ Minimální objednávka je 10 ks a vždy jen násobky 10.");
      return;
    }
    if (!formData.name || !formData.pickupLocation || !formData.pickupDate) {
      toast.error("❌ Vyplňte všechna povinná pole.");
      return;
    }

    const parsed = parseDateFromCZ(formData.pickupDate);
    if (!isValidDate(parsed, formData.pickupLocation)) {
      toast.error("❌ Vybrané datum není platné pro zvolené místo vyzvednutí.");
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
        setLastOrder({ orderId: data.orderId, price: totalPrice });
        setShowQR(true);

        toast.custom(
          (t) => (
            <div
              className={`bg-white shadow-lg rounded-2xl p-5 max-w-md w-full relative ${
                t.visible ? "animate-enter" : "animate-leave"
              }`}
              style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
            >
              <button
                onClick={() => toast.dismiss(t.id)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                aria-label="Zavřít"
              >
                <X size={18} />
              </button>
              <h3 className="text-lg font-bold mb-2">✅ Objednávka byla úspěšně odeslána</h3>
              <p className="mb-1">
                Číslo objednávky: <strong>{data.orderId}</strong>
              </p>
              <p className="mb-3">
                Celková cena: <strong>{totalPrice} Kč</strong>
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Platbu můžete provést předem přes QR kód nebo při vyzvednutí.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQR(true)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Zobrazit QR kód
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
                >
                  Zavřít
                </button>
              </div>
            </div>
          ),
          { duration: Infinity }
        );

        setStock((prev) => ({
          ...prev,
          standardQuantity: data.remaining?.standard ?? prev.standardQuantity,
          lowCholQuantity: data.remaining?.lowChol ?? prev.lowCholQuantity,
        }));

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
    } catch (err) {
      console.error("Order submit error:", err);
      toast.error("❌ Chyba při odesílání objednávky.");
    } finally {
      setLoading(false);
    }
  };

  const getQrValue = () => {
    if (!lastOrder) return "";
    const iban = domesticToIBAN(ACCOUNT_DOMESTIC);
    const amount = Number(lastOrder.price || 0).toFixed(2);
    return `SPD*1.0*ACC:${iban}*AM:${amount}*CC:CZK*X-VS:${lastOrder.orderId}`;
  };

  const disabledFn = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (d <= today) return true;
    if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
      const day = d.getDay();
      if (day === 0 || day === 6) return true;
    }
    return false;
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "12px",
            background: "#fff8dc",
            color: "#333",
            fontSize: "15px",
            padding: "14px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
          },
        }}
      />

      {showQR && lastOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white p-5 rounded-2xl shadow-xl relative w-full max-w-sm">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              aria-label="Zavřít QR"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-2">Platba přes QR kód</h3>
            <p className="text-sm text-gray-600 mb-3">
              Číslo účtu: <strong>{ACCOUNT_DOMESTIC}</strong><br />
              Částka: <strong>{lastOrder.price} Kč</strong><br />
              Variabilní symbol: <strong>{lastOrder.orderId}</strong>
            </p>
            <div className="flex justify-center mb-3">
              <QRCodeCanvas value={getQrValue()} size={200} includeMargin={true} />
            </div>
            <p className="text-xs text-gray-500">Naskenujte QR kód ve své bankovní aplikaci.</p>
            <div className="mt-3 text-right">
              <button onClick={() => setShowQR(false)} className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500">Zavřít</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 text-lg text-gray-700">
        <h2 className="font-bold mb-1 text-red-600">Aktuální dostupné množství</h2>
        <p>🥚 Standardní vejce: <strong>{stock.standardQuantity}</strong> ks ({stock.standardPrice} Kč/ks)</p>
        <p>🥚 Vejce se sníženým cholesterolem: <strong>{stock.lowCholQuantity}</strong> ks ({stock.lowCholPrice} Kč/ks)</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-6 space-y-4">
        {/* Jméno */}
        <div>
          <label className="block text-gray-700 mb-1">Jméno a příjmení*</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        {/* Email */}
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        {/* Telefon */}
        <div>
          <label className="block text-gray-700 mb-1">Telefon</label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            type="tel"
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        {/* Objednané množství */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-gray-700 mb-1">Standardní vejce*</label>
            <input
              name="standardQuantity"
              value={formData.standardQuantity}
              onChange={handleChange}
              type="number"
              min={0}
              step={10}
              className="w-full px-3 py-2 border rounded"
            />
            <div className="flex gap-1 mt-1">
              <button type="button" onClick={() => handleAdd("standardQuantity", 10)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">+10</button>
              <button type="button" onClick={() => handleAdd("standardQuantity", -10)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">-10</button>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 mb-1">Snížený cholesterol*</label>
            <input
              name="lowCholQuantity"
              value={formData.lowCholQuantity}
              onChange={handleChange}
              type="number"
              min={0}
              step={10}
              className="w-full px-3 py-2 border rounded"
            />
            <div className="flex gap-1 mt-1">
              <button type="button" onClick={() => handleAdd("lowCholQuantity", 10)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">+10</button>
              <button type="button" onClick={() => handleAdd("lowCholQuantity", -10)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">-10</button>
            </div>
          </div>
        </div>

        {/* Místo vyzvednutí */}
        <div>
          <label className="block text-gray-700 mb-1">Místo vyzvednutí*</label>
          <select
            name="pickupLocation"
            value={formData.pickupLocation}
            onChange={(e) => handlePickupSelect(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          >
            <option value="">Vyberte místo</option>
            <option value="Dematic Ostrov u Stříbra 65">Dematic Ostrov u Stříbra 65</option>
            <option value="Praha 5">Praha 5</option>
            <option value="Plzeň">Plzeň</option>
          </select>
        </div>

        {/* Datum vyzvednutí */}
        <div>
          <label className="block text-gray-700 mb-1">Datum vyzvednutí*</label>
          <input
            name="pickupDate"
            value={formData.pickupDate}
            onChange={handleChange}
            onFocus={() => setShowCalendar(true)}
            readOnly
            className="w-full px-3 py-2 border rounded cursor-pointer bg-white"
            required
          />
          {dateError && <p className="text-red-600 text-sm mt-1">{dateError}</p>}
          {showCalendar && (
            <DayPicker
              mode="single"
              selected={parseDateFromCZ(formData.pickupDate)}
              onSelect={handleDateSelect}
              disabled={disabledFn}
              fromDate={today}
            />
          )}
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => handleDateQuickPick(1)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">Zítra</button>
            <button type="button" onClick={() => handleDateQuickPick(2)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">Pozítří</button>
          </div>
        </div>

        {/* Submit */}
        <div className="text-right">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Odesílám..." : "Odeslat objednávku"}
          </button>
        </div>
      </form>
    </div>
  );
}
