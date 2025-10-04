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

const ACCOUNT_DOMESTIC = "19-3296360227/0100";

// Pomocná funkce pro výpočet IBAN
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

const getDateOffset = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isValidDate = (date, location, today) => {
  let d = date instanceof Date ? new Date(date) : parseDateFromCZ(date);
  if (!d) return false;
  d.setHours(0, 0, 0, 0);
  if (d <= today) return false;
  if (location === "Dematic Ostrov u Stříbra 65" && isWeekend(d)) return false;
  return true;
};
export default function OrderForm() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    standardQuantity: "",
    lowCholQuantity: "",
    pickupLocation: "",
    pickupDate: "",
  });

  const [lastOrder, setLastOrder] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [stock, setStock] = useState({
    standardQuantity: 0,
    lowCholQuantity: 0,
  });

  const parseIntSafe = (val) => {
    const n = parseInt(val, 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const disabledFn = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (d <= today) return true;
    if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
      if (isWeekend(d)) return true;
    }
    return false;
  };

  const calculateTotalPrice = () => {
    const standard = parseIntSafe(formData.standardQuantity);
    const lowChol = parseIntSafe(formData.lowCholQuantity);
    const pricePerStandard = 15; // placeholder, může být dynamické
    const pricePerLowChol = 20; // placeholder, může být dynamické
    return standard * pricePerStandard + lowChol * pricePerLowChol;
  };
    const handleSubmit = async (e) => {
    e.preventDefault();

    const standardQty = parseIntSafe(formData.standardQuantity);
    const lowCholQty = parseIntSafe(formData.lowCholQuantity);
    const totalEggs = standardQty + lowCholQty;

    // Validace počtu
    if (totalEggs < 10 || totalEggs % 10 !== 0) {
      toast.error("❌ Minimální objednávka je 10 ks a vždy jen násobky 10.");
      return;
    }

    // Validace povinných polí
    if (!formData.name || !formData.pickupLocation || !formData.pickupDate) {
      toast.error("❌ Vyplňte všechna povinná pole.");
      return;
    }

    const parsedDate = parseDateFromCZ(formData.pickupDate);
    if (!isValidDate(parsedDate, formData.pickupLocation, today)) {
      toast.error("❌ Vybrané datum není platné pro zvolené místo vyzvednutí.");
      return;
    }

    const totalPrice = calculateTotalPrice();

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
            >
              <button
                onClick={() => toast.dismiss(t.id)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
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
            </div>
          ),
          { duration: Infinity }
        );

        // Aktualizace stavu skladu po objednávce
        setStock((prev) => ({
          ...prev,
          standardQuantity: data.remaining?.standard ?? prev.standardQuantity,
          lowCholQuantity: data.remaining?.lowChol ?? prev.lowCholQuantity,
        }));

        // Reset formuláře
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
  return (
    <div className="max-w-3xl mx-auto p-4">
      <Toaster position="top-right" />
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Jméno a kontakt */}
        <div>
          <label className="block mb-1 font-medium">Jméno*</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Telefon</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        {/* Místo vyzvednutí */}
        <div>
          <label className="block mb-1 font-medium">Místo vyzvednutí*</label>
          <select
            value={formData.pickupLocation}
            onChange={(e) =>
              setFormData({ ...formData, pickupLocation: e.target.value })
            }
            className="border rounded px-2 py-1 w-full"
          >
            <option value="">Vyberte místo</option>
            <option value="Dematic Ostrov u Stříbra 65">Dematic Ostrov u Stříbra 65</option>
            <option value="Farma Honezovice">Farma Honezovice</option>
          </select>
        </div>

        {/* Datum vyzvednutí */}
        <div>
          <label className="block mb-1 font-medium">Datum vyzvednutí*</label>
          <DayPicker
            mode="single"
            selected={parseDateFromCZ(formData.pickupDate)}
            onSelect={(date) => {
              setFormData({ ...formData, pickupDate: formatDateCZ(date) });
              setDateError("");
            }}
            disabled={(date) => !isValidDate(date, formData.pickupLocation, today)}
          />
          {dateError && <p className="text-red-600">{dateError}</p>}
        </div>

        {/* Počet vajec */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Standardní vejce (ks)</label>
            <input
              type="number"
              value={formData.standardQuantity}
              onChange={(e) =>
                setFormData({ ...formData, standardQuantity: e.target.value })
              }
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Nízký cholesterol (ks)</label>
            <input
              type="number"
              value={formData.lowCholQuantity}
              onChange={(e) =>
                setFormData({ ...formData, lowCholQuantity: e.target.value })
              }
              className="border rounded px-2 py-1 w-full"
            />
          </div>
        </div>

        {/* Tlačítko odeslat */}
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? "Odesílám…" : "Odeslat objednávku"}
        </button>
      </form>

      {/* QR modal */}
      {showQR && lastOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 relative max-w-sm w-full">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-4">Platba QR kódem</h3>
            <QRCodeCanvas value={getQrValue()} size={200} />
            <p className="mt-4">Číslo objednávky: <strong>{lastOrder.orderId}</strong></p>
            <p>Celková cena: <strong>{lastOrder.price} Kč</strong></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderForm;
