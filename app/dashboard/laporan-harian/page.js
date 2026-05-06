"use client";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function LaporanHarian() {
  const [dataHarian, setDataHarian] = useState([]); 
  const [listTransaksi, setListTransaksi] = useState([]); 
  const [summary, setSummary] = useState({ total: 0, owner: 0, karyawan: 0 });
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const fetchLaporanHarian = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      // Ambil data karyawan untuk mapping nama
      const { data: mKaryawan } = await supabase
        .from("Karyawans") 
        .select("Id, Nama");

      const mapKaryawan = {};
      if (mKaryawan) {
        mKaryawan.forEach(k => { mapKaryawan[k.Id] = k.Nama; });
      }

      const { data: trans, error } = await supabase
        .from("Transaksis")
        .select("*")
        .gte("Tanggal", startOfDay)
        .lte("Tanggal", endOfDay)
        .order("Tanggal", { ascending: false });

      if (error) throw error;

      if (trans) {
        const dataLengkap = trans.map(t => ({
          ...t,
          namaKaryawan: mapKaryawan[t.KaryawanId] || `ID: ${t.KaryawanId || '?'}`
        }));

        setListTransaksi(dataLengkap);

        const rekap = dataLengkap.reduce((acc, curr) => {
          const nama = curr.namaKaryawan;
          if (!acc[nama]) {
            acc[nama] = { nama, totalMotor: 0, totalDuit: 0 };
          }
          acc[nama].totalMotor += 1;
          acc[nama].totalDuit += Number(curr.Total) || 0;
          return acc;
        }, {});

        setDataHarian(Object.values(rekap));

        const totalPendapatan = dataLengkap.reduce((sum, item) => sum + (Number(item.Total) || 0), 0);
        setSummary({
          total: totalPendapatan,
          owner: totalPendapatan * 0.6,
          karyawan: totalPendapatan * 0.4,
        });
      }
    } catch (err) {
      console.error("Gagal tarik data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporanHarian();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100 relative text-slate-900 font-sans">
      {/* TOMBOL HAMBURGER MOBILE */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-5 left-5 z-[70] bg-[#2b459a] text-white p-3 rounded-xl shadow-2xl border border-blue-400"
      >
        {isSidebarOpen ? "✕" : "☰"}
      </button>

      {/* SIDEBAR MINIMALIS (HANYA 3 MENU) */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 
        w-64 h-screen bg-[#1e3a8a] text-white p-6 
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        shadow-2xl flex flex-col
      `}>
        <div className="mb-10 mt-10 md:mt-0">
            <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">
              STEAM BERKAH 🚀
            </h2>
            <p className="text-[8px] font-bold opacity-50 tracking-[0.3em] mt-1 uppercase">Management System</p>
        </div>

        <nav className="space-y-1 text-[10px] font-black uppercase tracking-widest">
          <Link href="/dashboard" onClick={() => setIsSidebarOpen(false)}>
            <div className={`p-4 rounded-xl mb-2 flex items-center gap-3 transition-all ${pathname === "/dashboard" ? "bg-blue-600 shadow-lg italic" : "opacity-60 hover:opacity-100 hover:bg-white/10"}`}>
              📊 Dashboard Utama
            </div>
          </Link>
          
          <div className="h-px bg-white/10 my-4"></div>

          <Link href="/dashboard/transaksi" onClick={() => setIsSidebarOpen(false)}>
            <div className={`p-4 rounded-xl flex items-center gap-3 transition-all ${pathname === "/dashboard/transaksi" ? "bg-blue-600 shadow-lg italic" : "opacity-60 hover:opacity-100 hover:bg-white/10"}`}>
              📝 Input Transaksi
            </div>
          </Link>

          <Link href="/dashboard/laporan-harian" onClick={() => setIsSidebarOpen(false)}>
            <div className={`p-4 rounded-xl flex items-center gap-3 transition-all ${pathname === "/dashboard/laporan-harian" ? "bg-blue-600 shadow-lg italic" : "opacity-60 hover:opacity-100 hover:bg-white/10"}`}>
              📅 Laporan Harian
            </div>
          </Link>
        </nav>

        {/* FOOTER SIDEBAR KECIL */}
        <div className="mt-auto pt-6 border-t border-white/10 opacity-30 text-[8px] font-bold uppercase tracking-widest">
            v2.0 Beta Branch Sync
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-16 md:mt-0">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Laporan Hari Ini</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={fetchLaporanHarian}
            className="bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-xl text-[10px] font-black shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            {loading ? "🔄 LOADING..." : "🔄 REFRESH DATA"}
          </button>
        </div>

        {/* STATISTIK RINGKASAN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Total Omzet</p>
            <h3 className="text-2xl font-black italic text-slate-800">Rp {summary.total.toLocaleString()}</h3>
          </div>
          <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest text-blue-500">Owner (60%)</p>
            <h3 className="text-2xl font-black italic text-blue-700">Rp {summary.owner.toLocaleString()}</h3>
          </div>
          <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest text-orange-500">Gaji 40%</p>
            <h3 className="text-2xl font-black italic text-orange-600">Rp {summary.karyawan.toLocaleString()}</h3>
          </div>
        </div>

        {/* TABEL REKAP GAJI */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-slate-800 p-4 text-white font-black text-[9px] uppercase tracking-[0.3em] flex justify-between">
            <span>📊 Rekap Gaji Personil</span>
            <span className="opacity-50 italic text-[8px]">Live Data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b tracking-widest">
                <tr>
                  <th className="p-4 ps-8">Nama Karyawan</th>
                  <th className="p-4 text-center">Unit</th>
                  <th className="p-4">Omzet Bruto</th>
                  <th className="p-4 text-right pe-8">Gaji (40%)</th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-bold uppercase text-slate-600">
                {dataHarian.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                    <td className="p-4 ps-8 font-black text-slate-800">{item.nama}</td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-500">{item.totalMotor}</span>
                    </td>
                    <td className="p-4 text-slate-400">Rp {item.totalDuit.toLocaleString()}</td>
                    <td className="p-4 text-right pe-8 text-emerald-600 font-black text-sm italic">
                      Rp {(item.totalDuit * 0.4).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABEL DETAIL TRANSAKSI */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-blue-900 p-4 text-white font-black text-[9px] uppercase tracking-[0.3em]">
            🕒 Detail Transaksi Masuk
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b tracking-widest">
                <tr>
                  <th className="p-4 ps-8">Jam</th>
                  <th className="p-4">Karyawan</th>
                  <th className="p-4">Layanan</th>
                  <th className="p-4">Unit</th>
                  <th className="p-4 text-right pe-8">Biaya</th>
                </tr>
              </thead>
              <tbody className="text-[10px] font-bold uppercase text-slate-600">
                {listTransaksi.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-blue-50/50 transition-all">
                    <td className="p-4 ps-8 text-blue-600 font-black italic">
                      {new Date(item.Tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-4 text-slate-800">{item.namaKaryawan}</td>
                    <td className="p-4 text-slate-400 italic font-medium">{item.Layanan}</td>
                    <td className="p-4">
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-black tracking-tighter">
                        #{item.MotorId || "UNIT"}
                      </span>
                    </td>
                    <td className="p-4 text-right pe-8 font-black text-slate-800">
                      Rp {Number(item.Total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}