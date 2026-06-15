"use client";
import { supabase } from "@/lib/supabase";
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
  MapPin,
  Globe,
  Layers,
  FileText,
  Calendar,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function LaporanHarian() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [loading, setLoading] = useState(false);
  
  // State filter tanggal (default: hari ini)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State data laporan harian
  const [transaksiHariIni, setTransaksiHariIni] = useState([]);
  const [pengeluaranHariIni, setPengeluaranHariIni] = useState([]);
  const [mapKaryawan, setMapKaryawan] = useState({});
  
  const [ringkasan, setRingkasan] = useState({
    totalUnit: 0,
    totalBruto: 0,
    totalPengeluaran: 0,
    setoranBersih: 0,
  });

  const pathname = usePathname();

  const fetchDataHarian = async () => {
    setLoading(true);
    try {
      // 1. Ambil data cabang untuk sidebar & dropdown
      const { data: resB } = await supabase
        .from("branches")
        .select("id, nama_cabang")
        .order("id", { ascending: true });
      if (resB) setBranches(resB);

      // 2. Ambil data karyawan untuk mapping ID -> Nama
      let queryKaryawan = supabase.from("Karyawans").select("Id, Nama, branch_id");
      if (selectedBranch !== "all") {
        queryKaryawan = queryKaryawan.eq("branch_id", selectedBranch);
      }
      const { data: resK } = await queryKaryawan;
      const mapping = {};
      if (resK) {
        resK.forEach((k) => { mapping[k.Id] = k.Nama; });
        setMapKaryawan(mapping);
      }

      // 3. Set range waktu 24 jam untuk tanggal yang dipilih
      const startOfDay = `${selectedDate}T00:00:00`;
      const endOfDay = `${selectedDate}T23:59:59`;

      // 4. Query Transaksi Masuk Hari Ini
      let queryTrans = supabase
        .from("Transaksis")
        .select("*")
        .gte("Tanggal", startOfDay)
        .lte("Tanggal", endOfDay);

      // 5. Query Pengeluaran Hari Ini
      let queryPengeluaran = supabase
        .from("PengeluaranHarians")
        .select("*")
        .gte("Tanggal", startOfDay)
        .lte("Tanggal", endOfDay);

      // Filter berdasarkan cabang yang dipilih di kontrol atas
      if (selectedBranch !== "all") {
        queryTrans = queryTrans.eq("branch_id", selectedBranch);
        queryPengeluaran = queryPengeluaran.eq("branch_id", selectedBranch);
      }

      const [{ data: transData }, { data: pengeluaranData }] = await Promise.all([
        queryTrans.order("Tanggal", { ascending: false }),
        queryPengeluaran.order("Tanggal", { ascending: false }),
      ]);

      const safeTrans = transData || [];
      const safePengeluaran = pengeluaranData || [];

      setTransaksiHariIni(safeTrans);
      setPengeluaranHariIni(safePengeluaran);

      // 6. Hitung Ringkasan Kas Hari Ini
      const bruto = safeTrans.reduce((sum, item) => sum + (Number(item.Total) || 0), 0);
      const biaya = safePengeluaran.reduce((sum, item) => sum + (Number(item.Jumlah) || 0), 0);
      
      setRingkasan({
        totalUnit: safeTrans.length,
        totalBruto: bruto,
        totalPengeluaran: biaya,
        setoranBersih: (bruto * 0.6) - biaya, // 60% jatah owner dikurangi pengeluaran operasional
      });

    } catch (err) {
      console.error("Gagal memuat laporan harian:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataHarian();
  }, [selectedDate, selectedBranch]);

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans antialiased text-slate-800 relative overflow-x-hidden">
      
      {/* MOBILE TRIGGER */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] bg-white text-slate-700 p-2.5 rounded-xl shadow-sm border border-slate-200"
      >
        <Menu size={18} />
      </button>

      {/* BACKDROP OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR - HIGH CLASS NAVY SLATE */}
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
            <div
              onClick={() => { setSelectedBranch("all"); setIsSidebarOpen(false); }}
              className={`px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2.5 text-xs transition-all ${selectedBranch === "all" ? "bg-slate-800 text-white font-semibold border-l-4 border-blue-500 pl-3" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              <Globe size={14} /> Gabungan Semua Unit
            </div>
            {branches.map((b) => (
              <div
                key={b.id}
                onClick={() => { setSelectedBranch(b.id.toString()); setIsSidebarOpen(false); }}
                className={`px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2.5 text-xs transition-all ${selectedBranch === b.id.toString() ? "bg-slate-800 text-white font-semibold border-l-4 border-blue-500 pl-3" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
              >
                <MapPin size={12} /> {b.nama_cabang}
              </div>
            ))}

            <p className="px-4 py-1.5 mt-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Operasional & Log</p>
            <Link href="/dashboard/transaksi" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3">
                <Receipt size={14} /> Input Transaksi
              </div>
            </Link>
            <Link href="/dashboard/laporan-harian" onClick={() => setIsSidebarOpen(false)}>
              <div className={`px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all ${pathname === "/dashboard/laporan-harian" ? "bg-blue-600 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
                <ClipboardList size={14} /> Laporan Harian
              </div>
            </Link>
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

            <div className="h-px bg-slate-800 my-4"></div>
            <Link href="/dashboard/branches" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-3 rounded-xl hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/20 flex items-center gap-3 transition-all font-semibold">
                <PlusCircle size={14} /> New Branch Unit
              </div>
            </Link>
          </nav>
        </div>
        
        <div className="border-t border-slate-800 pt-4 mt-auto space-y-3">
          <button 
            onClick={fetchDataHarian}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-all border border-slate-700/60 active:scale-98 flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw size={12} className={loading ? "animate-spin text-blue-400" : "text-slate-400"} />
            Sync Hari Ini
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 p-6 md:p-10 w-full max-w-5xl mx-auto min-w-0">
        
        {/* TOP HEADER */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
              {selectedBranch === "all" ? "Laporan Harian Gabungan" : "Laporan Harian Cabang"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Penutupan kas, rekap unit masuk, dan pengeluaran harian.</p>
          </div>

          {/* DATE & BRANCH CONTROLLER BOX */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200 w-full sm:w-auto text-xs font-medium text-slate-700">
            
            {/* SELEKTOR PILIH CABANG (FIXED & ADDED) */}
            <div className="flex items-center gap-1.5 px-2 w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-slate-200 pb-2 sm:pb-0 sm:pr-3">
              <Layers size={14} className="text-slate-400" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="outline-none bg-transparent cursor-pointer font-semibold text-slate-800 w-full sm:w-auto"
              >
                <option value="all">Semua Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id.toString()}>
                    {b.nama_cabang}
                  </option>
                ))}
              </select>
            </div>

            {/* SELEKTOR TANGGAL */}
            <div className="flex items-center gap-1.5 px-2 w-full sm:w-auto">
              <Calendar size={14} className="text-slate-400" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="outline-none bg-transparent cursor-pointer font-semibold text-slate-800 w-full sm:w-auto"
              />
            </div>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">Unit Dicuci</p>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">{ringkasan.totalUnit} <span className="text-xs font-medium text-slate-400">Motor</span></h3>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <p className="text-xs font-semibold text-blue-500 tracking-wider uppercase mb-1">Bruto Hari Ini</p>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 truncate">Rp {ringkasan.totalBruto.toLocaleString("id-ID")}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <p className="text-xs font-semibold text-rose-500 tracking-wider uppercase mb-1">Biaya Operasional</p>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 truncate">Rp {ringkasan.totalPengeluaran.toLocaleString("id-ID")}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <p className="text-xs font-semibold text-emerald-600 tracking-wider uppercase mb-1">Setoran Owner (Net)</p>
            <h3 className="text-xl font-bold tracking-tight text-emerald-600 truncate">Rp {ringkasan.setoranBersih.toLocaleString("id-ID")}</h3>
          </div>
        </div>

        {/* DOUBLE TABLE ROW (TRANSAKSI & PENGELUARAN) */}
        <div className="space-y-8">
          
          {/* TABLE 1: REKAPAN UNIT MASUK */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-800">Daftar Kendaraan Dicuci Hari Ini</h3>
              </div>
              <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold">Log Unit</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6">Nama Operator</th>
                    <th className="py-3 px-6">Jenis Layanan</th>
                    <th className="py-3 px-6">No. Plat / Detail</th>
                    <th className="py-3 px-6 text-right pe-8">Biaya</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 text-sm font-normal divide-y divide-slate-100">
                  {transaksiHariIni.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-xs text-slate-400 font-medium">Belum ada unit motor yang dicuci pada tanggal atau cabang ini.</td>
                    </tr>
                  ) : (
                    transaksiHariIni.map((item) => (
                      <tr key={item.Id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {mapKaryawan[item.KaryawanId] || <span className="text-rose-500 font-normal">Operator #{item.KaryawanId}</span>}
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium">{item.Layanan || "Cuci Motor"}</td>
                        <td className="py-4 px-6 text-slate-400 text-xs font-mono">{item.Keterangan || "-"}</td>
                        <td className="py-4 px-6 text-right font-bold text-slate-900 pe-8">
                          Rp {Number(item.Total).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: REKAPAN PENGELUARAN */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-800">Daftar Pengeluaran Operasional Hari Ini</h3>
              </div>
              <span className="text-xs bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full font-bold">Log Biaya</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6">Keperluan / Deskripsi Pengeluaran</th>
                    <th className="py-3 px-6 text-right pe-8">Jumlah Biaya</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 text-sm font-normal divide-y divide-slate-100">
                  {pengeluaranHariIni.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="py-8 text-center text-xs text-slate-400 font-medium">Bersih! Tidak ada pengeluaran kas pada cabang ini hari ini.</td>
                    </tr>
                  ) : (
                    pengeluaranHariIni.map((item) => (
                      <tr key={item.Id || item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 text-slate-800 font-medium">{item.Keperluan || item.Keterangan || "Pengeluaran Toko"}</td>
                        <td className="py-4 px-6 text-right font-bold text-rose-600 pe-8">
                          Rp {Number(item.Jumlah || item.total).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}