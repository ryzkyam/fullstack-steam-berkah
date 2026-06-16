"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  UserPlus, 
  Mail, 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  KeyRound
} from "lucide-react";

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
    if (type !== "success") {
      setTimeout(() => setNotif({ show: false, message: "", type: "success" }), 4000);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Validasi Password Berbantuan
    if (password !== confirmPassword) {
      return showAlert("Konfirmasi password tidak cocok! ❌", "error");
    }
    if (password.length < 6) {
      return showAlert("Password minimal harus 6 karakter! 🔑", "error");
    }

    setLoading(true);

    try {
      // 2. CEK KUOTA USER (MAKSIMAL 2 AKUN SESUAI SOP)
      const { count, error: countError } = await supabase
        .from("Users")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;

      if (count >= 2) {
        setLoading(false);
        return showAlert("❌ Kuota penuh! Maksimal hanya diizinkan 2 akun admin.", "error");
      }

      // 3. Proses Registrasi Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;

      // 4. Sinkronisasi Data ke Tabel Users Custom
      if (authData.user) {
        await supabase.from("Users").insert([
          {
            Username: email.split("@")[0], // Menggunakan prefix email sebagai username default
            Password: password, 
            Role: "Admin",
          },
        ]);
      }

      showAlert("Registrasi Berhasil! Silakan verifikasi email Anda.", "success");
      
      setTimeout(() => {
        router.push("/login");
      }, 2500);

    } catch (err) {
      showAlert(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans antialiased text-slate-800">
      
      {/* --- FLOATING NOTIFICATION BANNER --- */}
      {notif.show && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-top-4 duration-300 min-w-[320px] max-w-md ${
          notif.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <div className={`p-1 rounded-lg ${notif.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
            {notif.type === "success" ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
              {notif.type === "success" ? "Registrasi Sukses" : "Pendaftaran Gagal"}
            </span>
            <span className="text-[10px] font-medium text-slate-500 mt-0.5">{notif.message}</span>
          </div>
        </div>
      )}

      {/* BACKGROUND GRAPHIC EMBELLISHMENTS */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]"></div>

      {/* CORE FORM BOX CONTAINER */}
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200/80 w-full max-w-[440px] relative z-10 mx-4">
        
        {/* BRANDING LOGO & SUBTITLE */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-[#1e293b] text-white rounded-2xl items-center justify-center shadow-lg shadow-slate-900/10 mb-4 border border-slate-800">
            <UserPlus size={24} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-[#1e293b] tracking-tight uppercase leading-none">
            BUAT AKUN BARU
          </h1>
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.22em] mt-2">
            Registrasi Admin Utama (Kuota Maks. 2 User)
          </p>
        </div>

        {/* INPUT CONTROL FORM */}
        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* Email Form */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 ml-1">
              <Mail size={14} className="text-slate-400" /> Alamat Email Resmi
            </label>
            <div className="flex items-center gap-2 bg-slate-50/50 border border-slate-200 p-3.5 rounded-xl focus-within:border-blue-500 focus-within:bg-white transition-all">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none font-medium text-xs text-slate-800"
                placeholder="admin@steamberkah.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Create Password Form */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 ml-1">
              <Lock size={14} className="text-slate-400" /> Buat Kata Sandi
            </label>
            <div className="flex items-center gap-2 bg-slate-50/50 border border-slate-200 p-3.5 rounded-xl focus-within:border-blue-500 focus-within:bg-white transition-all">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none font-medium text-xs text-slate-800 tracking-wide"
                placeholder="Minimal 6 karakter"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Confirm Password Form */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 ml-1">
              <KeyRound size={14} className="text-slate-400" /> Ulangi Kata Sandi
            </label>
            <div className="flex items-center gap-2 bg-slate-50/50 border border-slate-200 p-3.5 rounded-xl focus-within:border-blue-500 focus-within:bg-white transition-all">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent outline-none font-medium text-xs text-slate-800 tracking-wide"
                placeholder="Konfirmasi kata sandi"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full h-12 mt-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
              loading 
                ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/10 active:scale-[0.99]"
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin text-emerald-500" />
                <span>Memeriksa Kuota...</span>
              </>
            ) : (
              <span>Daftarkan Akun ⚡</span>
            )}
          </button>
        </form>

        {/* LOGIN LINK FOOTER */}
        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          <p className="text-xs font-semibold text-slate-400">
            Sudah terdaftar sebelumnya?
            <Link
              href="/login"
              className="text-blue-600 ml-1.5 font-bold uppercase tracking-tight hover:underline inline-flex items-center gap-1 align-middle"
            >
              Masuk Disini <ArrowLeft size={12} className="rotate-180" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}