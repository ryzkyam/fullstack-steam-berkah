"use client";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const router = useRouter();

  const showAlert = (message, type = "success") => {
    setNotif({ show: true, message, type });
    setTimeout(
      () => setNotif({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Validasi Password
    if (password !== confirmPassword) {
      return showAlert("Password Tidak Sama Bro! ❌", "error");
    }
    if (password.length < 6) {
      return showAlert("Password Minimal 6 Karakter! 🔑", "error");
    }

    setLoading(true);

    try {
      // 2. CEK KUOTA USER (MAKSIMAL 2)
      const { count, error: countError } = await supabase
        .from("Users")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;

      if (count >= 2) {
        setLoading(false);
        return showAlert("❌ KUOTA PENUH! MAKSIMAL 2 AKUN ADMIN.", "error");
      }

      // 3. Proses Auth Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;

      // 4. Input juga ke tabel Users custom lo biar sinkron
      if (authData.user) {
        await supabase.from("Users").insert([
          {
            Username: email.split("@")[0], // Ambil nama depan email sebagai username
            Password: password, // Note: Sebaiknya di-hash, tapi sesuai skema awal lo
            Role: "Admin",
          },
        ]);
      }

      showAlert("Akun Berhasil Dibuat! Silahkan Cek Email.", "success");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      showAlert(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans relative overflow-hidden">
      {/* CUSTOM TOAST NOTIFICATION */}
      {notif.show && (
        <div
          className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-8 py-4 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-top-10 duration-500 min-w-[320px] justify-center ${
            notif.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">
            {notif.message}
          </span>
        </div>
      )}

      {/* DEKORASI BACKGROUND */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl"></div>

      <div className="bg-white p-10 rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] w-full max-w-md border border-slate-100 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-800 mb-2 italic tracking-tighter uppercase">
            DAFTAR AKUN ⚡
          </h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">
            Registrasi Admin (Maks. 2 User)
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-slate-50 bg-slate-50 p-4 rounded-[1.5rem] focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-sm"
              placeholder="admin@steamberkah.com"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">
              Create Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-slate-50 bg-slate-50 p-4 rounded-[1.5rem] focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border-2 border-slate-50 bg-slate-50 p-4 rounded-[1.5rem] focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${loading ? "bg-slate-300" : "bg-emerald-500 hover:bg-emerald-600 active:scale-95"} text-white font-black py-5 rounded-[2rem] transition-all shadow-xl shadow-emerald-100 uppercase tracking-widest text-xs italic mt-4`}
          >
            {loading ? "CHECKING QUOTA..." : "DAFTAR SEKARANG"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs font-bold text-slate-400">
            Sudah punya akun?
            <Link
              href="/login"
              className="text-blue-600 ml-2 font-black uppercase tracking-tighter hover:underline"
            >
              Login Disini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
