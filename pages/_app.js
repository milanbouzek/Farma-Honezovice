import "../styles/globals.css";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      {/* Toaster pro toast notifikace */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "16px",
            background: "#fff8dc",
            color: "#333",
            fontSize: "18px",          // větší text
            padding: "24px 32px",      // větší okno
            minWidth: "300px",         // minimální šířka
            maxWidth: "500px",         // maximální šířka
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
          },
          success: {
            duration: 5000,
          },
          error: {
            duration: 6000,
          },
        }}
      />
    </>
  );
}
