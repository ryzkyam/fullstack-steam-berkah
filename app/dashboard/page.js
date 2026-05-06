"use client";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Parser } from "json2csv";
import { 
  Menu, X, TrendingUp, Wallet, ArrowRightLeft, 
  LayoutDashboard, BrainCircuit, ClipboardList, 
  PlusCircle, Users, Package, Receipt, History, Sparkles, Download
} from "lucide-react";

export default function Dashboard() {
  const [transaksi, setTransaksi] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all"); 

  const [stats, setStats] = useState({
    motor: 0, bruto: 0, jatahKaryawan: 0, jatahOwner: 0, biaya: 0, netto: 0,
  });

  const [mapKaryawan, setMapKaryawan] = useState({});
  const pathname = usePathname();

  const fetchData = async () => {
    try {
      // 1. Ambil List Cabang (Pastikan Nama Cabang Muncul Benar)
      const { data: resB } = await supabase.from("branches").select("id, nama_cabang").order("id", { ascending: true });
      if (resB) setBranches(resB);

      // 2. Ambil Karyawan dengan Filter Cabang Aktif
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

      // 3. Setup Filter Waktu
      const firstDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01T00:00:00`;
      const lastDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31T23:59:59`;

      // 4. Query Transaksi & Pengeluaran
      let queryTrans = supabase.from("Transaksis").select("*")
        .gte("Tanggal", firstDay)
        .lte("Tanggal", lastDay);
      
      let queryPengeluaran = supabase.from("PengeluaranHarians").select("Jumlah")
        .gte("Tanggal", firstDay)
        .lte("Tanggal", lastDay);

      if (selectedBranch !== "all") {
        queryTrans = queryTrans.eq("branch_id", selectedBranch);
        queryPengeluaran = queryPengeluaran.eq("branch_id", selectedBranch);
      }

      const [{ data: transData }, { data: pengeluaranData }] = await Promise.all([
        queryTrans.order("Tanggal", { ascending: false }),
        queryPengeluaran
      ]);

      if (transData) {
        const totalBruto = transData.reduce((sum, item) => sum + (Number(item.Total) || 0), 0);
        const totalBiaya = pengeluaranData 
          ? pengeluaranData.reduce((sum, item) => sum + (Number(item.Jumlah) || 0), 0) 
          : 0;

        setStats({
          motor: transData.length,
          bruto: totalBruto,
          jatahKaryawan: totalBruto * 0.4, // Sesuai Payroll Steam Motor Berkah
          jatahOwner: totalBruto * 0.6,
          biaya: totalBiaya,
          netto: (totalBruto * 0.6) - totalBiaya,
        });
        setTransaksi(transData);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data:", err);
    }
  };

  // --- FITUR EXPORT (FIXED FORMAT EXCEL) ---
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
            Gaji_Operator_40pct: 0
          };
        }
        rekapPerKaryawan[nama].Total_Kendaraan += 1;
        rekapPerKaryawan[nama].Total_Omzet += Number(t.Total);
      });
      const finalData = Object.values(rekapPerKaryawan).map(item => ({
        ...item,
        Gaji_Operator_40pct: item.Total_Omzet * 0.4
      }));
      const parser = new Parser({ delimiter: ';' }); 
      const csv = parser.parse(finalData);
      const csvWithSeparator = "sep=;\n" + csv; // Agar Excel langsung membagi kolom
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
    <div className="flex min-h-screen bg-slate-100 relative overflow-x-hidden text-slate-900 font-sans">
      
      {/* MOBILE TRIGGER */}
      <button onClick={() => setIsSidebarOpen(true)} className="md:hidden fixed top-4 left-4 z-[60] bg-[#2b459a] text-white p-3 rounded-2xl shadow-lg">
        <Menu size={24} strokeWidth={3} />
      </button>

      {/* SIDEBAR FULL (FIXED MAPPING & LINKS) */}
      <aside className={` md:sticky top-0 left-0 z-[60] w-72 h-screen bg-[#2b459a] text-white p-4 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} shadow-2xl border-r border-blue-800 flex flex-col`}>
        <div className="flex justify-between items-center mb-6 mt-2 px-2">
          <h2 className="text-xl font-bold italic uppercase tracking-tighter flex items-center gap-2">
            <LayoutDashboard size={20} /> STEAM BERKAH 🚀
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/10 rounded-xl">
            <X size={24} />
          </button>
        </div>
        
        <nav className="space-y-1 text-[11px] font-bold uppercase tracking-wider opacity-90 overflow-y-auto flex-1 pr-2 custom-sidebar-scroll">
          <p className="px-4 py-2 text-[8px] opacity-50 tracking-[0.2em]">Pusat Kendali</p>
          <Link href="/dashboard" onClick={() => setIsSidebarOpen(false)}>
            <div className={`p-4 rounded-xl cursor-pointer ${pathname === "/dashboard" ? "bg-blue-600 shadow-lg italic" : "hover:bg-blue-800"}`}>📊 Monitoring Utama</div>
          </Link>
          
          <Link href="/dashboard/analytics" onClick={() => setIsSidebarOpen(false)}>
            <div className={`p-4 rounded-xl cursor-pointer border border-yellow-400 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400 hover:text-blue-900 transition-all shadow-lg italic flex items-center gap-2 my-2`}>
              <BrainCircuit size={16} /> ANALITIK AI (PROPHET)
            </div>
          </Link>

          <p className="px-4 py-2 mt-4 text-[8px] opacity-50 tracking-[0.2em]">Pilih Unit Cabang</p>
          <div onClick={() => { setSelectedBranch("all"); setIsSidebarOpen(false); }} className={`p-4 rounded-xl cursor-pointer transition-all ${selectedBranch === "all" ? "bg-blue-600 shadow-lg italic" : "hover:bg-blue-800"}`}>🌍 Gabungan Semua Unit</div>
          {branches.map((b) => (
            <div key={b.id} onClick={() => { setSelectedBranch(b.id.toString()); setIsSidebarOpen(false); }} className={`p-4 rounded-xl cursor-pointer transition-all ${selectedBranch === b.id.toString() ? "bg-blue-500 shadow-md italic" : "hover:bg-blue-800"}`}>📍- {b.nama_cabang}</div>
          ))}

          <p className="px-4 py-2 mt-4 text-[8px] opacity-50 tracking-[0.2em]">Manajemen Operasional</p>
          <Link href="/dashboard/transaksi" onClick={() => setIsSidebarOpen(false)}><div className="p-4 rounded-xl hover:bg-blue-800 flex items-center gap-2"><Receipt size={14} /> Input Transaksi</div></Link>
          <Link href="/dashboard/laporan-harian" onClick={() => setIsSidebarOpen(false)}><div className="p-4 rounded-xl hover:bg-blue-800 flex items-center gap-2"><ClipboardList size={14} /> Laporan Harian</div></Link>
          <Link href="/dashboard/jasa-operator" onClick={() => setIsSidebarOpen(false)}><div className="p-4 rounded-xl hover:bg-blue-800 flex items-center gap-2"><History size={14} /> Gaji per-Operator</div></Link>
          <Link href="/dashboard/pengeluaran" onClick={() => setIsSidebarOpen(false)}><div className="p-4 rounded-xl hover:bg-blue-800 flex items-center gap-2"><Wallet size={14} /> Biaya Pengeluaran</div></Link>
          <Link href="/dashboard/stock" onClick={() => setIsSidebarOpen(false)}><div className="p-4 rounded-xl hover:bg-blue-800 flex items-center gap-2"><Package size={14} /> Stok Barang</div></Link>
          <Link href="/dashboard/karyawan" onClick={() => setIsSidebarOpen(false)}><div className="p-4 rounded-xl hover:bg-blue-800 flex items-center gap-2"><Users size={14} /> Manajemen Karyawan</div></Link>
          
          <div className="h-px bg-white/10 my-4"></div>
          <Link href="/dashboard/branches" onClick={() => setIsSidebarOpen(false)}>
            <div className="p-4 rounded-xl hover:bg-yellow-400 hover:text-blue-900 text-yellow-400 border border-yellow-400/20 flex items-center gap-2 transition-all">
              <PlusCircle size={14} /> Tambah Cabang Baru
            </div>
          </Link>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 w-full transition-all">
        {/* HEADER DENGAN FIX NAMA CABANG DINAMIS */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4 mt-16 md:mt-0">
          <h1 className="text-xl md:text-3xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">
            {selectedBranch === 'all' 
              ? 'CENTRAL DASHBOARD 🌍' 
              : ` - ${branches.find(b => b.id.toString() === selectedBranch)?.nama_cabang || ''} 📍`
            }
          </h1>
          
          <div className="flex flex-wrap justify-center gap-2 items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-full md:w-auto">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-[10px] font-black uppercase px-2 outline-none cursor-pointer">
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>{new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(0, i))}</option>
              ))}
            </select>
            <button onClick={handleExport} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-[9px] font-black shadow-lg uppercase flex items-center gap-1 hover:bg-emerald-700">
              <Download size={12} /> Export CSV
            </button>
            <button onClick={fetchData} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-[9px] font-black shadow-lg uppercase hover:bg-blue-700">🔄 Sync Data</button>
          </div>
        </div>

        {/* BAR ANALISTIK AI PROPHET (KEMBALI MEJENG) */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl mb-8 border-l-8 border-yellow-400 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                <BrainCircuit size={80} className="text-yellow-400" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-white">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                          <Sparkles size={10} /> Data Mining: Prophet Mode
                        </span>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase mt-1">Estimasi Revenue</h2>
                </div>
                <div className="sm:text-right">
                    <h3 className="text-2xl md:text-3xl font-black text-emerald-400 italic tracking-tighter">
                        Rp {(stats.bruto * 1.15).toLocaleString()}*
                    </h3>
                    <p className="text-[8px] text-white/30 uppercase font-bold tracking-[0.2em]">Forecasting Pertumbuhan +15%</p>
                </div>
            </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 text-white">
          <div className="bg-blue-600 p-4 md:p-6 rounded-3xl shadow-xl border-b-8 border-blue-800">
            <p className="text-[8px] md:text-[10px] font-bold uppercase opacity-70 mb-1 flex items-center gap-1"><ArrowRightLeft size={10} /> Total Unit</p>
            <h3 className="text-xl md:text-3xl font-black italic">{stats.motor} <span className="text-[10px]">U</span></h3>
          </div>
          <div className="bg-emerald-600 p-4 md:p-6 rounded-3xl shadow-xl border-b-8 border-emerald-800">
            <p className="text-[8px] md:text-[10px] font-bold uppercase opacity-70 mb-1 flex items-center gap-1"><TrendingUp size={10} /> Omzet Bruto</p>
            <h3 className="text-[14px] md:text-2xl font-black italic">Rp {stats.bruto.toLocaleString()}</h3>
          </div>
          <div className="bg-rose-600 p-4 md:p-6 rounded-3xl shadow-xl border-b-8 border-rose-800">
            <p className="text-[8px] md:text-[10px] font-bold uppercase opacity-70 mb-1">Pengeluaran Ops</p>
            <h3 className="text-[14px] md:text-2xl font-black italic">Rp {stats.biaya.toLocaleString()}</h3>
          </div>
          <div className="bg-orange-600 p-4 md:p-6 rounded-3xl shadow-xl border-b-8 border-orange-800">
            <p className="text-[8px] md:text-[10px] font-bold uppercase opacity-70 mb-1 flex items-center gap-1"><Wallet size={10} /> Profit Netto</p>
            <h3 className="text-[14px] md:text-2xl font-black italic">Rp {stats.netto.toLocaleString()}</h3>
          </div>
        </div>

        {/* BAGI HASIL INFO (FIXED PROFIT SHARING LOGIC) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10 text-slate-800">
          <div className="bg-white p-5 md:p-6 rounded-3xl border-l-[10px] border-emerald-500 shadow-xl">
            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase">Total Gaji Operator (40%)</p>
            <h4 className="text-lg md:text-3xl font-black italic">Rp {stats.jatahKaryawan.toLocaleString()}</h4>
          </div>
          <div className="bg-white p-5 md:p-6 rounded-3xl border-l-[10px] border-blue-500 shadow-xl">
            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase">Setoran Bersih Owner</p>
            <h4 className="text-lg md:text-3xl font-black italic">Rp {stats.netto.toLocaleString()}</h4>
          </div>
        </div>

        {/* TABLE DATA AKTIVITAS TERBARU */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-[#1e3a8a] p-4 md:p-5 text-white flex justify-between items-center font-black text-[10px] uppercase italic">
            <span>Riwayat Transaksi Terkini</span>
            <span className="bg-blue-500 px-3 py-1 rounded-full text-[8px] not-italic">LIVE TRACKING</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black border-b border-slate-100">
                  <th className="p-4">Nama Operator</th>
                  <th className="p-4">Jenis Layanan</th>
                  <th className="p-4">Waktu Transaksi</th>
                  <th className="p-4 text-right pe-6 md:pe-10">Total Biaya</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 text-[11px] md:text-[12px] font-bold uppercase italic">
                {transaksi.slice(0, 10).map((item) => (
                  <tr key={item.Id} className="border-b border-slate-50 hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 font-black text-blue-900">
                      {mapKaryawan[item.KaryawanId] || <span className="text-rose-400">ID: {item.KaryawanId}</span>}
                    </td>
                    <td className="p-4 text-slate-500 font-medium">{item.Layanan || "Cuci Motor"}</td>
                    <td className="p-4 text-slate-400 font-medium not-italic">
                      {new Date(item.Tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}
                    </td>
                    <td className="p-4 text-right font-black text-emerald-600 text-[13px] md:text-[14px] pe-6 md:pe-10">
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