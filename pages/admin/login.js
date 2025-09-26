import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  async function signInWithGitHub() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
    });
    if (error) {
      alert("❌ Chyba při přihlášení: " + error.message);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">🔑 Admin Login</h1>
        <p className="mb-6">Přihlaš se pomocí GitHub účtu.</p>
        <button
          onClick={signInWithGitHub}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Přihlásit se přes GitHub
        </button>
      </div>
    </div>
  );
}
