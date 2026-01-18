"use client";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [transaksi, setTransaksi] = useState([]);
  const [stats, setStats] = useState({
    motor: 0,
    bruto: 0,          // Total Omzet
    jatahKaryawan: 0,  // 40%
    jatahOwner: 0,     // 60%
    biaya: 0,          // Real dari tabel Pengeluarans
    netto: 0,          // Jatah Owner - Biaya
  });
  const [mapKaryawan, setMapKaryawan] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // STATE HAMBURGER
  const pathname = usePathname();

  const fetchData = async () => {
    try {
      const { data: karyawanData } = await supabase.from("Karyawan").select("id, nama");
      const mapping = {};
      if (karyawanData) {
        karyawanData.forEach((k) => { mapping[k.id] = k.nama; });
        setMapKaryawan(mapping);
      }

      const { data: transData, error: transError } = await supabase
        .from("Transaksis")
        .select("*")
        .order("Tanggal", { ascending: false });

      const { data: pengeluaranData } = await supabase.from("Pengeluarans").select("jumlah");

      if (!transError && transData) {
        setTransaksi(transData);
        const totalBruto = transData.reduce((sum, item) => sum + (Number(item.Total) || 0), 0);
        const totalPengeluaran = pengeluaranData 
          ? pengeluaranData.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0) 
          : 0;

        const jatahKaryawan = totalBruto * 0.4;
        const jatahOwnerGross = totalBruto * 0.6;
        const profitBersihOwner = jatahOwnerGross - totalPengeluaran;

        setStats({
          motor: transData.length,
          bruto: totalBruto,
          jatahKaryawan: jatahKaryawan,
          jatahOwner: jatahOwnerGross,
          biaya: totalPengeluaran,
          netto: profitBersihOwner,
        });
      }
    } catch (err) {
      console.error("Gagal ambil data:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="flex min-h-screen bg-slate-100 relative">
      
      {/* 1. TOMBOL HAMBURGER (Hanya muncul di Mobile < 768px) */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-5 left-5 z-50 bg-[#2b459a] text-white p-3 rounded-xl shadow-2xl border border-blue-400"
      >
        {isSidebarOpen ? (
          <span className="text-xl font-bold">✕</span> // Icon Close
        ) : (
          <span className="text-xl font-bold">☰</span> // Icon Menu
        )}
      </button>

      {/* 2. OVERLAY (Muncul saat sidebar terbuka di mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* 3. SIDEBAR (Design Tetap, Tambah Responsive Logic) */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-40 
        w-64 h-screen bg-[#2b459a] text-white p-4 
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        shadow-2xl border-r border-blue-800 flex flex-col
      `}>
        <h2 className="text-xl font-bold mb-8 italic text-center md:text-left mt-10 md:mt-0">STEAM BERKAH 🚀</h2>
        <nav className="space-y-2 text-xs font-bold uppercase tracking-wider opacity-90">
          <Link href="/dashboard" onClick={() => setIsSidebarOpen(false)}>
            <div className={`p-4 rounded-xl cursor-pointer ${pathname === "/dashboard" ? "bg-blue-600 shadow-lg" : "hover:bg-blue-800"}`}>📊 Dashboard</div>
          </Link>
          <Link href="/dashboard/transaksi" onClick={() => setIsSidebarOpen(false)}>
            <div className="p-4 rounded-xl hover:bg-blue-800 cursor-pointer">📝 Transaksi</div>
          </Link>
          <Link href="/dashboard/laporan-harian" onClick={() => setIsSidebarOpen(false)}>
            <div className="p-4 rounded-xl hover:bg-blue-800 cursor-pointer">📅 Laporan Harian</div>
          </Link>
          <Link href="/dashboard/pengeluaran" onClick={() => setIsSidebarOpen(false)}>
            <div className="p-4 rounded-xl hover:bg-blue-800 cursor-pointer">💸 Pengeluaran</div>
          </Link>
          <Link href="/dashboard/stock" onClick={() => setIsSidebarOpen(false)}>
            <div className="p-4 rounded-xl hover:bg-blue-800 cursor-pointer">📦 Stok Barang</div>
          </Link>
          <Link href="/dashboard/karyawan" onClick={() => setIsSidebarOpen(false)}>
            <div className="p-4 rounded-xl hover:bg-blue-800 cursor-pointer">👥 Karyawan</div>
          </Link>
        </nav>
      </aside>

      {/* 4. MAIN CONTENT */}
      <div className="flex-1 p-4 md:p-8 w-full transition-all">
        {/* Header Header Spacing for Mobile Hamburger */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-16 md:mt-0">
          <h1 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter text-center md:text-left">
            Ringkasan Bisnis
          </h1>
          <button 
            onClick={fetchData} 
            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black shadow-lg hover:bg-blue-700 uppercase tracking-widest transition-all active:scale-95"
          >
            🔄 REFRESH DATA REALTIME
          </button>
        </div>

        {/* STATISTIK UTAMA (4 CARD) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-white">
          <div className="bg-blue-600 p-6 rounded-3xl shadow-xl border-b-8 border-blue-800 hover:-translate-y-1 transition-transform">
            <p className="text-[10px] font-bold uppercase opacity-70 mb-1">Total Unit</p>
            <h3 className="text-3xl font-black italic">{stats.motor} <span className="text-sm">Unit</span></h3>
          </div>
          <div className="bg-[#15803d] p-6 rounded-3xl shadow-xl border-b-8 border-green-900 hover:-translate-y-1 transition-transform">
            <p className="text-[10px] font-bold uppercase opacity-70 mb-1">Omzet Bruto</p>
            <h3 className="text-2xl font-black italic">Rp {stats.bruto.toLocaleString()}</h3>
          </div>
          <div className="bg-[#b91c1c] p-6 rounded-3xl shadow-xl border-b-8 border-red-950 hover:-translate-y-1 transition-transform">
            <p className="text-[10px] font-bold uppercase opacity-70 mb-1">Biaya Operasional</p>
            <h3 className="text-2xl font-black italic">Rp {stats.biaya.toLocaleString()}</h3>
          </div>
          <div className="bg-[#c2410c] p-6 rounded-3xl shadow-xl border-b-8 border-orange-900 hover:-translate-y-1 transition-transform">
            <p className="text-[10px] font-bold uppercase opacity-70 mb-1">Profit Netto</p>
            <h3 className="text-2xl font-black italic">Rp {stats.netto.toLocaleString()}</h3>
          </div>
        </div>

        {/* RINCIAN BAGI HASIL (2 CARD) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white p-6 rounded-3xl border-l-[12px] border-green-500 shadow-xl flex justify-between items-center">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jatah Karyawan (40%)</p>
                  <h4 className="text-3xl font-black text-slate-800 italic">Rp {stats.jatahKaryawan.toLocaleString()}</h4>
               </div>
               <div className="text-4xl opacity-20">👥</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border-l-[12px] border-blue-500 shadow-xl flex justify-between items-center">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Owner (60%)</p>
                  <h4 className="text-3xl font-black text-slate-800 italic">Rp {stats.jatahOwner.toLocaleString()}</h4>
               </div>
               <div className="text-4xl opacity-20">💼</div>
            </div>
        </div>

        {/* TABEL TRANSAKSI (Design Persis Request) */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-[#1e3a8a] p-5 text-white flex items-center gap-3 font-black text-[12px] uppercase italic tracking-tighter">
            <span className="bg-white/20 p-1 rounded-lg">📄</span> Riwayat Transaksi Terakhir (Sync)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                  <th className="p-5">Karyawan</th>
                  <th className="p-5 text-center">Motor</th>
                  <th className="p-5">Layanan</th>
                  <th className="p-5">Waktu</th>
                  <th className="p-5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 text-[12px] font-bold">
                {transaksi.map((item, index) => (
                  <tr key={index} className="border-b border-slate-50 hover:bg-blue-50/40 transition-all group">
                    <td className="p-5 font-black text-blue-900 uppercase group-hover:scale-105 transition-transform origin-left">
                      {mapKaryawan[item.KaryawanId] || `ID: ${item.KaryawanId}`}
                    </td>
                    <td className="p-5 text-center">
                      <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-500 text-[10px]">#{item.MotorId || "Unit"}</span>
                    </td>
                    <td className="p-5 text-slate-500 italic">{item.Layanan}</td>
                    <td className="p-5 text-slate-400 font-medium">
                      {new Date(item.Tanggal).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="p-5 text-right font-black text-green-600 text-[14px]">
                      Rp {Number(item.Total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}