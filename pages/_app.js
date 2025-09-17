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
            fontSize: "18px",
            padding: "24px",          // jednotné odsazení
            minWidth: "300px",
            maxWidth: "500px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            display: "flex",
            justifyContent: "center", // vycentrování horizontálně
            alignItems: "center",     // vycentrování vertikálně
            textAlign: "center",      // text uprostřed
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
