import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

const ACCOUNT_DOMESTIC = "19-3296360227/0100"; 

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

  const [stock, setStock] = useState({ standardQuantity: 0, lowCholQuantity: 0 });
  const [prices, setPrices] = useState({ standardPrice: 0, lowCholPrice: 0 });
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const calendarRef = useRef(null);

  const totalPrice =
    (parseInt(formData.standardQuantity || 0, 10) * prices.standardPrice || 0) +
    (parseInt(formData.lowCholQuantity || 0, 10) * prices.lowCholPrice || 0);

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

  // načtení zásob a cen
  useEffect(() => {
    let mounted = true;
    async function fetchStock() {
      try {
        const res = await fetch("/api/stock");
        const json = await res.json();
        if (!mounted) return;
        setStock({
          standardQuantity: json.stock?.standard_quantity || 0,
          lowCholQuantity: json.stock?.low_chol_quantity || 0,
        });
        setPrices({
          standardPrice: json.prices?.standard_price || 0,
          lowCholPrice: json.prices?.low_chol_price || 0,
        });
      } catch (err) {
        if (!mounted) return;
        setStock({ standardQuantity: 0, lowCholQuantity: 0 });
        setPrices({ standardPrice: 0, lowCholPrice: 0 });
      }
    }
    fetchStock();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val =
      name === "standardQuantity" || name === "lowCholQuantity"
        ? value === ""
          ? ""
          : parseInt(value, 10)
        : value;

    // kontrola proti skladu
    if (name === "standardQuantity" && val > stock.standardQuantity) {
      toast.error(`❌ Maximálně lze objednat ${stock.standardQuantity} standardních vajec`);
      val = stock.standardQuantity;
    }
    if (name === "lowCholQuantity" && val > stock.lowCholQuantity) {
      toast.error(`❌ Maximálně lze objednat ${stock.lowCholQuantity} vajec se sníženým cholesterolem`);
      val = stock.lowCholQuantity;
    }

    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleAdd = (field, amount) => {
    setFormData((prev) => {
      const cur = parseInt(prev[field] || 0, 10);
      const max =
        field === "standardQuantity" ? stock.standardQuantity : stock.lowCholQuantity;
      const next = Math.min(max, cur + amount);
      return { ...prev, [field]: Math.max(0, next) };
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

    if (standardQty > stock.standardQuantity) {
      toast.error(`❌ Ve skladu je pouze ${stock.standardQuantity} standardních vajec`);
      return;
    }
    if (lowCholQty > stock.lowCholQuantity) {
      toast.error(`❌ Ve skladu je pouze ${stock.lowCholQuantity} vajec se sníženým cholesterolem`);
      return;
    }

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
        toast.success("✅ Objednávka byla úspěšně odeslána");
        setStock({
          standardQuantity: data.remaining?.standard ?? stock.standardQuantity,
          lowCholQuantity: data.remaining?.lowChol ?? stock.lowCholQuantity,
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
      <Toaster position="top-center" />

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
          </div>
        </div>
      )}

      <div className="mb-4 text-lg text-gray-700">
        <h2 className="font-bold mb-1 text-red-600">Aktuální dostupné množství</h2>
        <p>🥚 Standardní vejce: <strong>{stock.standardQuantity}</strong> ks ({prices.standardPrice} Kč/ks)</p>
        <p>🥚 Vejce se sníženým cholesterolem: <strong>{stock.lowCholQuantity}</strong> ks ({prices.lowCholPrice} Kč/ks)</p>
      </div>

      {/* formulář */}
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-6 space-y-4">
        {/* ... všechny vstupy jako předtím ... */}

        <div className="text-gray-800 font-semibold">
          Celková cena: <span className="text-green-700">{totalPrice} Kč</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-400 w-full px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 transform transition"
        >
          {loading ? "Odesílám..." : "Odeslat objednávku"}
        </button>
      </form>
    </div>
  );
}
