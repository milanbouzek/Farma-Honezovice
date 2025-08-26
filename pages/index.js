import Image from "next/image";
import Sidebar from "../components/Sidebar";

export default function Home() {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-yellow-50 p-8 flex flex-col items-center">
        <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-lg text-center space-y-6">
          <h1 className="text-3xl font-bold text-green-700 animate-fadeIn">Vejce z malochovu</h1>

          <p className="text-gray-700 leading-relaxed animate-fadeIn delay-200">
            Čerstvá nebalená vejce mohou být prodána nejpozději <strong>21 dnů po snášce</strong>.
            Datum minimální trvanlivosti je <strong>28 dnů po snášce</strong>.
          </p>

          <div className="my-6">
            <Image
              src="/vajicka.jpg"
              alt="Vajíčka z malochovu"
              width={600}
              height={400}
              className="rounded-xl shadow-md mx-auto hover:scale-105 transition-transform duration-300"
            />
          </div>

          <p className="text-gray-700 leading-relaxed animate-fadeIn delay-400">
            Uchovávejte při nekolísavé teplotě <strong>+5 až +18 °C</strong>.
          </p>

          <button
            onClick={() => window.open("/objednavka", "_blank", "width=800,height=700")}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-green-700 hover:animate-bounce transition"
          >
            Objednat vajíčka
          </button>
        </div>
      </div>
    </div>
  );
}
