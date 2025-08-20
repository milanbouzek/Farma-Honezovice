import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Objednávka vajec - Farma Honezovice</title>
        <meta name="description" content="Objednejte čerstvá domácí vejce přímo z farmy" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10">
        <div className="w-full max-w-md bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h1 className="text-3xl font-bold mb-6 text-center">Objednávka vajec</h1>

          <form
            action="https://formspree.io/f/xjkoqoao"
            method="POST"
            className="flex flex-col gap-4"
          >
            {/* Počet vajec */}
            <div>
              <label htmlFor="quantity" className="block text-gray-700 font-bold mb-2">
                Počet vajec
              </label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                min="1"
                placeholder="Zadejte počet"
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            {/* Poznámky */}
            <div>
              <label htmlFor="notes" className="block text-gray-700 font-bold mb-2">
                Poznámky / specifikace
              </label>
              <textarea
                name="notes"
                id="notes"
                placeholder="Např. velikost vajec, datum odběru..."
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              ></textarea>
            </div>

            {/* Odeslat */}
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Odeslat objednávku
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
