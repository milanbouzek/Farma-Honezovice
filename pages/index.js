// pages/index.js
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Objednávka domácích vajec</title>
        <meta
          name="description"
          content="Jednoduchá objednávka domácích vajec přes webový formulář"
        />
      </Head>

      <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white shadow-md rounded px-8 py-6">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Objednávka vajec
          </h1>
          <form
            action="https://forms.office.com/e/PNiPQRv5Ci"
            method="get"
            target="_blank"
            className="space-y-4"
          >
            <div>
              <label className="block text-gray-700 mb-1">Jméno a příjmení</label>
              <input
                type="text"
                name="jmeno"
                required
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                name="email"
                required
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Telefon</label>
              <input
                type="tel"
                name="telefon"
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Počet vajec</label>
              <input
                type="number"
                name="pocet"
                min="1"
                required
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Poznámky</label>
              <textarea
                name="poznamka"
                className="w-full border p-2 rounded"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
            >
              Odeslat objednávku
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
