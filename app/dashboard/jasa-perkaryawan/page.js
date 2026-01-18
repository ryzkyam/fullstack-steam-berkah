"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function JasaKaryawanDashboard() {
  const [dataRingkasan, setDataRingkasan] = useState([]);
  const [dataDetail, setDataDetail] = useState([]);
  const [stats, setStats] = useState({ total: 0, owner: 0, karyawan: 0 });
  const [loading, setLoading] = useState(true);

  const formatRupiah = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Menggunakan relasi Karyawans!KaryawanId sesuai struktur foreign key di ERD
      const { data, error } = await supabase
        .from("Transaksis")
        .select(`id, Total, KaryawanId, Karyawans!KaryawanId ( Nama )`)
        .order("id", { ascending: false });

      if (error) throw error;

      if (data) {
        setDataDetail(data);
        const total = data.reduce((sum, item) => sum + (Number(item.Total) || 0), 0);
        setStats({ total, owner: total * 0.6, karyawan: total * 0.4 });

        const jasaMap = {};
        data.forEach((trx) => {
          const nama = trx.Karyawans?.Nama || "Umum";
          if (!jasaMap[nama]) {
            jasaMap[nama] = { nama, totalMotor: 0, totalPendapatan: 0 };
          }
          jasaMap[nama].totalMotor += 1;
          jasaMap[nama].totalPendapatan += Number(trx.Total) || 0;
        });
        setDataRingkasan(Object.values(jasaMap));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* SIDEBAR RINGKAS */}
      <aside className="fixed top-0 left-0 bottom-0 w-60 bg-[#1e3a8a] text-white p-5 hidden lg:flex flex-col shadow-xl">
        <h2 className="text-lg font-black mb-8 border-b border-white/10 pb-4 italic uppercase tracking-tighter">STEAM BERKAH</h2>
        <nav className="space-y-1 text-[10px] font-black uppercase tracking-widest">
          <Link href="/dashboard" className="p-3 rounded-xl hover:bg-white/10 flex items-center gap-3 opacity-60">📊 Dashboard</Link>
          <div className="p-3 rounded-xl bg-blue-600 shadow-lg flex items-center gap-3 italic">💸 Jasa Karyawan</div>
          <Link href="/dashboard/stok" className="p-3 rounded-xl hover:bg-white/10 flex items-center gap-3 opacity-60">📦 Stok Barang</Link>
        </nav>
      </aside>

      <main className="flex-1 p-5 lg:p-8 lg:ml-60">
        <div className="max-w-5xl mx-auto">
          
          {/* HEADER MINIMALIS */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Jasa Karyawan</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Data Pembagian Hasil 60/40</p>
            </div>
            <button onClick={fetchData} className="bg-white border border-slate-200 text-slate-400 p-2 rounded-xl hover:text-blue-600 transition-all shadow-sm">
              <span className="text-lg">🔄</span>
            </button>
          </div>

          {/* CARD STATISTIK KECIL (ESTETIK) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg text-sm">💰</span>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Omzet</p>
              </div>
              <h3 className="text-xl font-black text-slate-800 italic">{formatRupiah(stats.total)}</h3>
            </div>
            
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg text-sm">🏦</span>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Owner (60%)</p>
              </div>
              <h3 className="text-xl font-black text-blue-700 italic">{formatRupiah(stats.owner)}</h3>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-orange-100 text-orange-600 p-2 rounded-lg text-sm">👷</span>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Karyawan (40%)</p>
              </div>
              <h3 className="text-xl font-black text-orange-600 italic">{formatRupiah(stats.karyawan)}</h3>
            </div>
          </div>

          {/* TABEL RINGKASAN GAYA CLEAN */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="bg-slate-800 p-4 text-white text-[9px] font-black uppercase tracking-[0.3em] flex justify-between items-center">
              <span>Laporan Jasa Per Personil</span>
              <span className="bg-emerald-500 px-2 py-0.5 rounded text-[8px]">Aktif</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[9px] uppercase font-black text-slate-400 tracking-widest">
                  <th className="p-4 ps-8">Nama Karyawan</th>
                  <th className="p-4 text-center">Unit</th>
                  <th className="p-4">Pendapatan</th>
                  <th className="p-4 text-right pe-8">Gaji (40%)</th>
                </tr>
              </thead>
              <tbody className="text-[10px] font-bold uppercase text-slate-600">
                {dataRingkasan.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 border-b border-slate-50 last:border-0 transition-all">
                    <td className="p-4 ps-8 font-black text-slate-800">{item.nama}</td>
                    <td className="p-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded-md">{item.totalMotor}</span></td>
                    <td className="p-4 text-slate-400">{formatRupiah(item.totalPendapatan)}</td>
                    <td className="p-4 text-right pe-8 text-emerald-600 font-black italic text-sm">{formatRupiah(item.totalPendapatan * 0.4)}</td>
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