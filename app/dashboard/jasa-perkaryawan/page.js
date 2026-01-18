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
      const { data, error } = await supabase
        .from("Transaksis")
        .select(`id, Total, id_karyawan, Karyawan ( nama )`)
        .order("id", { ascending: false });

      if (error) throw error;

      if (data) {
        setDataDetail(data);
        const total = data.reduce((sum, item) => sum + (Number(item.Total) || 0), 0);
        setStats({ total, owner: total * 0.6, karyawan: total * 0.4 });

        const jasaMap = {};
        data.forEach((trx) => {
          const nama = trx.Karyawan?.nama || "Umum";
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
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* SIDEBAR (Warna Navy Solid) */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 bg-[#1e3a8a] text-white p-6 hidden lg:flex flex-col shadow-2xl">
        <h2 className="text-xl font-black mb-10 border-b border-white/10 pb-4 italic uppercase">STEAM BERKAH</h2>
        <nav className="space-y-3 text-xs font-bold uppercase tracking-wider">
          <Link href="/dashboard" className="p-4 rounded-xl hover:bg-white/10 flex items-center gap-3 opacity-70">📊 Dashboard</Link>
          <div className="p-4 rounded-xl bg-blue-600 shadow-lg flex items-center gap-3">💸 Jasa Karyawan</div>
          <Link href="/dashboard/stok" className="p-4 rounded-xl hover:bg-white/10 flex items-center gap-3 opacity-70">📦 Stok Barang</Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 lg:p-10 lg:ml-64">
        <div className="max-w-6xl mx-auto">
          
          {/* HEADER DASHBOARD */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-[#1e293b] italic tracking-tight">Dashboard Jasa Karyawan</h1>
            <button onClick={fetchData} className="bg-[#3b82f6] text-white px-5 py-2 rounded-lg text-[10px] font-black shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest">
              🔄 Refresh Data
            </button>
          </div>

          {/* 3 CARD STATISTIK (Warna Persis Gambar) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-[#15803d] p-7 rounded-[1.5rem] text-white shadow-xl border-b-8 border-black/10">
              <p className="text-[10px] font-black uppercase opacity-80 mb-2">Total Pendapatan</p>
              <h3 className="text-3xl font-black italic">{formatRupiah(stats.total)}</h3>
            </div>
            <div className="bg-[#1e40af] p-7 rounded-[1.5rem] text-white shadow-xl border-b-8 border-black/10">
              <p className="text-[10px] font-black uppercase opacity-80 mb-2">Bagian Owner (60%)</p>
              <h3 className="text-3xl font-black italic">{formatRupiah(stats.owner)}</h3>
            </div>
            <div className="bg-[#c2410c] p-7 rounded-[1.5rem] text-white shadow-xl border-b-8 border-black/10">
              <p className="text-[10px] font-black uppercase opacity-80 mb-2">Bagian Karyawan (40%)</p>
              <h3 className="text-3xl font-black italic">{formatRupiah(stats.karyawan)}</h3>
            </div>
          </div>

          {/* TABEL RINGKASAN (Header Hijau) */}
          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 mb-10">
            <div className="bg-[#15803d] p-4 text-white font-black text-[11px] uppercase tracking-widest italic flex items-center gap-2">
              📄 Laporan Jasa Per Karyawan
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e3a8a] text-white text-[10px] uppercase font-black tracking-widest">
                    <th className="p-4 ps-8">Karyawan</th>
                    <th className="p-4 text-center">Total Motor</th>
                    <th className="p-4">Total Pendapatan</th>
                    <th className="p-4 text-right pe-8">Bagian Karyawan (40%)</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-bold text-slate-700 uppercase">
                  {dataRingkasan.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-green-50/50 transition-colors">
                      <td className="p-4 ps-8 font-black text-slate-900">{item.nama}</td>
                      <td className="p-4 text-center">{item.totalMotor}</td>
                      <td className="p-4 text-blue-700">{formatRupiah(item.totalPendapatan)}</td>
                      <td className="p-4 text-right pe-8 text-green-700 font-black">
                        {formatRupiah(item.totalPendapatan * 0.4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL DETAIL (Header Navy) */}
          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#1e3a8a] p-4 text-white font-black text-[11px] uppercase tracking-widest italic flex items-center gap-2">
              🔍 Rincian Jasa Per Transaksi
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#0f172a] text-white text-[9px] uppercase font-black">
                    <th className="p-4 ps-8">ID Kar</th>
                    <th className="p-4">Nama</th>
                    <th className="p-4">ID Transaksi</th>
                    <th className="p-4 text-right">Nilai Jasa</th>
                    <th className="p-4 text-right pe-8 text-green-400">40% Jasa</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] font-bold text-slate-500 uppercase">
                  {dataDetail.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 ps-8">#{item.id_karyawan || '0'}</td>
                      <td className="p-4 text-slate-900 font-black">{item.Karyawan?.nama || '-'}</td>
                      <td className="p-4 italic text-slate-400">TRX-{item.id}</td>
                      <td className="p-4 text-right">{formatRupiah(item.Total)}</td>
                      <td className="p-4 text-right pe-8 font-black text-green-700 bg-green-50/30">
                        {formatRupiah(item.Total * 0.4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}