"use client";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState({ show: false, message: "", type: "success" });
  const router = useRouter();

  // Fungsi Munculin Notif Custom
  const showAlert = (message, type = "success") => {
    setNotif({ show: true, message, type });
    // Kalau sukses login, jangan di-hide dulu biar user liat pesannya sebelum pindah page
    if (type !== "success") {
      setTimeout(() => setNotif({ show: false, message: "", type: "success" }), 3000);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      showAlert("Gagal Login: " + error.message, "error");
      setLoading(false);
    } else {
      showAlert("Login Berhasil! Mengalihkan...", "success");
      // Kasih jeda dikit biar notifnya kelihatan
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans relative overflow-hidden">
      
      {/* 1. CUSTOM TOAST NOTIFICATION */}
      {notif.show && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-8 py-4 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-top-10 duration-500 min-w-[300px] justify-center ${
          notif.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}>
          <span className="text-xl">{notif.type === "success" ? "✅" : "❌"}</span>
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">{notif.message}</span>
        </div>
      )}

      {/* BACKGROUND DECORATION */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"></div>

      <div className="bg-white p-10 rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] w-full max-w-md border border-slate-100 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block bg-blue-100 text-blue-600 p-4 rounded-[1.5rem] mb-6 animate-bounce">
             <span className="text-3xl">🚀</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-2 italic tracking-tighter uppercase">
            STEAM BERKAH
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
            Admin Control Panel
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-3 block group-focus-within:text-blue-500 transition-colors">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-slate-50 bg-slate-50 p-5 rounded-[1.5rem] focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-sm"
              placeholder="admin@steamberkah.com"
              required
            />
          </div>

          <div className="group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-3 block group-focus-within:text-blue-500 transition-colors">
              Password Access
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-slate-50 bg-slate-50 p-5 rounded-[1.5rem] focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${loading ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"} text-white font-black py-6 rounded-[2rem] transition-all shadow-2xl shadow-blue-200 uppercase tracking-widest text-xs italic`}
          >
            {loading ? "AUTHENTICATING..." : "MASUK KE DASHBOARD"}
          </button>
        </form>

        <div className="mt-10 text-center">
           <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">© 2026 Steam Berkah Management System</p>
        </div>
      </div>
    </div>
  );
}