import { useRouter } from "next/router";

export default function Potvrzeni() {
  const router = useRouter();
  const {
    orderId,
    totalPrice,
    name,
    email,
    phone,
    standardQuantity,
    lowCholQuantity,
    pickupLocation,
    pickupDate,
  } = router.query;

  if (!orderId) {
    return <p>Načítám údaje o objednávce...</p>;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 max-w-xl mx-auto mt-10 text-gray-700">
      <h1 className="text-2xl font-bold mb-4 text-green-700">✅ Objednávka potvrzena</h1>
      <p><strong>Číslo objednávky:</strong> {orderId}</p>
      <p><strong>Celková cena:</strong> {totalPrice} Kč</p>

      <h2 className="mt-6 mb-2 font-bold">Detaily objednávky:</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Jméno:</strong> {name}</li>
        {email && <li><strong>Email:</strong> {email}</li>}
        {phone && <li><strong>Telefon:</strong> {phone}</li>}
        <li><strong>Standardní vejce:</strong> {standardQuantity} ks</li>
        <li><strong>Low-cholesterol vejce:</strong> {lowCholQuantity} ks</li>
        <li><strong>Místo vyzvednutí:</strong> {pickupLocation}</li>
        <li><strong>Datum vyzvednutí:</strong> {pickupDate}</li>
      </ul>

      <p className="mt-6 text-sm text-gray-500">Děkujeme za vaši objednávku. Těšíme se na vás! 🐔🥚</p>
    </div>
  );
}
