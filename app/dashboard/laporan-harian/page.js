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
      // 1. Setup Range Tanggal (Hari Ini WIB)
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      // 2. Ambil Master Karyawan (Sesuai Skema: Tabel Karyawans, Kolom Nama & Id)
      const { data: mKaryawan } = await supabase
        .from("Karyawans") 
        .select("Id, Nama");

      const mapKaryawan = {};
      if (mKaryawan) {
        mKaryawan.forEach(k => {
          mapKaryawan[k.Id] = k.Nama;
        });
      }

      // 3. Ambil Transaksi (Tabel: Transaksis)
      const { data: trans, error } = await supabase
        .from("Transaksis")
        .select("*")
        .gte("Tanggal", startOfDay)
        .lte("Tanggal", endOfDay)
        .order("Tanggal", { ascending: false });

      if (error) throw error;

      if (trans) {
        // MAPPING: Jika nama tidak ada, tampilkan ID-nya daripada "Umum"
        const dataLengkap = trans.map(t => ({
          ...t,
          namaKaryawan: mapKaryawan[t.KaryawanId] || `ID: ${t.KaryawanId || '?'}`
        }));

        setListTransaksi(dataLengkap);

        // 4. Hitung Rekap Gaji per Karyawan
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

        // 5. Update Statistik Ringkasan
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
    <div className="flex min-h-screen bg-slate-100 relative text-slate-900">
      {/* TOMBOL HAMBURGER */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-5 left-5 z-50 bg-[#2b459a] text-white p-3 rounded-xl shadow-2xl"
      >
        {isSidebarOpen ? "✕" : "☰"}
      </button>

      {/* OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 w-64 h-screen bg-[#2b459a] text-white p-4 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} shadow-2xl border-r border-blue-800`}
      >
        <h2 className="text-xl font-bold mb-8 italic text-center md:text-left mt-10 md:mt-0 uppercase">
          STEAM BERKAH 🚀
        </h2>
        <nav className="space-y-2 text-xs font-bold uppercase tracking-wider">
          <Link href="/dashboard" onClick={() => setIsSidebarOpen(false)}>
            <div className={`p-4 rounded-xl cursor-pointer hover:bg-blue-800 ${pathname === "/dashboard" ? "bg-blue-600 shadow-lg" : ""}`}>
              📊 Dashboard
            </div>
          </Link>
          <Link href="/dashboard/transaksi" onClick={() => setIsSidebarOpen(false)}>
            <div className={`p-4 rounded-xl hover:bg-blue-800 cursor-pointer ${pathname === "/dashboard/transaksi" ? "bg-blue-600" : ""}`}>
              📝 Transaksi
            </div>
          </Link>
          <Link href="/dashboard/laporan-harian" onClick={() => setIsSidebarOpen(false)}>
            <div className={`p-4 rounded-xl cursor-pointer ${pathname === "/dashboard/laporan-harian" ? "bg-blue-600 shadow-lg" : "hover:bg-blue-800"}`}>
              📅 Laporan Harian
            </div>
          </Link>
          <Link href="/dashboard/pengeluaran" onClick={() => setIsSidebarOpen(false)}>
            <div className="p-4 rounded-xl hover:bg-blue-800 cursor-pointer">
              💸 Pengeluaran
            </div>
          </Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 md:p-8 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-16 md:mt-0">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Laporan Hari Ini</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={fetchLaporanHarian}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95"
          >
            {loading ? "🔄 LOADING..." : "🔄 SYNC DATA TERBARU"}
          </button>
        </div>

        {/* STATISTIK RINGKASAN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-white">
          <div className="bg-[#15803d] p-7 rounded-[2rem] shadow-xl border-b-8 border-green-900">
            <p className="text-[10px] font-bold uppercase opacity-70 mb-1">Omzet Masuk</p>
            <h3 className="text-3xl font-black italic">Rp {summary.total.toLocaleString()}</h3>
          </div>
          <div className="bg-[#1e40af] p-7 rounded-[2rem] shadow-xl border-b-8 border-blue-900">
            <p className="text-[10px] font-bold uppercase opacity-70 mb-1">Owner (60%)</p>
            <h3 className="text-3xl font-black italic">Rp {summary.owner.toLocaleString()}</h3>
          </div>
          <div className="bg-[#c2410c] p-7 rounded-[2rem] shadow-xl border-b-8 border-orange-900">
            <p className="text-[10px] font-bold uppercase opacity-70 mb-1">Gaji Karyawan (40%)</p>
            <h3 className="text-3xl font-black italic">Rp {summary.karyawan.toLocaleString()}</h3>
          </div>
        </div>

        {/* TABEL 1: REKAP GAJI */}
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 mb-8">
          <div className="bg-[#15803d] p-4 text-white font-black text-[11px] uppercase italic">
            📊 Rekap Gaji Karyawan
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                <tr>
                  <th className="p-4 ps-8">Nama Karyawan</th>
                  <th className="p-4 text-center">Total Motor</th>
                  <th className="p-4">Omzet Bruto</th>
                  <th className="p-4 text-right pe-8">Gaji (40%)</th>
                </tr>
              </thead>
              <tbody className="text-[12px] font-bold uppercase">
                {dataHarian.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4 ps-8 text-slate-900">{item.nama}</td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 px-3 py-1 rounded-lg">{item.totalMotor}</span>
                    </td>
                    <td className="p-4">Rp {item.totalDuit.toLocaleString()}</td>
                    <td className="p-4 text-right pe-8 text-green-600">
                      Rp {(item.totalDuit * 0.4).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABEL 2: DETAIL TRANSAKSI */}
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-[#1e3a8a] p-4 text-white font-black text-[11px] uppercase italic">
            🕒 Aktivitas Transaksi Hari Ini
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                <tr>
                  <th className="p-4 ps-8">Jam</th>
                  <th className="p-4">Karyawan</th>
                  <th className="p-4">Layanan</th>
                  <th className="p-4">Unit</th>
                  <th className="p-4 text-right pe-8">Biaya</th>
                </tr>
              </thead>
              <tbody className="font-bold uppercase">
                {listTransaksi.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-blue-50/30 transition-all">
                    <td className="p-4 ps-8 text-blue-600">
                      {new Date(item.Tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-4 text-slate-900">{item.namaKaryawan}</td>
                    <td className="p-4 text-slate-500 italic">{item.Layanan}</td>
                    <td className="p-4">
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded italic">
                        #{item.MotorId || "Motor"}
                      </span>
                    </td>
                    <td className="p-4 text-right pe-8 font-black text-slate-900">
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