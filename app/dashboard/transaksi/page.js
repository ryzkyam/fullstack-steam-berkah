"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BrainCircuit,
  ClipboardList,
  History,
  LayoutDashboard,
  Menu,
  Package,
  PlusCircle,
  Receipt,
  Users,
  Wallet,
  X,
  RefreshCw,
  CheckCircle2,
  MapPin,
  Sparkles,
  UserCheck,
  User,
  Activity,
  DollarSign,
  Lock,
  UserX,
  ShieldCheck,
  KeyRound
} from "lucide-react";

// --- KONFIGURASI MENU LAYANAN ---
const LAYANAN_OPTIONS = [
  { nama: "CUCI STANDARD", extra: 0 },
  { nama: "CUCI STANDARD + WAX", extra: 5000 },
  { nama: "CUCI DETAILING", extra: 15000 },
  { nama: "CUCI MESIN", extra: 10000 },
];

export default function TransaksiPage() {
  const router = useRouter();
  
  // Sesi Aktif Riwayat Login Real-Time
  const [activeUserEmail, setActiveUserEmail] = useState("");
  const [realProfile, setRealProfile] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(true); // Membantu presentasi sidang di depan dosen

  // State simulasi untuk presentasi (hanya aktif jika isDemoMode = true)
  const [userRole, setUserRole] = useState("operator"); 
  const [userBranchId, setUserBranchId] = useState("1"); 

  // Master Data State
  const [transaksis, setTransaksis] = useState([]);
  const [karyawans, setKaryawans] = useState([]);
  const [filteredKaryawans, setFilteredKaryawans] = useState([]);
  const [motors, setMotors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Controls
  const [selectedMotorId, setSelectedMotorId] = useState("");
  const [selectedLayanan, setSelectedLayanan] = useState("");
  const [selectedTarif, setSelectedTarif] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState("");

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const pathname = usePathname();

  // Metrics Live Real-Time
  const [totalOmsetHariIni, setTotalOmsetHariIni] = useState(0);
  const [totalUnitHariIni, setTotalUnitHariIni] = useState(0);

  const formatRupiah = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  // 1. DETEKSI SESI LOGIN USER SECARA REAL-TIME DARI SUPABASE AUTH
  const checkUserSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setActiveUserEmail(session.user.email);
        
        // Cari role dan branch_id dari tabel profiles database
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, branch_id, nama")
          .eq("id", session.user.id)
          .single();

        if (profile && !error) {
          setRealProfile(profile);
          // Jika tidak dalam mode demo presentasi, pakai data sesi riil database
          if (!isDemoMode) {
            setUserRole(profile.role);
            if (profile.branch_id) {
              setUserBranchId(profile.branch_id.toString());
            }
          }
        }
      } else {
        // Jika tidak dalam mode demo dan tidak ada login, paksa ke halaman login
        if (!isDemoMode) {
          router.push("/login");
        }
      }
    } catch (err) {
      console.error("Gagal verifikasi sesi user:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const hariIniMulai = new Date();
      hariIniMulai.setHours(0, 0, 0, 0);
      const isoStringHariIni = hariIniMulai.toISOString();

      // Query Builder Supabase untuk Live Metrics & Riwayat harian
      let queryLive = supabase.from("Transaksis").select("Total").gte("Tanggal", isoStringHariIni);
      let queryRiwayat = supabase.from("Transaksis").select(`*, customers ( nama )`).order("Id", { ascending: false }).limit(20);

      // KONDISI LEVEL USER: Filter data HANYA dari cabang bertugas jika bukan Owner
      const currentRole = isDemoMode ? userRole : (realProfile?.role || "operator");
      const currentBranch = isDemoMode ? userBranchId : (realProfile?.branch_id?.toString() || "1");

      if (currentRole !== "owner" && currentBranch) {
        queryLive = queryLive.eq("branch_id", parseInt(currentBranch));
        queryRiwayat = queryRiwayat.eq("branch_id", parseInt(currentBranch));
      }

      const [resT, resK, resM, resB, resC, resLive] = await Promise.all([
        queryRiwayat,
        supabase.from("Karyawans").select("Id, Nama, branch_id"),
        supabase.from("Motors").select("Id, Kategori, Tarif"),
        supabase.from("branches").select("id, nama_cabang"),
        supabase.from("customers").select("id, nama"),
        queryLive
      ]);

      setTransaksis(resT.data || []);
      setKaryawans(resK.data || []);
      setMotors(resM.data || []);
      setBranches(resB.data || []);
      setCustomers(resC.data || []);

      // Hitung agregat mutasi real-time harian
      const dataHariIni = resLive.data || [];
      const kalkulasiOmset = dataHariIni.reduce((sum, t) => sum + (t.Total || 0), 0);
      
      setTotalOmsetHariIni(kalkulasiOmset);
      setTotalUnitHariIni(dataHariIni.length);

      // AUTO-LOCK CABANG FORM: Kunci otomatis jika staff/admin cabang
      if (currentRole !== "owner" && currentBranch) {
        setSelectedBranch(currentBranch);
        const filtered = (resK.data || []).filter(
          (k) => String(k.branch_id) === String(currentBranch)
        );
        setFilteredKaryawans(filtered);
      } else {
        setSelectedBranch("");
        setFilteredKaryawans([]);
      }

    } catch (err) {
      console.error("Gagal tarik data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserSession();
  }, [isDemoMode]);

  useEffect(() => {
    fetchData();
  }, [userRole, userBranchId, realProfile, isDemoMode]);

  const handleBranchChange = (e) => {
    const currentRole = isDemoMode ? userRole : (realProfile?.role || "operator");
    if (currentRole !== "owner") return; 

    const branchId = e.target.value;
    setSelectedBranch(branchId);
    if (!branchId) {
      setFilteredKaryawans([]);
    } else {
      const filtered = karyawans.filter(
        (k) => String(k.branch_id) === String(branchId)
      );
      setFilteredKaryawans(filtered);
    }
  };

  const hitungTotalHarga = (motorId, namaLayanan) => {
    const motor = motors.find((m) => String(m.Id) === String(motorId));
    const layanan = LAYANAN_OPTIONS.find((l) => l.nama === namaLayanan);

    if (motor && layanan) {
      setSelectedTarif(motor.Tarif + layanan.extra);
    } else if (motor) {
      setSelectedTarif(motor.Tarif);
    } else {
      setSelectedTarif(0);
    }
  };

  const handleMotorChange = (e) => {
    const mId = e.target.value;
    setSelectedMotorId(mId);
    hitungTotalHarga(mId, selectedLayanan);
  };

  const handleLayananChange = (e) => {
    const lNama = e.target.value;
    setSelectedLayanan(lNama);
    hitungTotalHarga(selectedMotorId, lNama);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const currentRole = isDemoMode ? userRole : (realProfile?.role || "operator");
    const currentBranch = isDemoMode ? userBranchId : (realProfile?.branch_id?.toString() || "1");

    // Lapis Proteksi 1: Tolak jika Owner mencoba menginput data
    if (currentRole === "owner") {
      setAlertMsg("❌ SOP WARNING: Akun Owner dilarang keras menginput transaksi langsung. Silakan ganti peran ke Operator!");
      setShowAlert(true);
      return;
    }

    const formData = new FormData(e.target);
    const finalBranchId = currentRole !== "owner" ? currentBranch : selectedBranch;

    if (!selectedLayanan || !selectedMotorId || !finalBranchId) {
      setAlertMsg("❌ Mohon lengkapi seluruh isian data kasir!");
      setShowAlert(true);
      return;
    }

    const newTransaksi = {
      Layanan: selectedLayanan,
      Total: parseInt(selectedTarif),
      Tanggal: new Date().toISOString(),
      MotorId: parseInt(selectedMotorId),
      KaryawanId: parseInt(formData.get("karyawanId")),
      branch_id: parseInt(finalBranchId),
      customer_id: parseInt(formData.get("customerId")),
    };

    const { error } = await supabase.from("Transaksis").insert([newTransaksi]);

    if (error) {
      setAlertMsg("❌ Gagal Menyimpan: " + error.message);
      setShowAlert(true);
    } else {
      setAlertMsg(`Transaksi ${selectedLayanan} sukses disimpan secara real-time! 🚀`);
      setShowAlert(true);

      e.target.reset();
      setSelectedLayanan("");
      setSelectedMotorId("");
      setSelectedTarif(0);
      if (currentRole === "owner") {
        setSelectedBranch("");
        setFilteredKaryawans([]);
      }
      fetchData();
    }
  };

  const activeRoleText = isDemoMode ? userRole : (realProfile?.role || "operator");

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans antialiased text-slate-800 relative overflow-x-hidden">
      
      {/* --- SIMULATOR PANEL (TOMBOL PRESENTASI DEMO MAHASISWA) --- */}
      <div className="fixed bottom-6 right-6 z-[300] bg-[#1e293b] text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex flex-col gap-2 max-w-[290px]">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <span className="text-[10px] tracking-widest font-black text-amber-400">🛡️ MODE DEMO SIDANG</span>
          <button 
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`px-2 py-0.5 rounded text-[8px] font-bold ${isDemoMode ? "bg-amber-500 text-slate-950" : "bg-slate-700 text-slate-300"}`}
          >
            {isDemoMode ? "DEMO: ON" : "REAL SESSION"}
          </button>
        </div>

        {isDemoMode ? (
          <div className="space-y-2 text-[11px]">
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1">PILIH PERAN DEMO</label>
              <select 
                value={userRole} 
                onChange={(e) => {
                  setUserRole(e.target.value);
                  if (e.target.value === "owner") {
                    setSelectedBranch("");
                  }
                }}
                className="w-full border border-slate-600 p-2 rounded-lg text-xs bg-slate-800 text-white font-semibold outline-none"
              >
                <option value="operator">Operator (Kasir)</option>
                <option value="admin_cabang">Admin Cabang</option>
                <option value="owner">Owner (Read-Only)</option>
              </select>
            </div>

            {userRole !== "owner" && (
              <div>
                <label className="text-[9px] text-slate-400 font-bold block mb-1">CABANG TUGAS</label>
                <select 
                  value={userBranchId}
                  onChange={(e) => setUserBranchId(e.target.value)}
                  className="w-full border border-slate-600 p-2 rounded-lg text-xs bg-slate-800 text-white font-semibold outline-none"
                >
                  <option value="1">Cabang 1 - Depok</option>
                  <option value="2">Cabang 2 - Jakarta</option>
                  <option value="3">Cabang 3 - Tangerang</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[10px] space-y-1 py-1 text-slate-300">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck size={12} /> SECURE DATABASE ACTIVE
            </div>
            <p className="truncate"><span className="text-slate-500">User:</span> {activeUserEmail || "Guest"}</p>
            <p className="uppercase"><span className="text-slate-500">Role:</span> {realProfile?.role || "None"}</p>
          </div>
        )}
      </div>

      {/* --- ALERT MODAL --- */}
      {showAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center border border-slate-100">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${alertMsg.includes("❌") ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Sistem Kasir Notification</h3>
            <p className="text-slate-500 text-xs font-medium mb-6">{alertMsg}</p>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all text-xs"
            >
              OK, LANJUTKAN
            </button>
          </div>
        </div>
      )}

      {/* MOBILE TRIGGER */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] bg-white text-slate-700 p-2.5 rounded-xl shadow-sm border border-slate-200"
      >
        <Menu size={18} />
      </button>

      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-[60] w-64 h-screen bg-[#1e293b] text-slate-200 p-5 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} shadow-xl flex flex-col justify-between`}
      >
        <div>
          <div className="flex justify-between items-center mb-8 px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm">SB</div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white uppercase leading-none">STEAM BERKAH</h2>
                <p className="text-[9px] font-semibold text-slate-500 tracking-wider mt-1 uppercase">Management System</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1 text-sm font-medium opacity-95 overflow-y-auto flex-1 pr-1 scrollbar-hide">
            <p className="px-4 py-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pustaka Utama</p>
            
            {(activeRoleText === "owner" || activeRoleText === "admin_cabang") && (
              <Link href="/dashboard" onClick={() => setIsSidebarOpen(false)}>
                <div className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${pathname === "/dashboard" ? "bg-blue-600 text-white font-semibold shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
                  <LayoutDashboard size={16} /> Monitoring Utama
                </div>
              </Link>
            )}

            {activeRoleText === "owner" && (
              <Link href="/dashboard/analytics" onClick={() => setIsSidebarOpen(false)}>
                <div className="px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all font-bold flex items-center gap-3 my-2 shadow-sm">
                  <BrainCircuit size={16} /> Analitik AI (Prophet)
                </div>
              </Link>
            )}

            <p className="px-4 py-1.5 mt-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Operasional & Log</p>
            
            <Link href="/dashboard/transaksi" onClick={() => setIsSidebarOpen(false)}>
              <div className={`px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all ${pathname === "/dashboard/transaksi" ? "bg-blue-600 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
                <Receipt size={14} /> Input Transaksi
              </div>
            </Link>

            <Link href="/dashboard/laporan-harian" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3">
                <ClipboardList size={14} /> Laporan Harian
              </div>
            </Link>

            {(activeRoleText === "owner" || activeRoleText === "admin_cabang") && (
              <>
                <Link href="/dashboard/jasa-operator" onClick={() => setIsSidebarOpen(false)}>
                  <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3">
                    <History size={14} /> Gaji per-Operator
                  </div>
                </Link>
                <Link href="/dashboard/pengeluaran" onClick={() => setIsSidebarOpen(false)}>
                  <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3">
                    <Wallet size={14} /> Biaya Pengeluaran
                  </div>
                </Link>
                <Link href="/dashboard/stock" onClick={() => setIsSidebarOpen(false)}>
                  <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3">
                    <Package size={14} /> Stok Barang
                  </div>
                </Link>
                <Link href="/dashboard/karyawan" onClick={() => setIsSidebarOpen(false)}>
                  <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3">
                    <Users size={14} /> Manajemen Karyawan
                  </div>
                </Link>
              </>
            )}

            {activeRoleText === "owner" && (
              <>
                <div className="h-px bg-slate-800 my-4"></div>
                <Link href="/dashboard/branches" onClick={() => setIsSidebarOpen(false)}>
                  <div className="px-4 py-3 rounded-xl hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/20 flex items-center gap-3 transition-all font-semibold">
                    <PlusCircle size={14} /> New Branch Unit
                  </div>
                </Link>
              </>
            )}
          </nav>
        </div>
        
        {/* Live Sidebar Metrics Panel */}
        <div className="border-t border-slate-800 pt-4 mt-auto space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-inner">
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
              <span className="text-[9px] font-bold text-blue-400 tracking-wider flex items-center gap-1">
                <Activity size={10} /> MONITOR {activeRoleText === "owner" ? "GLOBAL" : "CABANG"}
              </span>
              <span className="text-[8px] bg-blue-600 text-white px-2 py-0.2 rounded-full font-bold uppercase tracking-wider">
                Hari Ini
              </span>
            </div>

            <div className="mb-2">
              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Omset</p>
              <p className="text-sm font-bold text-emerald-400 tracking-tight">{formatRupiah(totalOmsetHariIni)}</p>
            </div>

            <div>
              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Volume Unit</p>
              <p className="text-sm font-bold text-blue-400 tracking-tight">{totalUnitHariIni} Kendaraan</p>
            </div>
          </div>

          <button 
            onClick={fetchData}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-all border border-slate-700/60 flex items-center justify-center gap-2"
          >
            <RefreshCw size={12} className={loading ? "animate-spin text-blue-400" : "text-slate-400"} />
            Sinkron Data Kasir
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-6 md:p-10 w-full max-w-5xl mx-auto min-w-0">
        
        <div className="mb-6 border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
              Kasir Utama Steam Berkah
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {activeRoleText === "owner" 
                ? "Mode Pemantauan Global Owner (Read-Only Form)." 
                : "Input entri pencucian unit kendaraan secara instan dan live sinkronisasi."}
            </p>
          </div>

          {/* Secure Session Status Indicator */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm self-start md:self-auto">
            <span className={`w-2.5 h-2.5 rounded-full ${activeUserEmail ? "bg-emerald-500 animate-pulse" : "bg-amber-400 animate-bounce"}`}></span>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {activeUserEmail ? `SESI AKTIF: ${activeUserEmail}` : "MODE DEMO LOKAL"}
            </div>
          </div>
        </div>

        {/* --- FORM INPUT PREMIER (DIKUNCI / MODIFIKASI BERDASARKAN ROLE) --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 relative overflow-hidden">
          
          {/* OVERLAY LOCK SCREEN JIKA LOGIN SEBAGAI OWNER */}
          {activeRoleText === "owner" && (
            <div className="absolute inset-0 bg-slate-100/65 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-md mb-2">
                <Lock size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Form Dikunci (Akses Owner)</h4>
              <p className="text-slate-500 text-[11px] max-w-xs mt-0.5">Integritas data kasir terjamin! Owner hanya memiliki akses READ-ONLY untuk memantau data harian!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* Dropdown Cabang */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <MapPin size={14} className="text-blue-500" /> Cabang Penempatan
                </label>
                <select
                  name="branchId"
                  value={selectedBranch}
                  onChange={handleBranchChange}
                  disabled={activeRoleText !== "owner"} // KUNCI OTOMATIS: Jika bukan owner, dropdown mati & terkunci otomatis ke cabang staff
                  className="border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium bg-slate-50/50 text-xs text-slate-800 transition-all disabled:opacity-80"
                  required
                >
                  <option value="">-- PILIH CABANG UTAMA --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id.toString()}>
                      {b.nama_cabang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Kategori Motor */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Kategori Kendaraan</label>
                <select
                  name="motorId"
                  value={selectedMotorId}
                  onChange={handleMotorChange}
                  className="border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium bg-slate-50/50 text-xs text-slate-800 transition-all"
                  required
                >
                  <option value="">-- PILIH JENIS MOTOR --</option>
                  {motors.map((m) => (
                    <option key={m.Id} value={m.Id}>
                      {m.Kategori.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Paket Layanan */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Sparkles size={14} className="text-amber-500" /> Paket Layanan
                </label>
                <select
                  name="layanan"
                  value={selectedLayanan}
                  onChange={handleLayananChange}
                  className="border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium bg-slate-50/50 text-xs text-slate-800 transition-all uppercase"
                  required
                >
                  <option value="">-- PAKET TREATMENT --</option>
                  {LAYANAN_OPTIONS.map((opt) => (
                    <option key={opt.nama} value={opt.nama}>
                      {opt.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Operator Pelaksana */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <UserCheck size={14} className="text-slate-400" /> Operator Bertugas
                </label>
                <select
                  name="karyawanId"
                  className="border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium bg-slate-50/50 text-xs text-slate-800 transition-all disabled:opacity-50"
                  required
                  disabled={!selectedBranch}
                >
                  <option value="">-- PILIH OPERATOR --</option>
                  {filteredKaryawans.map((k) => (
                    <option key={k.Id} value={k.Id}>
                      {k.Nama.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Pelanggan (Member) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <User size={14} className="text-slate-400" /> Status Pelanggan
                </label>
                <select
                  name="customerId"
                  className="border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium bg-slate-50/50 text-xs text-slate-800 transition-all"
                  required
                >
                  <option value="1">-- UMUM (BUKAN MEMBER) --</option>
                  {customers.map(
                    (c) =>
                      c.id !== 1 && (
                        <option key={c.id} value={c.id}>
                          💎 {c.nama.toUpperCase()}
                        </option>
                      )
                  )}
                </select>
              </div>

              {/* Tampilan Total Tagihan (Readonly) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <DollarSign size={14} className="text-emerald-500" /> Total Tagihan
                </label>
                <input
                  name="total"
                  type="text"
                  value={formatRupiah(selectedTarif)}
                  readOnly
                  className="border border-emerald-200 p-3 rounded-xl outline-none font-bold text-emerald-600 bg-emerald-50/40 text-xs tracking-wide"
                  required
                />
              </div>

            </div>

            {/* Tombol Aksi Submit Form */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="w-full sm:w-48 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-sm hover:shadow transition-all text-xs uppercase tracking-wider"
              >
                Simpan Transaksi 🚀
              </button>
            </div>
          </form>
        </div>

        {/* --- LOG TABEL HISTORI TRANSAKSI --- */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-slate-900 px-5 py-4 text-white font-bold text-xs uppercase tracking-wide flex justify-between items-center">
            <span>Riwayat Transaksi {activeRoleText === "owner" ? "Global" : "Cabang"} (Live Feed)</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-0.5 rounded-md font-semibold tracking-normal">
              Limit 20 entri terbaru
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Waktu</th>
                  <th className="px-6 py-3.5">Pelanggan</th> 
                  <th className="px-6 py-3.5">Paket Layanan</th>
                  <th className="px-6 py-3.5 text-right">Total Netto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {transaksis.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-slate-400">
                      Belum ada transaksi terinput untuk scope ini.
                    </td>
                  </tr>
                ) : (
                  transaksis.map((t) => (
                    <tr key={t.Id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-400 font-normal">
                        {new Date(t.Tanggal).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="px-6 py-4 font-semibold">
                        {t.customer_id === 1 ? (
                          <span className="text-slate-400">UMUM</span>
                        ) : (
                          <span className="text-blue-600 inline-flex items-center gap-1">
                            💎 {t.customers?.nama?.toUpperCase()}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-800 tracking-tight">
                        {t.Layanan}
                      </td>
                      
                      <td className="px-6 py-4 font-bold text-slate-900 text-right">
                        {formatRupiah(t.Total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}