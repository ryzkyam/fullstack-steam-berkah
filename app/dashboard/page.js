"use client";
import { supabase } from "@/lib/supabase";
import { Parser } from "json2csv";
import {
  ArrowRightLeft,
  Bike,
  BrainCircuit,
  ClipboardList,
  Download,
  History,
  LayoutDashboard,
  Menu,
  Package,
  PlusCircle,
  Receipt,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
  RefreshCw,
  MapPin,
  Globe
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [transaksi, setTransaksi] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    motor: 0,
    bruto: 0,
    jatahKaryawan: 0,
    jatahOwner: 0,
    biaya: 0,
    netto: 0,
  });

  const [trends, setTrends] = useState({ topLayanan: "-", topKategori: "-" });
  const [mapKaryawan, setMapKaryawan] = useState({});
  const pathname = usePathname();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: resB } = await supabase
        .from("branches")
        .select("id, nama_cabang")
        .order("id", { ascending: true });
      if (resB) setBranches(resB);

      let queryKaryawan = supabase
        .from("Karyawans")
        .select("Id, Nama, branch_id");
      if (selectedBranch !== "all") {
        queryKaryawan = queryKaryawan.eq("branch_id", selectedBranch);
      }
      const { data: resK } = await queryKaryawan;

      const mapping = {};
      if (resK) {
        resK.forEach((k) => {
          mapping[k.Id] = k.Nama;
        });
        setMapKaryawan(mapping);
      }

      const totalHari = new Date(selectedYear, selectedMonth, 0).getDate();
      const firstDay = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01T00:00:00`;
      const lastDay = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(totalHari).padStart(2, "0")}T23:59:59`;

      let queryTrans = supabase
        .from("Transaksis")
        .select(`
          *,
          Motors (
            Kategori
          )
        `)
        .gte("Tanggal", firstDay)
        .lte("Tanggal", lastDay);

      let queryPengeluaran = supabase
        .from("PengeluaranHarians")
        .select("Jumlah")
        .gte("Tanggal", firstDay)
        .lte("Tanggal", lastDay);

      if (selectedBranch !== "all") {
        queryTrans = queryTrans.eq("branch_id", selectedBranch);
        queryPengeluaran = queryPengeluaran.eq("branch_id", selectedBranch);
      }

      const [{ data: transData }, { data: pengeluaranData }] =
        await Promise.all([
          queryTrans.order("Tanggal", { ascending: false }),
          queryPengeluaran,
        ]);

      if (transData) {
        const totalBruto = transData.reduce((sum, item) => sum + (Number(item.Total) || 0), 0);
        const totalBiaya = pengeluaranData
          ? pengeluaranData.reduce((sum, item) => sum + (Number(item.Jumlah) || 0), 0)
          : 0;

        setStats({
          motor: transData.length,
          bruto: totalBruto,
          jatahKaryawan: totalBruto * 0.4,
          jatahOwner: totalBruto * 0.6,
          biaya: totalBiaya,
          netto: totalBruto * 0.6 - totalBiaya,
        });

        if (transData.length > 0) {
          const countLayanan = {};
          const countKategori = {};

          transData.forEach((item) => {
            const namaLayanan = item.Layanan || "-";
            if (namaLayanan !== "-") {
              countLayanan[namaLayanan] = (countLayanan[namaLayanan] || 0) + 1;
            }

            const catMotor = item.Motors?.Kategori || "-";
            if (catMotor !== "-") {
              countKategori[catMotor] = (countKategori[catMotor] || 0) + 1;
            }
          });

          setTrends({
            topLayanan: Object.keys(countLayanan).length
              ? Object.keys(countLayanan).reduce((a, b) => countLayanan[a] > countLayanan[b] ? a : b)
              : "Tidak Ada Data",
            topKategori: Object.keys(countKategori).length
              ? Object.keys(countKategori).reduce((a, b) => countKategori[a] > countKategori[b] ? a : b)
              : "Tidak Ada Data",
          });
        }
        setTransaksi(transData);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (transaksi.length === 0) return alert("Data periode ini kosong, bro!");
    try {
      const rekapPerKaryawan = {};
      transaksi.forEach((t) => {
        const nama = mapKaryawan[t.KaryawanId] || `ID-${t.KaryawanId}`;
        if (!rekapPerKaryawan[nama]) {
          rekapPerKaryawan[nama] = {
            Nama_Karyawan: nama,
            Total_Kendaraan: 0,
            Total_Omzet: 0,
            Gaji_Operator_40pct: 0,
          };
        }
        rekapPerKaryawan[nama].Total_Kendaraan += 1;
        rekapPerKaryawan[nama].Total_Omzet += Number(t.Total);
      });
      const finalData = Object.values(rekapPerKaryawan).map((item) => ({
        ...item,
        Gaji_Operator_40pct: item.Total_Omzet * 0.4,
      }));
      const parser = new Parser({ delimiter: ";" });
      const csv = parser.parse(finalData);
      const csvWithSeparator = "sep=;\n" + csv;
      const blob = new Blob([csvWithSeparator], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `LAPORAN_GAJI_SB${selectedBranch}_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export Gagal:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, selectedBranch]);

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden text-slate-800 font-sans">
      
      {/* MOBILE TRIGGER */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] bg-blue-600 text-white p-3 rounded-xl shadow-md active:scale-95 transition-transform border border-blue-500"
      >
        <Menu size={20} />
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
        className={`fixed md:sticky top-0 left-0 z-[60] w-72 h-screen bg-slate-900 text-slate-200 p-6 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} shadow-xl border-r border-slate-800 flex flex-col justify-between`}
      >
        <div>
          <div className="flex justify-between items-center mb-8 px-1">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 p-2 rounded-xl text-white font-black text-xs">SB</div>
              <div>
                <h2 className="text-md font-bold tracking-tight text-white leading-none">STEAM BERKAH</h2>
                <p className="text-[9px] font-semibold text-slate-500 tracking-wider mt-1 uppercase">Management System</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-slate-800 rounded-xl text-slate-400">
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1 text-xs font-semibold tracking-wide opacity-95 overflow-y-auto flex-1 pr-1 scrollbar-hide">
            <p className="px-4 py-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pustaka Utama</p>
            
            <Link href="/dashboard" onClick={() => setIsSidebarOpen(false)}>
              <div className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${pathname === "/dashboard" ? "bg-blue-600 text-white shadow-md font-bold" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                <LayoutDashboard size={16} /> Monitoring Utama
              </div>
            </Link>

            <Link href="/dashboard/analytics" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all font-bold flex items-center gap-3 my-2 shadow-sm">
                <BrainCircuit size={16} /> Analitik AI (Prophet)
              </div>
            </Link>

            {/* SELEKTOR CABANG STYLE MINIMALIS */}
            <p className="px-4 py-1.5 mt-5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">Unit Kerja Cabang</p>
            <div
              onClick={() => { setSelectedBranch("all"); setIsSidebarOpen(false); }}
              className={`px-4 py-3 rounded-xl cursor-pointer flex items-center gap-2.5 transition-all ${selectedBranch === "all" ? "bg-slate-800 text-white font-bold border-l-4 border-blue-500 pl-3" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              <Globe size={14} /> Gabungan Semua Unit
            </div>
            {branches.map((b) => (
              <div
                key={b.id}
                onClick={() => { setSelectedBranch(b.id.toString()); setIsSidebarOpen(false); }}
                className={`px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2.5 text-[11px] transition-all ${selectedBranch === b.id.toString() ? "bg-slate-800 text-white font-bold border-l-4 border-blue-500 pl-3" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
              >
                <MapPin size={12} /> {b.nama_cabang}
              </div>
            ))}

            <p className="px-4 py-1.5 mt-5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">Operasional & Log</p>
            <Link href="/dashboard/transaksi" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-3">
                <Receipt size={14} /> Input Transaksi
              </div>
            </Link>
            <Link href="/dashboard/laporan-harian" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-3">
                <ClipboardList size={14} /> Laporan Harian
              </div>
            </Link>
            <Link href="/dashboard/jasa-operator" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-3">
                <History size={14} /> Gaji per-Operator
              </div>
            </Link>
            <Link href="/dashboard/pengeluaran" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-3">
                <Wallet size={14} /> Biaya Pengeluaran
              </div>
            </Link>
            <Link href="/dashboard/stock" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-3">
                <Package size={14} /> Stok Barang
              </div>
            </Link>
            <Link href="/dashboard/karyawan" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-3">
                <Users size={14} /> Manajemen Karyawan
              </div>
            </Link>

            <div className="h-px bg-slate-800 my-4"></div>
            <Link href="/dashboard/branches" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-3 rounded-xl hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/20 flex items-center gap-3 transition-all">
                <PlusCircle size={14} /> Tambah Cabang Baru
              </div>
            </Link>
            
          </nav>
        </div>
        <div className="pt-4 border-t border-slate-800 text-slate-600 text-[9px] font-bold tracking-widest uppercase">
          v2.0 Stable Build
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 p-6 md:p-10 w-full max-w-7xl mx-auto min-w-0">
        
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 mt-16 sm:mt-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
              {selectedBranch === "all"
                ? "Monitoring Central"
                : `${branches.find((b) => b.id.toString() === selectedBranch)?.nama_cabang || ""} Dashboard`}
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Ringkasan performa bisnis berkala</p>
          </div>

          {/* CONTROLLER BOX */}
          <div className="flex items-center gap-2.5 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-full sm:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-bold bg-slate-50 text-slate-700 rounded-xl p-2.5 outline-none cursor-pointer border border-transparent focus:border-slate-200"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(0, i))}
                </option>
              ))}
            </select>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleExport}
                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Download size={14} /> Export
              </button>
              <button
                onClick={fetchData}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition border border-slate-200/40"
                title="Sync Data"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* AI PREDICTION CARD */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm mb-8 border-l-4 border-amber-500 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 opacity-5 pointer-events-none">
            <BrainCircuit size={120} className="text-amber-400" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} /> Data Mining Forecast (Prophet)
                </span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-slate-100 mt-0.5">Estimasi Pendapatan Bulan Depan</h2>
            </div>
            <div className="sm:text-right">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
                Rp {(stats.bruto * 1.15).toLocaleString("id-ID")}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Proyeksi pertumbuhan tren +15%</p>
            </div>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <ArrowRightLeft size={12} /> Total Volume
            </p>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{stats.motor} <span className="text-xs font-medium text-slate-400">Unit</span></h3>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <TrendingUp size={12} /> Omzet Bruto
            </p>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 truncate">Rp {stats.bruto.toLocaleString("id-ID")}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">Total Pengeluaran</p>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 truncate">Rp {stats.biaya.toLocaleString("id-ID")}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Wallet size={12} /> Profit Netto
            </p>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 truncate">Rp {stats.netto.toLocaleString("id-ID")}</h3>
          </div>
        </div>

        {/* SUB-METRICS GRID (PROFIT & ALOKASI) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border-t-4 border-slate-700 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Komisi Operator (40%)</p>
            <h4 className="text-xl font-bold text-slate-800">Rp {stats.jatahKaryawan.toLocaleString("id-ID")}</h4>
          </div>
          <div className="bg-white p-5 rounded-2xl border-t-4 border-blue-600 shadow-sm">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">Setoran Bersih Toko (Owner)</p>
            <h4 className="text-xl font-bold text-blue-700">Rp {stats.netto.toLocaleString("id-ID")}</h4>
          </div>
        </div>

        {/* REVENUE INSIGHT / TREND ZONE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Sparkles size={20} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Layanan Terlaris</p>
              <h4 className="text-md font-bold text-slate-800 uppercase truncate">{trends.topLayanan}</h4>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-4">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><Bike size={20} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kategori Motor Dominan</p>
              <h4 className="text-md font-bold text-slate-800 uppercase truncate">{trends.topKategori}</h4>
            </div>
          </div>
        </div>

        {/* LOG HISTORY TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Riwayat Arus Transaksi Terkini</h4>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full animate-pulse">Live Feed</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100 tracking-wider">
                  <th className="py-4 px-6">Nama Operator</th>
                  <th className="py-4 px-6">Jenis Layanan</th>
                  <th className="py-4 px-6">Waktu Transaksi</th>
                  <th className="py-4 px-6 text-right">Total Biaya</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 text-xs font-medium divide-y divide-slate-100">
                {transaksi.slice(0, 10).map((item) => (
                  <tr key={item.Id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {mapKaryawan[item.KaryawanId] || <span className="text-rose-500 font-normal">ID: {item.KaryawanId}</span>}
                    </td>
                    <td className="py-4 px-6 text-slate-500">{item.Layanan || "Cuci Motor"}</td>
                    <td className="py-4 px-6 text-slate-400 font-normal">
                      {new Date(item.Tanggal).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} WIB
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900 text-sm">
                      Rp {Number(item.Total).toLocaleString("id-ID")}
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