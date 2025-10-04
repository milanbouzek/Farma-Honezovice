import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import StockBox from "../components/StockBox";

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

const isValidDate = (date, location, today = new Date()) => {
  let d = date instanceof Date ? new Date(date) : parseDateFromCZ(date);
  if (!d) return false;
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (d <= today) return false;
  if (location === "Dematic Ostrov u Stříbra 65" && isWeekend(d)) return false;
  return true;
};

// --- OrderForm komponenta ---
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

  const [loading, setLoading] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [dateError, setDateError] = useState("");
  const [stock, setStock] = useState({
    standardQuantity: 0,
    lowCholQuantity: 0,
    standardPrice: 0,
    lowCholPrice: 0,
  });

  const calendarRef = useRef(null);
  const today = new Date();
    // --- Funkce pro kalendář a blokování dat ---
  const disabledFn = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (d <= today) return true;
    if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
      if (isWeekend(d)) return true;
    }
    return false;
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    setFormData({ ...formData, pickupDate: formatDateCZ(date) });
    setDateError("");
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const computeTotalPrice = () => {
    const standard = parseInt(formData.standardQuantity || 0, 10);
    const lowChol = parseInt(formData.lowCholQuantity || 0, 10);
    return (
      standard * (stock.standardPrice || 0) + lowChol * (stock.lowCholPrice || 0)
    );
  };

  const totalPrice = computeTotalPrice();

  // --- Odeslání objednávky ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    const standardQty = parseInt(formData.standardQuantity || 0, 10);
    const lowCholQty = parseInt(formData.lowCholQuantity || 0, 10);
    const totalEggs = standardQty + lowCholQty;

    if (totalEggs < 10 || totalEggs % 10 !== 0) {
      toast.error(
        "❌ Minimální objednávka je 10 ks a vždy jen násobky 10."
      );
      return;
    }

    if (!formData.name || !formData.pickupLocation || !formData.pickupDate) {
      toast.error("❌ Vyplňte všechna povinná pole.");
      return;
    }

    const parsedDate = parseDateFromCZ(formData.pickupDate);
    if (!isValidDate(parsedDate, formData.pickupLocation)) {
      toast.error(
        "❌ Vybrané datum není platné pro zvolené místo vyzvednutí."
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
              <h3 className="text-lg font-bold mb-2">
                ✅ Objednávka byla úspěšně odeslána
              </h3>
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

        setStock((prev) => ({
          ...prev,
          standardQuantity:
            data.remaining?.standard ?? prev.standardQuantity,
          lowCholQuantity:
            data.remaining?.lowChol ?? prev.lowCholQuantity,
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
        toast.error(
          "❌ Chyba: " + (data.error || "Nepodařilo se odeslat objednávku.")
        );
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
// --- TŘETÍ ČÁST OrderForm.js ---

import StockBox from "./StockBox";

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
  const [loading, setLoading] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [dateError, setDateError] = useState("");
  const today = getDateOffset(0);

  const [stock, setStock] = useState({
    standardQuantity: 0,
    lowCholQuantity: 0,
    standardPrice: 0,
    lowCholPrice: 0,
  });

  const handleInput = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    const parsed = parseDateFromCZ(formData.pickupDate);
    if (!isValidDate(parsed, formData.pickupLocation, today)) {
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
        const totalPrice =
          standardQty * stock.standardPrice +
          lowCholQty * stock.lowCholPrice;

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
              <h3 className="text-lg font-bold mb-2">
                ✅ Objednávka byla úspěšně odeslána
              </h3>
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

        setStock((prev) => ({
          ...prev,
          standardQuantity:
            data.remaining?.standard ?? prev.standardQuantity,
          lowCholQuantity:
            data.remaining?.lowChol ?? prev.lowCholQuantity,
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
        toast.error(
          "❌ Chyba: " + (data.error || "Nepodařilo se odeslat objednávku.")
        );
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
      <Toaster />
      <h1 className="text-2xl font-bold mb-6">Objednávka domácích vajec</h1>

      <StockBox editable={false} initialStock={stock} />

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div>
          <label className="block font-semibold">Jméno a příjmení*</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInput("name", e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
        </div>

        <div>
          <label className="block font-semibold">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInput("email", e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
        </div>

        <div>
          <label className="block font-semibold">Telefon</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => handleInput("phone", e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">
              Standardní vejce (ks)*
            </label>
            <input
              type="number"
              value={formData.standardQuantity}
              onChange={(e) =>
                handleInput("standardQuantity", e.target.value)
              }
              className="border px-2 py-1 rounded w-full"
            />
          </div>

          <div>
            <label className="block font-semibold">
              Nízký cholesterol (ks)*
            </label>
            <input
              type="number"
              value={formData.lowCholQuantity}
              onChange={(e) =>
                handleInput("lowCholQuantity", e.target.value)
              }
              className="border px-2 py-1 rounded w-full"
            />
          </div>
        </div>
// --- ČTVRTÁ ČÁST OrderForm.js ---

        <div>
          <label className="block font-semibold">Místo vyzvednutí*</label>
          <select
            value={formData.pickupLocation}
            onChange={(e) => handleInput("pickupLocation", e.target.value)}
            className="border px-2 py-1 rounded w-full"
          >
            <option value="">Vyberte místo</option>
            <option value="Dematic Ostrov u Stříbra 65">
              Dematic Ostrov u Stříbra 65
            </option>
            <option value="Jiná lokalita">Jiná lokalita</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold">Datum vyzvednutí*</label>
          <DayPicker
            mode="single"
            selected={parseDateFromCZ(formData.pickupDate)}
            onSelect={(date) =>
              handleInput("pickupDate", formatDateCZ(date))
            }
            disabled={(date) => !isValidDate(date, formData.pickupLocation, today)}
          />
          {dateError && (
            <p className="text-red-600 text-sm mt-1">{dateError}</p>
          )}
        </div>

        <div className="flex space-x-4 mt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={loading}
          >
            {loading ? "Odesílám…" : "Odeslat objednávku"}
          </button>

          <button
            type="button"
            onClick={() => {
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
            }}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Vymazat formulář
          </button>
        </div>
      </form>

      {showQR && lastOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl relative">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold mb-4">QR kód pro platbu</h2>
            <QRCodeCanvas value={getQrValue()} size={256} />
            <p className="mt-3 text-center">
              Číslo objednávky: <strong>{lastOrder.orderId}</strong>
            </p>
            <p className="text-center">
              Celková cena: <strong>{lastOrder.price} Kč</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
