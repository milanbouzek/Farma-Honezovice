import Head from 'next/head'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <Head>
        <title>Domácí vejce – Objednávka</title>
        <meta name="description" content="Objednávkový formulář pro Domácí vejce" />
      </Head>

      <h1 className="text-3xl font-bold mb-6">Objednávka domácích vajec</h1>

      <form
        action="https://formspree.io/f/xjkoqoao"
        method="POST"
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-md"
      >
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Jméno
          </label>
          <input
            type="text"
            name="name"
            id="name"
            placeholder="Vaše jméno"
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            E-mail
          </label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="milan.bouzek@icloud.com"
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="order">
            Vaše objednávka
          </label>
          <textarea
            name="order"
            id="order"
            placeholder="Počet vajec, velikost, další poznámky..."
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Odeslat objednávku
          </button>
        </div>
      </form>
    </div>
  )
}
