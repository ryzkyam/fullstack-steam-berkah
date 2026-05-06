"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function JasaKaryawanDashboard() {
  const [dataRingkasan, setDataRingkasan] = useState([]);
  const [branches, setBranches] = useState([]); 
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
      // 1. Ambil Data Transaksi + Relasi Karyawan + Cabang
      const { data, error } = await supabase
        .from("Transaksis")
        .select(`
          Total, 
          KaryawanId, 
          Karyawans!KaryawanId ( 
            Nama, 
            branch_id,
            branches ( id, nama_cabang )
          )
        `);

      const { data: bData } = await supabase.from("branches").select("*").order("id", { ascending: true });

      if (error) throw error;

      if (data) {
        setBranches(bData || []);
        const total = data.reduce((sum, item) => sum + (Number(item.Total) || 0), 0);
        setStats({ total, owner: total * 0.6, karyawan: total * 0.4 });

        const jasaMap = {};
        data.forEach((trx) => {
          const k = trx.Karyawans;
          const nama = k?.Nama || "Umum";
          const bId = k?.branch_id || 999;
          const bName = k?.branches?.nama_cabang || "Tanpa Cabang";

          if (!jasaMap[nama]) {
            jasaMap[nama] = { nama, unit: 0, total: 0, bId, bName };
          }
          jasaMap[nama].unit += 1;
          jasaMap[nama].total += Number(trx.Total) || 0;
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
    <div className="flex min-h-screen bg-slate-100 font-sans p-4 md:p-10">
      <div className="max-w-6xl mx-auto w-full">
        
        {/* HEADER & REFRESH */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter">Gaji Operator</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pembagian Komisi 40% per Cabang</p>
          </div>
          <button onClick={fetchData} className="bg-white p-3 rounded-2xl shadow-sm hover:shadow-md transition-all text-xl">
            {loading ? "⏳" : "🔄"}
          </button>
        </div>

        {/* STATS ATAS (OMZET, OWNER, KARYAWAN) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-b-4 border-emerald-500">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Omzet Bruto</p>
            <h2 className="text-2xl font-black text-slate-800 italic">{formatRupiah(stats.total)}</h2>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-b-4 border-blue-600">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Gross Owner (60%)</p>
            <h2 className="text-2xl font-black text-blue-600 italic">{formatRupiah(stats.owner)}</h2>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-b-4 border-orange-500">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Jatah Karyawan (40%)</p>
            <h2 className="text-2xl font-black text-orange-500 italic">{formatRupiah(stats.karyawan)}</h2>
          </div>
        </div>

        {/* GRID CARD GAJI OPERATOR */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {dataRingkasan.map((item, idx) => (
            <div key={idx} className="bg-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 border border-slate-100">
              
              {/* BADGE PERSENTASE */}
              <div className="absolute top-6 right-6 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">40%</div>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter mb-1">{item.nama}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit} KENDARAAN</span>
                  {/* BADGE BLUEPRINT CABANG DI DALAM CARD */}
                  <span className="text-[9px] font-black bg-blue-600 text-white px-3 py-0.5 rounded-lg italic shadow-sm uppercase tracking-tighter">
                    📍 {item.bName}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase border-b border-slate-50 pb-2">
                  <span>Total Transaksi</span>
                  <span className="text-slate-800 text-sm">{formatRupiah(item.total)}</span>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em]">Gaji Yang Diterima</p>
                  <h4 className="text-3xl font-black text-emerald-600 italic tracking-tighter">
                    {formatRupiah(item.total * 0.4)}
                  </h4>
                </div>
              </div>

              {/* DEKORASI BACKGROUND CARD */}
              <div className="absolute -bottom-4 -right-4 text-slate-50 text-8xl font-black opacity-10 pointer-events-none uppercase italic">
                {item.nama.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>

        {/* LINK BALIK KE DASHBOARD */}
        <div className="mt-12 text-center">
          <Link href="/dashboard" className="text-[10px] font-black text-slate-400 uppercase hover:text-blue-600 transition-all tracking-widest underline decoration-2 underline-offset-8">
            ← Kembali ke Dashboard Utama
          </Link>
        </div>

      </div>
    </div>
  );
}