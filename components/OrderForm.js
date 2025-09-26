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

// Pomocné: z českého "prefix-account/bank" udělá IBAN CZxx... (použito pro QR SPD)
function computeIbanCheckDigits(countryCode, bban) {
  // převod písmen na čísla: A=10 ... Z=35
  const countryNums = countryCode
    .split("")
    .map((c) => (c.charCodeAt(0) - 55).toString())
    .join("");
  const rearranged = bban + countryNums + "00";
  // použijeme BigInt pro velká čísla
  const remainder = BigInt(rearranged) % 97n;
  const check = 98n - remainder;
  return String(check).padStart(2, "0");
}

function domesticToIBAN(domestic) {
  // očekává např. "19-3296360227/0100"
  if (!domestic || typeof domestic !== "string") return "";
  const parts = domestic.split("/");
  if (parts.length !== 2) return "";
  const left = parts[0].replace(/\D/g, ""); // prefix + account, bez pomlček
  const bank = parts[1].replace(/\D/g, "").padStart(4, "0").slice(-4);
  const accountPadded = left.padStart(16, "0").slice(-16);
  const bban = bank + accountPadded; // pro CZ: 4 + 16 = 20 znaků
  const check = computeIbanCheckDigits("CZ", bban);
  return `CZ${check}${bban}`;
}

export default function OrderForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    standardQuantity: "", // prázdné políčko (ne 0) - uživatelsky příjemnější
    lowCholQuantity: "",
    pickupLocation: "",
    pickupDate: "", // DD.MM.YYYY
  });

  const [stock, setStock] = useState({ standardQuantity: 0, lowCholQuantity: 0 });
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const calendarRef = useRef(null);

  // cena
  const totalPrice =
    (parseInt(formData.standardQuantity || 0, 10) * 5 || 0) +
    (parseInt(formData.lowCholQuantity || 0, 10) * 7 || 0);

  // dnešek (00:00)
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
    // "DD.MM.YYYY" -> Date
    if (!cz) return null;
    const [dd, mm, yyyy] = cz.split(".");
    if (!dd || !mm || !yyyy) return null;
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

  const isValidDate = (date, location = formData.pickupLocation) => {
    // date může být Date nebo string (pokud string, parse)
    let d = date instanceof Date ? new Date(date) : parseDateFromCZ(date);
    if (!d) return false;
    d.setHours(0, 0, 0, 0);
    if (d <= today) return false; // dnes i minulost zakázáno
    if (location === "Dematic Ostrov u Stříbra 65" && isWeekend(d)) return false;
    return true;
  };

  // načtení zásob (API)
  useEffect(() => {
    let mounted = true;
    async function fetchStock() {
      try {
        const res = await fetch("/api/stock");
        const json = await res.json();
        if (!mounted) return;
        setStock({
          standardQuantity: json.standardQuantity || 0,
          lowCholQuantity: json.lowCholQuantity || 0,
        });
      } catch (err) {
        if (!mounted) return;
        setStock({ standardQuantity: 0, lowCholQuantity: 0 });
      }
    }
    fetchStock();
    return () => {
      mounted = false;
    };
  }, []);

  // obecná změna pole
  const handleChange = (e) => {
    const { name, value } = e.target;
    // číselná pole chceme jako prázdné stringy nebo integer
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "standardQuantity" || name === "lowCholQuantity"
          ? value === ""
            ? ""
            : parseInt(value, 10)
          : value,
    }));
    // pokud měníme pickupLocation, zkontrolovat datum (uvidíme v onClick tlačítek)
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

    // pokud už je vyplněné datum, ověříme okamžitě
    if (formData.pickupDate) {
      const parsed = parseDateFromCZ(formData.pickupDate);
      if (!isValidDate(parsed, loc)) {
        // jasné chování: smažeme datum a ukážeme inline hlášku
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

  // výběr data z kalendáře (DayPicker)
  const handleDateSelect = (date) => {
    if (!date) return;
    // Normalize date to 00:00
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
    // využijeme stejnou validaci
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

  // odeslání formuláře
  const handleSubmit = async (e) => {
    e.preventDefault();

    const standardQty = parseInt(formData.standardQuantity || 0, 10);
    const lowCholQty = parseInt(formData.lowCholQuantity || 0, 10);
    const totalEggs = (standardQty || 0) + (lowCholQty || 0);

    // validace klientská
    if (totalEggs < 10 || totalEggs % 10 !== 0) {
      toast.error("❌ Minimální objednávka je 10 ks a vždy jen násobky 10.");
      return;
    }
    if (!formData.name || !formData.pickupLocation || !formData.pickupDate) {
      toast.error("❌ Vyplňte všechna povinná pole.");
      return;
    }

    // server-side-compatible kontrola data (převod)
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
        // pošleme datum jako DD.MM.YYYY (server pak převádí)
        body: JSON.stringify({
          ...formData,
          standardQuantity: standardQty,
          lowCholQuantity: lowCholQty,
        }),
      });
      const data = await res.json();

      if (data.success) {
        // uložíme pro QR modal
        setLastOrder({ orderId: data.orderId, price: totalPrice });
        setShowQR(true);

        // persistentní custom toast s křížkem (zůstane dokud zavřou)
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

        // aktualizovat stav skladu podle odpovědi
        setStock({
          standardQuantity: data.remaining?.standard ?? stock.standardQuantity,
          lowCholQuantity: data.remaining?.lowChol ?? stock.lowCholQuantity,
        });

        // vyčistit formulář
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

  // QR string pro SPD (Czech QR) - vytvoříme IBAN z domácího tvaru
  const getQrValue = () => {
    if (!lastOrder) return "";
    // převod domácího účtu do IBAN
    const iban = domesticToIBAN(ACCOUNT_DOMESTIC);
    // použijeme formát SPD*1.0*ACC:IBAN*AM:...*CC:CZK*X-VS:...
    // částku formátujeme s .00
    const amount = Number(lastOrder.price || 0).toFixed(2);
    return `SPD*1.0*ACC:${iban}*AM:${amount}*CC:CZK*X-VS:${lastOrder.orderId}`;
  };

  // DayPicker - disabled function: zákaz dneška & minulosti, případně víkend pro Dematic
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
      {/* Toaster se základním stylem (ostatní notifikace) */}
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

      {/* QR modal (vždy nad toasty) */}
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

      {/* Stav zásob */}
      <div className="mb-4 text-lg text-gray-700">
        <h2 className="font-bold mb-1 text-red-600">Aktuální dostupné množství</h2>
        <p>🥚 Standardní vejce: <strong>{stock.standardQuantity}</strong> ks (5 Kč/ks)</p>
        <p>🥚 Vejce se sníženým cholesterolem: <strong>{stock.lowCholQuantity}</strong> ks (7 Kč/ks)</p>
      </div>

      {/* Formulář */}
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-6 space-y-4">
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

        {/* Počet standardních vajec */}
        <div>
          <label className="block text-gray-700 mb-1">Počet standardních vajec</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="standardQuantity"
              value={formData.standardQuantity}
              onChange={handleChange}
              min="0"
              step="1"
              className="w-full border rounded-xl p-2"
            />
            <button type="button" onClick={() => handleAdd("standardQuantity", 5)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+5</button>
            <button type="button" onClick={() => handleAdd("standardQuantity", 10)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+10</button>
          </div>
        </div>

        {/* Low cholesterol */}
        <div>
          <label className="block text-gray-700 mb-1">Počet vajec se sníženým cholesterolem</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              name="lowCholQuantity"
              value={formData.lowCholQuantity}
              onChange={handleChange}
              min="0"
              step="1"
              className="w-full border rounded-xl p-2"
            />
            <button type="button" onClick={() => handleAdd("lowCholQuantity", 5)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+5</button>
            <button type="button" onClick={() => handleAdd("lowCholQuantity", 10)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">+10</button>
          </div>
        </div>

        {/* Cena */}
        <div className="text-gray-800 font-semibold">
          Celková cena: <span className="text-green-700">{totalPrice} Kč</span>
        </div>

        {/* Místo vyzvednutí (dvě tlačítka) */}
        <div>
          <label className="block text-gray-700 mb-1">Místo vyzvednutí *</label>
          <div className="flex gap-2">
            {["Dematic Ostrov u Stříbra 65", "Honezovice"].map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => handlePickupSelect(loc)}
                className={`px-4 py-2 rounded-xl font-semibold shadow-md ${formData.pickupLocation === loc ? "bg-green-500 text-white" : "bg-yellow-400 text-gray-900 hover:bg-yellow-500"}`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Datum vyzvednutí */}
        <div>
          <label className="block text-gray-700 mb-1">Datum vyzvednutí *</label>
          <input
            type="text"
            name="pickupDate"
            value={formData.pickupDate}
            onFocus={() => setShowCalendar(true)}
            readOnly
            placeholder="DD.MM.YYYY"
            className={`w-full border rounded-xl p-2 ${dateError ? "border-red-500" : ""}`}
          />

          {/* Kalendář se zobrazí až po kliknutí do pole */}
          {showCalendar && (
            <div ref={calendarRef} className="mt-2">
              <DayPicker
                mode="single"
                selected={formData.pickupDate ? parseDateFromCZ(formData.pickupDate) : undefined}
                onSelect={handleDateSelect}
                disabled={disabledFn}
                weekStartsOn={1}
              />
            </div>
          )}

          {/* inline chybová hláška */}
          {dateError && <p className="text-red-600 text-sm mt-1">{dateError}</p>}

          {/* rychlé volby */}
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => handleDateQuickPick(1)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">Zítra</button>
            <button type="button" onClick={() => handleDateQuickPick(2)} className="bg-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-500">Pozítří</button>
          </div>
        </div>

        {/* Odeslat */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-400 w-full px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 transform transition"
          >
            {loading ? "Odesílám..." : "Odeslat objednávku"}
          </button>
        </div>
      </form>
    </div>
  );
}
