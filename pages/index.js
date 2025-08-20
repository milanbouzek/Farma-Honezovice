export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50 px-4">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-yellow-700 mb-6">
          Objednávka domácích vajec 🥚
        </h1>
        <form
          action="mailto:milan.bouzek@icloud.com"
          method="POST"
          encType="text/plain"
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Jméno a příjmení</label>
            <input
              type="text"
              name="jmeno"
              required
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Počet vajec (ks)</label>
            <input
              type="number"
              name="pocet"
              required
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-600 text-white py-3 px-4 rounded-xl shadow hover:bg-yellow-700 transition"
          >
            Odeslat objednávku
          </button>
        </form>
      </div>
    </div>
  )
}