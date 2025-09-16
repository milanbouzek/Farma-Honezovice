import { useRouter } from "next/router";

export default function Potvrzeni() {
  const router = useRouter();
  const { id, price, name, standard, lowChol, pickupDate, pickupLocation } = router.query;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-green-700">Potvrzení objednávky</h1>
      <p><strong>Číslo objednávky:</strong> {id}</p>
      <p><strong>Zákazník:</strong> {name}</p>
      <p><strong>Standardní vejce:</strong> {standard} ks</p>
      <p><strong>Low-cholesterol vejce:</strong> {lowChol} ks</p>
      <p><strong>Místo vyzvednutí:</strong> {pickupLocation}</p>
      <p><strong>Datum vyzvednutí:</strong> {pickupDate}</p>
      <p className="mt-4 text-xl"><strong>Celková cena:</strong> {price} Kč</p>
    </div>
  );
}
