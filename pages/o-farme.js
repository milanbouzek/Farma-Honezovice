import Layout from "../components/Layout";
import Image from "next/image";

export default function OFarme() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">O naší farmě</h1>
      <p className="text-gray-700 leading-relaxed mb-4">
        Naše farma v Honezovicích je domovem <strong>13 slepic</strong>, které
        chováme v prostorném a <strong>zatepleném kurníku</strong> s venkovním
        výběhem. Slepice mají dostatek pohybu a přirozený denní rytmus.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        Krmíme je kvalitními granulemi, čerstvou trávou a doplňkově pšenicí,
        aby byla vejce bohatá na živiny a měla výbornou chuť.
      </p>

      <h2 className="text-2xl font-semibold text-green-700 mb-2">Plemena slepic</h2>
      <ul className="list-disc list-inside text-gray-700 mb-6">
        <li>Dominant Červený D853</li>
        <li>Dominant Leghorn Černobílý D601</li>
        <li>Dominant Leghorn D229</li>
        <li>Dominant Modrý D107 (2x)</li>
        <li>Dominant Žíhaný D959</li>
        <li>Dominant Vlaška koroptví D300 (2x)</li>
        <li>Dominant Černý D109</li>
        <li>Dominant Greenshell</li>
        <li>Dominant Blueshell</li>
        <li>Dominant Darkshell</li>
        <li>Dominant Darkgreen</li>
      </ul>

      {/* Fotky farmy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Image
          src="/vajicka.jpg"
          alt="Čerstvá vejce"
          width={400}
          height={300}
          className="rounded-xl shadow-md hover:scale-105 transform transition duration-300"
        />
        <Image
          src="/slepice2.JPEG"
          alt="Slepice na farmě"
          width={400}
          height={300}
          className="rounded-xl shadow-md hover:scale-105 transform transition duration-300"
        />
        <Image
          src="/kurnik2.JPEG"
          alt="Zateplený kurník"
          width={400}
          height={300}
          className="rounded-xl shadow-md hover:scale-105 transform transition duration-300"
        />
      </div>

      {/* Video */}
      <h2 className="text-2xl font-semibold text-green-700 mt-10 mb-4">
        Videoprohlídka kurníku
      </h2>
      <video
        src="/prohlidka-kurniku.mp4"
        controls
        className="w-full max-w-3xl mx-auto rounded-xl shadow-md"
      />
    </Layout>
  );
}
