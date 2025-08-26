import Layout from "../components/Layout";
import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function OFarme() {
  const [index, setIndex] = useState(-1);

  const images = [
    { src: "/vajicka.jpg", alt: "Čerstvá vejce" },
    { src: "/slepice2.JPEG", alt: "Slepice na farmě" },
    { src: "/kurnik2.JPEG", alt: "Zateplený kurník" },
  ];

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-4">O naší farmě</h1>
      <p className="text-gray-700 leading-relaxed mb-4">
        Naše farma v Honezovicích je domovem <strong>13 slepic</strong>, které
        chováme v prostorném a <strong>zatepleném kurníku</strong> s venkovním
        výběhem.
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

      {/* Fotky s Lightboxem */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {images.map((img, i) => (
          <div
            key={i}
            className="cursor-pointer overflow-hidden rounded-xl shadow-md"
            onClick={() => setIndex(i)}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={300}
              height={200}
              className="transform hover:scale-105 transition duration-300"
            />
          </div>
        ))}
      </div>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        slides={images.map(img => ({ src: img.src }))}
        index={index}
        plugins={[]}
      />

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
