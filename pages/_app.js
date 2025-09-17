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
            borderRadius: "12px",
            background: "#fff8dc",
            color: "#333",
            fontSize: "16px",
            padding: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          },
          success: {
            duration: 4000,
          },
          error: {
            duration: 5000,
          },
        }}
      />
    </>
  );
}
