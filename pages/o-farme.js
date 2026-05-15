import Layout from "../components/Layout";
import { useState } from "react";

export default function OFarme() {
  const [selectedImage, setSelectedImage] = useState(null);

  const images = [
    { src: "/slepice.jpg", alt: "Slepice na dvoře" },
    { src: "/slepice2.jpg", alt: "Další slepice" },
    { src: "/kurnik.jpg", alt: "Kurník" },
    { src: "/vajicka.jpg", alt: "Vajíčka" },
  ];

  return (
    <Layout>
      <h1 className="text-4xl font-bold mb-6 text-center text-yellow-800">
        🐔 O naší farmě
      </h1>

      <p className="mb-4 text-lg leading-relaxed text-gray-700">
        Naše malá farma je domovem <strong>18 slepic</strong>, které bydlí v
        zatepleném kurníku s venkovním výběhem. Slepičky mají každý den přístup
        na čerstvý vzduch a zelenou trávu, což se odráží i na kvalitě vajíček.
        Krmíme je <strong>kvalitními granulemi</strong>, doplňkově{" "}
        <strong>pšenicí</strong> a samozřejmě nesmí chybět ani čerstvá zeleň.
      </p>

      <p className="mb-4 text-lg leading-relaxed text-gray-700">
        Chováme různá plemena slepic, která nám dělají radost nejen svým
        vzhledem, ale i barevnou pestrostí vajec:
      </p>

      <ul className="list-disc list-inside mb-6 text-gray-700">
        <li>DOMINANT ČERVENÝ D853</li>
        <li>Dominant Leghorn Černobílý D601</li>
        <li>Dominant Leghorn D229</li>
        <li>2× Dominant Modrý D107</li>
        <li>Dominant Žíhaný D959</li>
        <li>2× Dominant Vlaška koroptví D300</li>
        <li>Dominant Černý D109</li>
        <li>Dominant Greenshell</li>
        <li>3x Dominant Blueshell</li>
        <li>Dominant Darkshell</li>
        <li>Dominant Darkgreen</li>
        <li>Dominant Lila</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4 text-yellow-700">📸 Fotogalerie</h2>
      <div className="flex flex-wrap gap-4 mb-8 justify-center">
        {images.map((img, index) => (
          <img
            key={index}
            src={img.src}
            alt={img.alt}
            className="w-28 h-28 object-cover rounded-lg cursor-pointer shadow-md hover:scale-105 transition-transform"
            onClick={() => setSelectedImage(img.src)}
          />
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Zvětšený obrázek"
            className="max-w-3xl max-h-[90%] rounded-lg shadow-lg"
          />
        </div>
      )}
    </Layout>
  );
}
