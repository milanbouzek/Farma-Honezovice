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
