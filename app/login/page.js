"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LogIn, 
  Mail, 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  ArrowRight
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState({ show: false, message: "", type: "success" });
  const router = useRouter();

  const showAlert = (message, type = "success") => {
    setNotif({ show: true, message, type });
    if (type !== "success") {
      setTimeout(() => setNotif({ show: false, message: "", type: "success" }), 4000);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      showAlert("Login Berhasil! Mengalihkan...", "success");
      
      // Redirect ke dashboard setelah login sukses
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

    } catch (err) {
      showAlert(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans antialiased text-slate-800">
      
      {/* --- NOTIFICATION --- */}
      {notif.show && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-top-4 duration-300 ${
          notif.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          {notif.type === "success" ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          <span className="text-xs font-bold">{notif.message}</span>
        </div>
      )}

      {/* BACKGROUND GRAPHIC */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200/80 w-full max-w-[440px] relative z-10 mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-[#1e293b] text-white rounded-2xl items-center justify-center shadow-lg shadow-slate-900/10 mb-4 border border-slate-800">
            <LogIn size={24} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-[#1e293b] tracking-tight uppercase">
            SELAMAT DATANG
          </h1>
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.22em] mt-2">
            Silakan Masuk ke Sistem
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">Email</label>
            <div className="flex items-center gap-2 bg-slate-50/50 border border-slate-200 p-3.5 rounded-xl focus-within:border-blue-500 transition-all">
              <Mail size={14} className="text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none font-medium text-xs text-slate-800"
                placeholder="admin@steamberkah.com"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">Password</label>
            <div className="flex items-center gap-2 bg-slate-50/50 border border-slate-200 p-3.5 rounded-xl focus-within:border-blue-500 transition-all">
              <Lock size={14} className="text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none font-medium text-xs text-slate-800"
                placeholder="********"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-12 mt-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
              loading ? "bg-slate-100 text-slate-400" : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>Masuk Sistem <ArrowRight size={14} /></>}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          <p className="text-xs font-semibold text-slate-400">
            Belum punya akun?
            <Link href="/register" className="text-emerald-600 ml-1.5 font-bold uppercase hover:underline">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}