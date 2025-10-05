import "../styles/globals.css";
import { Toaster } from "react-hot-toast";
import { AdminAuthProvider } from "../components/AdminAuthContext";

export default function App({ Component, pageProps }) {
  return (
    <AdminAuthProvider>
      <Component {...pageProps} />
      <Toaster
        position="top-center"
        toastOptions={{
          icon: null,
          style: {
            borderRadius: "16px",
            background: "#fff8dc",
            color: "#333",
            fontSize: "18px",
            padding: "24px",
            minWidth: "300px",
            maxWidth: "500px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          },
          success: { duration: 5000 },
          error: { duration: 6000 },
        }}
      />
    </AdminAuthProvider>
  );
}
