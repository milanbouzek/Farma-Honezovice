// --- OrderForm.js: Část 1/4 ---

import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import StockBox from "./StockBox";

/**
 * OrderForm.js
 * Kompletní formulář objednávky s validacemi a QR modalem.
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
// --- OrderForm.js: Část 2/4 ---

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
  const [showQR, setShowQR] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [dateError, setDateError] = useState("");
  const [stock, setStock] = useState({
    standardQuantity: 0,
    lowCholQuantity: 0,
  });

  const today = getDateOffset(0);
  const dayPickerRef = useRef();

  // Funkce pro validaci data pro kalendář
  const disabledDate = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (d <= today) return true;
    if (formData.pickupLocation === "Dematic Ostrov u Stříbra 65") {
      const day = d.getDay();
      if (day === 0 || day === 6) return true;
    }
    return false;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    if (disabledDate(date)) {
      setDateError("Tento den není k dispozici");
      return;
    }
    setDateError("");
    handleInputChange("pickupDate", formatDateCZ(date));
  };

  useEffect(() => {
    // Načtení aktuálního stavu skladu
    const fetchStock = async () => {
      try {
        const res = await fetch("/api/stock", { cache: "no-store" });
        const json = await res.json();
        setStock({
          standardQuantity: json.standard_quantity ?? 0,
          lowCholQuantity: json.low_chol_quantity ?? 0,
        });
      } catch (err) {
        console.error("Chyba při načítání skladu:", err);
      }
    };
    fetchStock();
  }, []);
  // --- OrderForm.js: Část 3/4 ---

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white shadow rounded-xl">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Objednávka domácích vajec</h1>

      <form
        onSubmit={async (e) => {
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

          const parsedDate = parseDateFromCZ(formData.pickupDate);
          if (!isValidDate(parsedDate, formData.pickupLocation, today)) {
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
              setLastOrder({ orderId: data.orderId, price: standardQty * stock.standardPrice + lowCholQty * stock.lowCholPrice });
              setShowQR(true);

              toast.success(`✅ Objednávka ${data.orderId} byla odeslána!`);

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
            } else {
              toast.error("❌ Nepodařilo se odeslat objednávku: " + (data.error || "Chyba serveru"));
            }
          } catch (err) {
            console.error("Order submit error:", err);
            toast.error("❌ Chyba při odesílání objednávky.");
          } finally {
            setLoading(false);
          }
        }}
      >
        {/* Osobní údaje */}
        <div className="mb-4">
          <label className="block mb-1">Jméno</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Telefon</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        {/* Místo vyzvednutí */}
        <div className="mb-4">
          <label className="block mb-1">Místo vyzvednutí</label>
          <select
            value={formData.pickupLocation}
            onChange={(e) => handleInputChange("pickupLocation", e.target.value)}
            className="border rounded px-2 py-1 w-full"
            required
          >
            <option value="">-- vyberte --</option>
            <option value="Dematic Ostrov u Stříbra 65">Dematic Ostrov u Stříbra 65</option>
            <option value="Honezovice">Honezovice</option>
          </select>
        </div>

        {/* Kalendář */}
        <div className="mb-4">
          <label className="block mb-1">Datum vyzvednutí</label>
          <DayPicker
            mode="single"
            selected={parseDateFromCZ(formData.pickupDate)}
            onSelect={handleDateSelect}
            disabled={disabledDate}
            ref={dayPickerRef}
          />
          {dateError && <p className="text-red-600">{dateError}</p>}
        </div>

        {/* Stav skladu a ceny */}
        <StockBox editable={false} initialStock={stock} />

        {/* Počet vajec */}
        <div className="mb-4 flex gap-4">
          <div>
            <label>Standardní vejce (ks)</label>
            <input
              type="number"
              value={formData.standardQuantity}
              onChange={(e) => handleInputChange("standardQuantity", e.target.value)}
              className="border rounded px-2 py-1 w-24"
            />
          </div>
          <div>
            <label>Vejce nízký cholesterol (ks)</label>
            <input
              type="number"
              value={formData.lowCholQuantity}
              onChange={(e) => handleInputChange("lowCholQuantity", e.target.value)}
              className="border rounded px-2 py-1 w-24"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          {loading ? "Odesílám..." : "Odeslat objednávku"}
        </button>
      </form>
    </div>
  );
// --- OrderForm.js: Část 4/4 ---

      {/* QR modal */}
      {showQR && lastOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl relative">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4">QR kód pro platbu</h2>
            <p className="mb-2">Číslo objednávky: <strong>{lastOrder.orderId}</strong></p>
            <p className="mb-4">Celková cena: <strong>{lastOrder.price} Kč</strong></p>
            <QRCodeCanvas
              value={getQrValue()}
              size={200}
              bgColor="#ffffff"
              fgColor="#000000"
            />
            <button
              onClick={() => setShowQR(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Zavřít
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
