import { useState } from "react";

export default function OFarme() {
  const [selectedImage, setSelectedImage] = useState(null);

  const images = [
    { src: "/slepice.jpg", alt: "Slepice na dvoře" },
    { src: "/kurnik.jpg", alt: "Kurník" },
    { src: "/vajicka.jpg", alt: "Vajíčka" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">🐔 O naší farmě</h1>

      {/* Text o farmě */}
      <p className="mb-4">
        Naše malá farma je domovem <strong>13 slepic</strong>, které bydlí v
        zatepleném kurníku s venkovním výběhem. Slepičky mají každý den přístup
        na čerstvý vzduch a zelenou trávu, což se odráží i na kvalitě vajíček.
        Krmíme je <strong>kvalitními granulemi</strong>, doplňkově{" "}
        <strong>pšenicí</strong> a samozřejmě nesmí chybět ani čerstvá tráva.
      </p>

      <p className="mb-4">
        Chováme různá plemena slepic, která nám dělají radost nejen svým
        vzhledem, ale i barevnou pestrostí vajec:
      </p>

      <ul className="list-disc list-inside mb-6">
        <li>DOMINANT ČERVENÝ D853</li>
        <li>Dominant Leghorn Černobílý D601</li>
        <li>Dominant Leghorn D229</li>
        <li>2× Dominant Modrý D107</li>
        <li>Dominant Žíhaný D959</li>
        <li>2× Dominant Vlaška koroptví D300</li>
        <li>Dominant Černý D109</li>
        <li>DOMINANT GREENSHELL</li>
        <li>DOMINANT BLUESHELL</li>
        <li>DOMINANT DARKSHELL</li>
        <li>DOMINANT DARKGREEN</li>
      </ul>

      <p className="mb-8">
        Díky této rozmanitosti u nás najdete vajíčka s klasickou hnědou a bílou
        skořápkou, ale také s modrým, zeleným či tmavším odstínem.
      </p>

      {/* Fotogalerie */}
      <h2 className="text-2xl font-semibold mb-4">📸 Fotogalerie</h2>
      <div className="flex gap-4 mb-8">
        {images.map((img, index) => (
          <img
            key={index}
            src={img.src}
            alt={img.alt}
            className="w-40 h-40 object-cover rounded-lg cursor-pointer shadow-md hover:scale-105 transition-transform"
            onClick={() => setSelectedImage(img.src)}
          />
        ))}
      </div>

      {/* Lightbox pro zvětšení obrázku */}
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

      {/* Video */}
      <h2 className="text-2xl font-semibold mb-4">🎥 Videoprohlídka kurníku</h2>
      <video
        controls
        className="w-full max-w-3xl rounded-lg shadow-lg"
        src="/prohlidka-kurniku.mp4"
        type="video/mp4"
      >
        Váš prohlížeč nepodporuje přehrávání videa.
      </video>
    </div>
  );
}
