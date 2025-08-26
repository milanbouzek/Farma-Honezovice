import Sidebar from "../components/Sidebar";

export default function Objednavka() {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-yellow-50 p-8 flex flex-col items-center">
        <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-lg text-center space-y-6">
          <h1 className="text-3xl font-bold text-green-700">Objednávka vajec</h1>
          <p className="text-gray-700">
            Klikněte na tlačítko níže a vyplňte objednávku. Po odeslání se vaše objednávka propíše do systému.
          </p>
          <button
            onClick={() => window.open("https://forms.office.com/Pages/ResponsePage.aspx?id=4CjHEwy790yOEFsycnnW2SR3troeGgtNqAxWTGDgi7RUREtDQ0dHUUNFMUlMRzZQWENHWUswUFlYUi4u", "_blank", "width=800,height=700")}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-green-700 hover:animate-bounce transition"
          >
            Vyplnit objednávku
          </button>
        </div>
      </div>
    </div>
  );
}
