import Layout from "../components/Layout";
import Image from "next/image";
import { useState } from "react";

export default function OFarme() {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const images = [
    { src: "/vajicka.jpg", alt: "Čerstvá vejce" },
    { src: "/slepice2.jpg", alt: "Slepice na farmě" },
    { src: "/kurnik2.jpg", alt: "Zateplený kurník" },
  ];

  const prevImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((lightboxIndex + images.length - 1) % images.length);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((lightboxIndex + 1) % images.length);
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">O naší farmě</h1>
      <p className="text-gray-700 leading-relaxed mb-4">
        Naše farma v Honezovicích je domovem <strong>13 slepic</strong>, které
        chováme v prostorném a <strong>zatepleném kurníku</strong> s venkovním
        výběhem. Slepice mají dostatek pohybu a přirozený denní rytmus.
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

      {/* Fotky farmy – miniatury */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {images.map((img, i) => (
          <div
            key={i}
            className="cursor-pointer overflow-hidden rounded-xl shadow-md w-40 h-32 relative"
            onClick={() => setLightboxIndex(i)}
          >
            <Image
              src={img.src}
              alt={img.alt}
              layout="fill"
              objectFit="cover"
              className="transform hover:scale-105 transition duration-300"
            />
          </div>
        ))}
      </div>

      {/* Lightbox overlay */}
      {lightboxIndex >= 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setLightboxIndex(-1)}
        >
          <button
            className="absolute top-5 right-5 text-white text-3xl font-bold"
            onClick={() => setLightboxIndex(-1)}
          >
            ×
          </button>
          <button
            className="absolute left-5 text-white text-3xl font-bold"
            onClick={prevImage}
          >
            ‹
          </button>
          <img
            src={images[lightboxIndex].src}
            alt={images[lightboxIndex].alt}
            className="max-h-[80vh] max-w-[90vw] rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-5 text-white text-3xl font-bold"
            onClick={nextImage}
          >
            ›
          </button>
        </div>
      )}

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
