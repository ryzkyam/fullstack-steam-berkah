"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function JasaKaryawan() {
  const [rekapGaji, setRekapGaji] = useState([]);
  const [totalGajiSemua, setTotalGajiSemua] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchGajiData = async () => {
    try {
      setLoading(true);
      
      // Kita tentukan relasi mana yang dipakai dengan menyebutkan nama kolomnya
      // Di sini gue asumsikan KaryawanId adalah operator utamanya
      const { data: transaksi, error } = await supabase
        .from("Transaksis")
        .select(`
          Total,
          Karyawans!KaryawanId ( Nama )
        `);

      if (error) throw error;

      if (transaksi) {
        const grouping = transaksi.reduce((acc, curr) => {
          // Akses data sesuai alias relasi tadi
          const nama = curr.Karyawans?.Nama || "Tanpa Nama";
          const totalNominal = Number(curr.Total) || 0;
          const bagianGaji = totalNominal * 0.4; 

          if (!acc[nama]) {
            acc[nama] = { nama, totalOmzet: 0, gajiBersih: 0, jumlahUnit: 0 };
          }
          
          acc[nama].totalOmzet += totalNominal;
          acc[nama].gajiBersih += bagianGaji;
          acc[nama].jumlahUnit += 1;
          
          return acc;
        }, {});

        const hasilArray = Object.values(grouping);
        const totalSemua = hasilArray.reduce((sum, item) => sum + item.gajiBersih, 0);

        setRekapGaji(hasilArray);
        setTotalGajiSemua(totalSemua);
      }
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGajiData();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 overflow-x-hidden font-sans relative">
      
      {/* SIDEBAR */}
      <aside className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-64 bg-[#2b459a] text-white p-6 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} flex flex-col`}>
        <h2 className="text-xl font-black mb-10 italic uppercase border-b border-blue-800 pb-4 mt-12 md:mt-0">STEAM BERKAH 🚀</h2>
        <nav className="flex-1 space-y-2 text-xs font-bold uppercase">
          <Link href="/dashboard"><div className="p-4 rounded-xl hover:bg-blue-800">📊 Dashboard</div></Link>
          <Link href="/dashboard/karyawan"><div className="p-4 rounded-xl hover:bg-blue-800">👥 Karyawan</div></Link>
          <div className="p-4 rounded-xl bg-emerald-500 shadow-lg font-black italic">💰 Jasa Operator</div>
          <Link href="/dashboard/pengeluaran"><div className="p-4 rounded-xl hover:bg-blue-800">💸 Pengeluaran</div></Link>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-12 w-full">
        <div className="max-w-5xl mx-auto pt-10 md:pt-0">
          
          {/* CARD TOTAL GLOBAL */}
          <div className="bg-[#2b459a] text-white p-8 rounded-[2.5rem] shadow-2xl mb-10 relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Total Gaji Jasa (40%)</p>
                <h1 className="text-4xl md:text-5xl font-black italic mt-2">
                  Rp {totalGajiSemua.toLocaleString('id-ID')}
                </h1>
                <div className="mt-4 inline-block bg-white/20 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                   Data Seluruh Operator
                </div>
             </div>
             <div className="absolute -right-10 -bottom-10 text-9xl opacity-10 font-black italic">CASH</div>
          </div>

          <h2 className="text-lg font-black uppercase italic mb-6 text-slate-800 flex items-center gap-2">
            <span>⚡</span> Rincian Gaji Per Personil
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-full py-20 text-center font-black italic text-slate-400 animate-pulse">MENGHITUNG GAJI...</div>
            ) : rekapGaji.map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl border-b-8 border-b-emerald-500">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black uppercase italic text-slate-800">{item.nama}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.jumlahUnit} Kendaraan</p>
                  </div>
                  <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black italic">40%</div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Total Transaksi</span>
                    <span className="text-sm font-bold tracking-tighter">Rp {item.totalOmzet.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Gaji Yang Diterima</p>
                    <p className="text-2xl font-black text-emerald-600 italic">Rp {item.gajiBersih.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MOBILE TRIGGER */}
      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden fixed top-4 left-4 z-[60] bg-[#2b459a] text-white p-3 rounded-xl shadow-lg">
        {isSidebarOpen ? "✕" : "☰"}
      </button>

    </div>
  );
}