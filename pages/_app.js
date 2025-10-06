// pages/_app.js
import "../styles/globals.css";
import { Toaster } from "react-hot-toast";
import { AdminAuthProvider } from "../components/AdminAuthContext";

export default function App({ Component, pageProps }) {
  return (
    <AdminAuthProvider>
      <Component {...pageProps} />
      {/* Toaster (můžeš upravit styl jak chceš) */}
      <Toaster position="top-center" />
    </AdminAuthProvider>
  );
}
