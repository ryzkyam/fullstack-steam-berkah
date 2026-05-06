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
      // 1. Tarik Data Transaksi + Relasi Karyawan + Relasi Cabang
      const { data, error } = await supabase
        .from("Transaksis")
        .select(`
          id, 
          Total, 
          KaryawanId, 
          Karyawans!KaryawanId ( 
            Nama, 
            branch_id,
            branches ( id, nama_cabang )
          )
        `)
        .order("id", { ascending: false });

      // 2. Tarik List Cabang dari tabel branches
      const { data: branchData } = await supabase
        .from("branches")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;

      if (data) {
        setBranches(branchData || []);
        
        // Hitung Statistik Atas
        const total = data.reduce((sum, item) => sum + (Number(item.Total) || 0), 0);
        setStats({ total, owner: total * 0.6, karyawan: total * 0.4 });

        // 3. Mapping Data Gaji per Operator
        const jasaMap = {};
        data.forEach((trx) => {
          const karyawan = trx.Karyawans;
          const nama = karyawan?.Nama || "Tanpa Nama";
          const branchId = karyawan?.branch_id || 999;
          const branchName = karyawan?.branches?.nama_cabang || "Belum Penempatan";

          if (!jasaMap[nama]) {
            jasaMap[nama] = { 
              nama, 
              totalMotor: 0, 
              totalPendapatan: 0, 
              branchId, 
              branchName 
            };
          }
          jasaMap[nama].totalMotor += 1;
          jasaMap[nama].totalPendapatan += Number(trx.Total) || 0;
        });
        
        setDataRingkasan(Object.values(jasaMap));
      }
    } catch (err) {
      console.error("Gagal tarik data gaji:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans overflow-x-hidden">
      {/* SIDEBAR */}
      <aside className="fixed top-0 left-0 bottom-0 w-60 bg-[#1e3a8a] text-white p-5 hidden lg:flex flex-col shadow-xl z-50">
        <h2 className="text-lg font-black mb-8 border-b border-white/10 pb-4 italic uppercase tracking-tighter">STEAM BERKAH 🚀</h2>
        <nav className="space-y-1 text-[10px] font-black uppercase tracking-widest">
          <Link href="/dashboard" className="p-3 rounded-xl hover:bg-white/10 flex items-center gap-3 opacity-60">📊 Dashboard</Link>
          <div className="p-3 rounded-xl bg-blue-600 shadow-lg flex items-center gap-3 italic">💸 Jasa Karyawan</div>
          <Link href="/dashboard/karyawan" className="p-3 rounded-xl hover:bg-white/10 flex items-center gap-3 opacity-60">👥 Personil</Link>
          <Link href="/dashboard/pengeluaran" className="p-3 rounded-xl hover:bg-white/10 flex items-center gap-3 opacity-60">💸 Pengeluaran</Link>
        </nav>
      </aside>

      <main className="flex-1 p-5 lg:p-8 lg:ml-60">
        <div className="max-w-5xl mx-auto">
          
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Laporan Gaji</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Bagi Hasil 40% Per Personil</p>
            </div>
            <button onClick={fetchData} className="bg-white border border-slate-200 text-slate-400 p-2 rounded-xl hover:text-blue-600 transition-all shadow-sm">
              <span className={`text-lg block ${loading ? "animate-spin" : ""}`}>🔄</span>
            </button>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg text-sm">💰</span>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Omzet</p>
              </div>
              <h3 className="text-xl font-black text-slate-800 italic">{formatRupiah(stats.total)}</h3>
            </div>
            
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg text-sm">🏦</span>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Owner (60%)</p>
              </div>
              <h3 className="text-xl font-black text-blue-700 italic">{formatRupiah(stats.owner)}</h3>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-orange-100 text-orange-600 p-2 rounded-lg text-sm">👷</span>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Karyawan (40%)</p>
              </div>
              <h3 className="text-xl font-black text-orange-600 italic">{formatRupiah(stats.karyawan)}</h3>
            </div>
          </div>

          {/* TABEL PER CABANG */}
          {branches.map((branch) => {
            const listPerCabang = dataRingkasan.filter(item => item.branchId === branch.id);
            if (listPerCabang.length === 0) return null;

            return (
              <div key={branch.id} className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="bg-[#1e3a8a] text-white text-[9px] font-black uppercase px-4 py-2 rounded-full tracking-widest italic shadow-md">
                    📍 {branch.nama_cabang}
                  </h2>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[9px] uppercase font-black text-slate-400 tracking-widest">
                        <th className="p-4 ps-8">Nama Karyawan</th>
                        <th className="p-4 text-center">Unit</th>
                        <th className="p-4">Omzet Bruto</th>
                        <th className="p-4 text-right pe-8">Gaji Bersih (40%)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold uppercase text-slate-600">
                      {listPerCabang.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 border-b border-slate-50 last:border-0 transition-all">
                          <td className="p-4 ps-8">
                            <div className="flex flex-col gap-1">
                                <span className="font-black text-slate-800 text-sm tracking-tighter">{item.nama}</span>
                                {/* INI BLUEPRINT / BADGE CABANGNYA BRO */}
                                <span className="text-[7px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md border border-blue-100 w-fit tracking-widest font-black uppercase">
                                  📍 {item.branchName}
                                </span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg font-black">{item.totalMotor} Unit</span>
                          </td>
                          <td className="p-4 text-slate-400">{formatRupiah(item.totalPendapatan)}</td>
                          <td className="p-4 text-right pe-8">
                            <div className="bg-emerald-50 px-3 py-1.5 rounded-xl inline-block border border-emerald-100">
                                <span className="text-emerald-600 font-black italic text-sm">{formatRupiah(item.totalPendapatan * 0.4)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="bg-slate-50 p-4 px-8 flex justify-between items-center border-t border-slate-100">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Subtotal {branch.nama_cabang}</span>
                     <span className="text-xs font-black text-slate-800 italic bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                        Total Jatah: {formatRupiah(listPerCabang.reduce((s, i) => s + (i.totalPendapatan * 0.4), 0))}
                     </span>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </main>
    </div>
  );
}