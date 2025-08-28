import { useState } from "react";

export default function OFarme() {
  const [lightboxImage, setLightboxImage] = useState(null);

  const images = [
    { src: "/slepice.jpg", alt: "Slepice" },
    { src: "/kurnik.jpg", alt: "Kurník" },
    { src: "/vajicka.jpg", alt: "Vajíčka" },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-green-700">O naší farmě</h1>
      <p className="mb-4">
        Naše farma je domovem <strong>13 slepic</strong>, které žijí v
        zatepleném kurníku s prostorným venkovním výběhem. Krmíme je
        kvalitními granulemi, čerstvou trávou a doplňkově pšenicí, aby byla
        jejich vejce co nejchutnější a nejzdravější.
      </p>

      <h2 className="text-2xl font-bold mt-6 mb-4 text-green-700">Naše slepice</h2>
      <ul className="list-disc list-inside space-y-1 mb-6">
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

      {/* Galerie fotek */}
      <h2 className="text-2xl font-bold mt-6 mb-4 text-green-700">Fotogalerie</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {images.map((img, index) => (
          <img
            key={index}
            src={img.src}
            alt={img.alt}
            className="w-32 h-32 object-cover rounded-lg shadow cursor-pointer mx-auto"
            onClick={() => setLightboxImage(img.src)}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Zvětšený náhled"
            className="max-h-full max-w-full rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Video */}
      <h2 className="text-2xl font-bold mt-8 mb-4 text-green-700">Videoprohlídka kurníku</h2>
      <video controls className="mx-auto rounded-lg shadow-lg">
        <source src="/prohlidka-kurniku.mp4" type="video/mp4" />
        Váš prohlížeč nepodporuje přehrávání videa.
      </video>
    </div>
  );
}
