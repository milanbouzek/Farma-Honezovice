export default function Objednavka() {
  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-6">
      <div className="max-w-2xl bg-white shadow-xl rounded-2xl p-8 w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Objednávka vajec</h1>

        <form className="space-y-4">
          <div>
            <label className="block text-gray-700">Jméno a příjmení</label>
            <input
              type="text"
              name="jmeno"
              className="w-full border p-2 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700">E-mail</label>
            <input
              type="email"
              name="email"
              className="w-full border p-2 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700">Počet vajec</label>
            <input
              type="number"
              name="pocet"
              min="1"
              max="60"
              className="w-full border p-2 rounded-lg"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
