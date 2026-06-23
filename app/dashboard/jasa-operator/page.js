"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BrainCircuit, ClipboardList, History, LayoutDashboard, Menu, Package,
  PlusCircle, Receipt, Users, Wallet, X, RefreshCw, MapPin, Globe, Layers,
  DollarSign, UserCheck, TrendingUp, Car
} from "lucide-react";

export default function JasaKaryawanDashboard() {
  const [dataRingkasan, setDataRingkasan] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());
  const [globalOmzet, setGlobalOmzet] = useState(0);
  const [stats, setStats] = useState({ total: 0, owner: 0, karyawan: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();

  const formatRupiah = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: bData } = await supabase.from("branches").select("*").order("id", { ascending: true });
      if (bData) setBranches(bData);

      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 1);

      const { data, error } = await supabase
        .from("Transaksis")
        .select(`
          Total, Tanggal, branch_id, KaryawanId,
          Karyawans!KaryawanId ( Nama, branch_id, branches ( id, nama_cabang ) )
        `)
        .gte("Tanggal", startDate.toISOString())
        .lt("Tanggal", endDate.toISOString());

      if (error) throw error;

      if (data) {
        // Omzet Global
        setGlobalOmzet(data.reduce((sum, trx) => sum + (Number(trx.Total) || 0), 0));

        // Filter Cabang
        const filteredData = selectedBranch === "all" 
          ? data 
          : data.filter((trx) => trx.Karyawans?.branch_id?.toString() === selectedBranch);

        // Grouping
        const jasaMap = {};
        filteredData.forEach((trx) => {
          const k = trx.Karyawans;
          const nama = k?.Nama || "Operator Umum";
          const bName = k?.branches?.nama_cabang || "Pusat / Tanpa Cabang";
          if (!jasaMap[nama]) {
            jasaMap[nama] = { nama, unit: 0, total: 0, bName };
          }
          jasaMap[nama].unit += 1;
          jasaMap[nama].total += Number(trx.Total) || 0;
        });
        
        const dataArr = Object.values(jasaMap);
        setDataRingkasan(dataArr);

        // Sinkronisasi Statistik
        const totalFilter = dataArr.reduce((sum, item) => sum + item.total, 0);
        setStats({ total: totalFilter, owner: totalFilter * 0.6, karyawan: totalFilter * 0.4 });
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedBranch, selectedMonth, selectedYear]);

  const formatBranchName = (name) => (!name ? "UTAMA" : name.toUpperCase() === "UMUM" ? "CABANG UTAMA" : name.toUpperCase());

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans antialiased text-slate-800 relative overflow-x-hidden">
      <button onClick={() => setIsSidebarOpen(true)} className="md:hidden fixed top-4 left-4 z-[60] bg-white text-slate-700 p-2.5 rounded-xl shadow-sm border border-slate-200">
        <Menu size={18} />
      </button>

      <aside className={`fixed md:sticky top-0 left-0 z-[60] w-64 h-screen bg-[#1e293b] text-slate-200 p-5 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} shadow-xl flex flex-col justify-between`}>
        <div>
          <div className="flex justify-between items-center mb-8 px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm">SB</div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white uppercase leading-none">STEAM BERKAH</h2>
                <p className="text-[9px] font-semibold text-slate-500 tracking-wider mt-1 uppercase">Management System</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white"><X size={20} /></button>
          </div>

          <nav className="space-y-1 text-sm font-medium opacity-95 overflow-y-auto flex-1 pr-1 scrollbar-hide">
            <p className="px-4 py-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pustaka Utama</p>
            <Link href="/dashboard" onClick={() => setIsSidebarOpen(false)}>
              <div className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${pathname === "/dashboard" ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
                <LayoutDashboard size={16} /> Monitoring Utama
              </div>
            </Link>
            <Link href="/dashboard/analytics" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all font-bold flex items-center gap-3 my-2 shadow-sm">
                <BrainCircuit size={16} /> Analitik AI (Prophet)
              </div>
            </Link>
            <p className="px-4 py-1.5 mt-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Unit Kerja Cabang</p>
            <div onClick={() => { setSelectedBranch("all"); setIsSidebarOpen(false); }} className={`px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2.5 text-xs transition-all ${selectedBranch === "all" ? "bg-slate-800 text-white font-semibold border-l-4 border-blue-500 pl-3" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
              <Globe size={14} /> Gabungan Semua Unit
            </div>
            {branches.map((b) => (
              <div key={b.id} onClick={() => { setSelectedBranch(b.id.toString()); setIsSidebarOpen(false); }} className={`px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2.5 text-xs transition-all ${selectedBranch === b.id.toString() ? "bg-slate-800 text-white font-semibold border-l-4 border-blue-500 pl-3" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                <MapPin size={12} /> {b.nama_cabang}
              </div>
            ))}
            <p className="px-4 py-1.5 mt-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Operasional & Log</p>
            <Link href="/dashboard/transaksi" onClick={() => setIsSidebarOpen(false)}><div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3"><Receipt size={14} /> Input Transaksi</div></Link>
            <Link href="/dashboard/laporan-harian" onClick={() => setIsSidebarOpen(false)}><div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3"><ClipboardList size={14} /> Laporan Harian</div></Link>
            <Link href="/dashboard/jasa-operator" onClick={() => setIsSidebarOpen(false)}><div className={`px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all ${pathname === "/dashboard/jasa-operator" ? "bg-blue-600 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}><History size={14} /> Gaji per-Operator</div></Link>
            <Link href="/dashboard/pengeluaran" onClick={() => setIsSidebarOpen(false)}><div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3"><Wallet size={14} /> Biaya Pengeluaran</div></Link>
            <Link href="/dashboard/stock" onClick={() => setIsSidebarOpen(false)}><div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3"><Package size={14} /> Stok Barang</div></Link>
            <Link href="/dashboard/karyawan" onClick={() => setIsSidebarOpen(false)}><div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3"><Users size={14} /> Manajemen Karyawan</div></Link>
            <div className="h-px bg-slate-800 my-4"></div>
            <Link href="/dashboard/branches" onClick={() => setIsSidebarOpen(false)}><div className="px-4 py-3 rounded-xl hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/20 flex items-center gap-3 transition-all font-semibold"><PlusCircle size={14} /> New Branch Unit</div></Link>
          </nav>
        </div>
        <div className="border-t border-slate-800 pt-4 mt-auto space-y-3">
          <button onClick={fetchData} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-all border border-slate-700/60 active:scale-98 flex items-center justify-center gap-2 shadow-sm">
            <RefreshCw size={12} className={loading ? "animate-spin text-blue-400" : "text-slate-400"} /> Sync Gaji Operator
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 w-full max-w-5xl mx-auto min-w-0">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Bagi Jasa & Komisi Operator</h1>
            <p className="text-sm text-slate-500 mt-0.5">Akumulasi pendapatan real-time dengan skema komisi 40%.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200 w-full sm:w-auto text-xs font-medium text-slate-700">
            <div className="flex items-center gap-1.5 px-2 w-full sm:w-auto">
              <Layers size={14} className="text-slate-400" />
              <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="outline-none bg-transparent cursor-pointer font-semibold text-slate-800 w-full sm:w-auto">
                <option value="all">Semua Cabang / Gabungan</option>
                {branches.map((b) => (<option key={b.id} value={b.id.toString()}>📍 {formatBranchName(b.nama_cabang)}</option>))}
              </select>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="outline-none bg-transparent cursor-pointer font-semibold text-slate-800">
                {["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"].map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 border-b-2 border-b-purple-500 mb-6">
          <div className="flex justify-between items-center mb-1"><p className="text-xs font-semibold text-purple-500 tracking-wider uppercase">Omzet Semua Cabang</p><Globe size={14} className="text-purple-500" /></div>
          <h3 className="text-xl font-bold tracking-tight text-purple-600 truncate">{formatRupiah(globalOmzet)}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80"><p className="text-xs font-semibold text-slate-400 uppercase">Omzet Bruto Terfilter</p><h3 className="text-xl font-bold text-slate-900">{formatRupiah(stats.total)}</h3></div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 border-b-2 border-b-blue-500"><p className="text-xs font-semibold text-blue-500 uppercase">Gross Owner (60%)</p><h3 className="text-xl font-bold text-blue-600">{formatRupiah(stats.owner)}</h3></div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 border-b-2 border-b-emerald-500"><p className="text-xs font-semibold text-emerald-600 uppercase">Total Jatah Karyawan (40%)</p><h3 className="text-xl font-bold text-emerald-600">{formatRupiah(stats.karyawan)}</h3></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dataRingkasan.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-start">
                <div><h3 className="font-bold">{item.nama}</h3><p className="text-xs text-slate-400">{item.unit} Unit • {formatBranchName(item.bName)}</p></div>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full uppercase">KMS 40%</span>
              </div>
              <div className="mt-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Gaji Bersih</p>
                <h4 className="text-2xl font-bold text-emerald-600">{formatRupiah(item.total * 0.4)}</h4>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}