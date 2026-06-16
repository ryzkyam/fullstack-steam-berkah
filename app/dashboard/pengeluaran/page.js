"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BrainCircuit,
  Receipt,
  ClipboardList,
  History,
  Wallet,
  Package,
  Users,
  PlusCircle,
  Menu,
  X,
  RefreshCw,
  Calendar,
  MapPin,
  FileText,
  DollarSign,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

export default function Pengeluaran() {
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]); 
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  
  const [notif, setNotif] = useState({ show: false, message: "", type: "success" });
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({ 
    Id: null, 
    Keterangan: "", 
    Jumlah: 0, 
    Tanggal: new Date().toISOString().split('T')[0],
    branch_id: "" 
  });

  const showAlert = (message, type = "success") => {
    setNotif({ show: true, message, type });
    setTimeout(() => setNotif({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data cabang dulu buat referensi alamat & nama
      const { data: rawBranches } = await supabase
        .from("branches")
        .select("*")
        .order("id", { ascending: true });

      if (rawBranches) setBranches(rawBranches);

      // 2. Ambil data pengeluaran
      const { data: rawPengeluaran } = await supabase
        .from("PengeluaranHarians")
        .select("*")
        .order("Tanggal", { ascending: false });

      // 3. Gabungin datanya
      if (rawPengeluaran && rawBranches) {
        const merged = rawPengeluaran.map(item => ({
          ...item,
          detail_cabang: rawBranches.find(b => b.id === Number(item.branch_id)) || null
        }));
        setData(merged);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

const handleSave = async (e) => {
  e.preventDefault();

  if (!formData.branch_id) {
    return showAlert("Pilih Cabang Dulu!", "error");
  }

  setLoading(true);

  try {
    const payload = {
      Tanggal: new Date(formData.Tanggal).toISOString(),
      Keterangan: formData.Keterangan,
      Jumlah: Number(formData.Jumlah),
      branch_id: Number(formData.branch_id),
    };

    console.log("payload:", payload);

    let response;

    if (formData.Id) {
      response = await supabase
        .from("PengeluaranHarians")
        .update(payload)
        .eq("Id", formData.Id)
        .select();

      console.log("update response:", response);

      if (response.error) {
        throw response.error;
      }

      showAlert("Data Diupdate! ✨", "success");
    } else {
      response = await supabase
        .from("PengeluaranHarians")
        .insert([payload])
        .select();

      console.log("insert response:", response);

      if (response.error) {
        throw response.error;
      }

      showAlert("Berhasil Dicatat! 🚀", "success");
    }

    setShowModal(false);

    setFormData({
      Id: null,
      Keterangan: "",
      Jumlah: 0,
      Tanggal: new Date().toISOString().split("T")[0],
      branch_id: "",
    });

    fetchData();
  } catch (err) {
    console.error("Supabase Error:", err);

    showAlert(
      err.message || "Gagal menyimpan data",
      "error"
    );
  } finally {
    setLoading(false);
  }
};
  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("PengeluaranHarians").delete().eq("Id", deleteId);
    if (!error) {
      fetchData();
      showAlert("Data Berhasil Dihapus", "success");
    } else {
      showAlert("Gagal menghapus data", "error");
    }
    setDeleteId(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans antialiased text-slate-800 relative overflow-x-hidden">
      
      {/* NOTIFIKASI TOAST FLOATING */}
      {notif.show && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl transition-all duration-300 border backdrop-blur-sm animate-in fade-in slide-in-from-top-5 ${
          notif.type === "success" 
            ? "bg-emerald-500 text-white border-emerald-600" 
            : "bg-rose-500 text-white border-rose-600"
        }`}>
          {notif.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="text-xs font-bold tracking-wide">{notif.message}</span>
        </div>
      )}

      {/* MODAL CONFIRM DELETE */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/40 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-slate-100">
            <div className="p-6 text-center space-y-4">
               <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                 <AlertTriangle size={24} />
               </div>
               <div>
                 <h3 className="text-base font-bold text-slate-900">Hapus Log Biaya?</h3>
                 <p className="text-xs text-slate-500 mt-1">Record biaya operasional ini akan dihapus secara permanen dari neraca saldo keuangan.</p>
               </div>
               <div className="grid grid-cols-2 gap-3 pt-2">
                 <button onClick={() => setDeleteId(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl font-semibold text-xs transition-all">Batal</button>
                 <button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white p-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm shadow-rose-600/10">Ya, Hapus</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE TRIGGER */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] bg-white text-slate-700 p-2.5 rounded-xl shadow-sm border border-slate-200"
      >
        <Menu size={18} />
      </button>

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

            <p className="px-4 py-1.5 mt-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Operasional & Log</p>
            <Link href="/dashboard/transaksi" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3">
                <Receipt size={14} /> Input Transaksi
              </div>
            </Link>
            <Link href="/dashboard/laporan-harian" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3">
                <ClipboardList size={14} /> Laporan Harian
              </div>
            </Link>
            <Link href="/dashboard/jasa-operator" onClick={() => setIsSidebarOpen(false)}>
              <div className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-3">
                <History size={14} /> Gaji per-Operator
              </div>
            </Link>
            <Link href="/dashboard/pengeluaran" onClick={() => setIsSidebarOpen(false)}>
              <div className={`px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all ${pathname === "/dashboard/pengeluaran" ? "bg-blue-600 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
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
          </nav>
        </div>
        
        <div className="border-t border-slate-800 pt-4 mt-auto">
          <button 
            onClick={fetchData}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-all border border-slate-700/60 flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw size={12} className={loading ? "animate-spin text-blue-400" : "text-slate-400"} />
            Sync Mutasi Finansial
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 p-6 md:p-10 w-full max-w-6xl mx-auto min-w-0">
        
        {/* HEADER CONTROLS */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 mt-12 md:mt-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
              Biaya Operasional Harian
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Pantau pengeluaran tak terduga, log pembelian barang, dan beban per cabang.</p>
          </div>

          <button 
            onClick={() => { 
              setFormData({ Id: null, Keterangan: "", Jumlah: 0, Tanggal: new Date().toISOString().split('T')[0], branch_id: "" }); 
              setShowModal(true); 
            }} 
            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-rose-600/10 transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle size={14} />
            INPUT BIAYA OPERASIONAL
          </button>
        </div>

        {/* RIWAYAT PENGELUARAN TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 px-5 py-3 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
            <Wallet size={13} className="text-rose-400" />
            Buku Jurnal Mutasi Pengeluaran Kas
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-5">Tanggal</th>
                  <th className="py-3.5 px-5">Lokasi Penempatan</th>
                  <th className="py-3.5 px-5">Detail Alamat</th>
                  <th className="py-3.5 px-5">Deskripsi Keperluan</th>
                  <th className="py-3.5 px-5 text-right">Nominal Beban</th>
                  <th className="py-3.5 px-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 text-sm font-normal divide-y divide-slate-100">
                {data.length > 0 ? data.map((item) => {
                  const isUtama = item.branch_id === 1;
                  return (
                    <tr key={item.Id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-5 text-slate-500 font-medium text-xs whitespace-nowrap">
                        {item.Tanggal?.split('T')[0]}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isUtama 
                            ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}>
                          {item.detail_cabang?.nama_cabang?.toUpperCase() || "TANPA CABANG"}
                        </span>
                      </td>
                      <td className="py-4 px-5 max-w-[180px] truncate">
                        <div className="font-medium text-slate-800 text-xs">{item.detail_cabang?.alamat || "-"}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">{item.detail_cabang?.kota || ""}</div>
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-600 max-w-xs truncate uppercase text-xs">
                        {item.Keterangan}
                      </td>
                      <td className="py-4 px-5 text-right font-bold text-rose-600 font-mono text-sm whitespace-nowrap">
                        Rp {Number(item.Jumlah).toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex justify-center items-center gap-3">
                          <button 
                            onClick={() => { 
                              setFormData({ 
                                Id: item.Id, 
                                Keterangan: item.Keterangan, 
                                Jumlah: item.Jumlah, 
                                Tanggal: item.Tanggal.split('T')[0], 
                                branch_id: item.branch_id 
                              }); 
                              setShowModal(true); 
                            }} 
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => setDeleteId(item.Id)} 
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-xs text-slate-400 font-medium">
                      Tidak ada catatan pengeluaran biaya operasional yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL INPUT & EDIT PENGELUARAN */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-rose-400" />
                <span className="text-xs font-bold uppercase tracking-wider">{formData.Id ? "Edit Transaksi Pengeluaran" : "Pencatatan Beban Biaya Baru"}</span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Penempatan Cabang</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-blue-500 transition-all">
                  <MapPin size={14} className="text-slate-400" />
                  <select 
                    required
                    className="w-full bg-transparent font-semibold text-slate-800 outline-none text-xs cursor-pointer uppercase"
                    value={formData.branch_id}
                    onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                  >
                    <option value="">-- PILIH LOKASI UNIT --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nama_cabang?.toUpperCase()} ({b.kota?.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Tanggal Pembayaran / Pengeluaran</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-blue-500 transition-all">
                  <Calendar size={14} className="text-slate-400" />
                  <input 
                    type="date" 
                    required
                    className="w-full bg-transparent font-semibold text-slate-800 outline-none text-xs" 
                    value={formData.Tanggal} 
                    onChange={(e) => setFormData({...formData, Tanggal: e.target.value})} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Keterangan / Deskripsi Biaya</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-blue-500 transition-all">
                  <FileText size={14} className="text-slate-400" />
                  <input 
                    required 
                    type="text"
                    placeholder="Contoh: PEMBELIAN SABUN & SEMIR BULANAN"
                    className="w-full bg-transparent font-semibold text-slate-800 outline-none text-xs uppercase" 
                    value={formData.Keterangan} 
                    onChange={(e) => setFormData({...formData, Keterangan: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Nominal Pengeluaran Kas (Rp)</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-blue-500 transition-all">
                  <DollarSign size={14} className="text-slate-400" />
                  <input 
                    type="number" 
                    required 
                    min="0"
                    placeholder="Masukkan angka tanpa titik/koma"
                    className="w-full bg-transparent font-semibold text-slate-800 outline-none text-sm font-mono" 
                    value={formData.Jumlah || ""} 
                    onChange={(e) => setFormData({...formData, Jumlah: e.target.value})} 
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  disabled={loading} 
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white p-3.5 rounded-xl font-bold text-xs shadow-md shadow-rose-600/10 transition-all uppercase tracking-wider"
                >
                  {loading ? "Menyimpan Data..." : "Simpan Mutasi Pengeluaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}