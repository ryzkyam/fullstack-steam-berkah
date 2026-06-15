"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";
import Link from "next/link";
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
  Edit2,
  Trash2,
  User,
  Phone,
  Briefcase,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

export default function ManajemenKaryawan() {
  const [karyawan, setKaryawan] = useState([]);
  const [branches, setBranches] = useState([]); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  const [notif, setNotif] = useState({ show: false, message: "", type: "success" });
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({ Id: null, Nama: "", Posisi: "Operator", NoTelp: "", branch_id: "" });

  const showAlert = (message, type = "success") => {
    setNotif({ show: true, message, type });
    setTimeout(() => setNotif({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resK, resB] = await Promise.all([
        supabase.from("Karyawans").select("*").order("Id", { ascending: true }),
        supabase.from("branches").select("*").order("id", { ascending: true })
      ]);
      
      if (!resK.error) setKaryawan(resK.data || []);
      if (!resB.error) setBranches(resB.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.branch_id) return showAlert("Pilih Cabang Penempatan!", "error");
    
    setLoading(true);
    try {
      const payload = { 
        Nama: formData.Nama, 
        Posisi: formData.Posisi, 
        NoTelp: formData.NoTelp,
        branch_id: Number(formData.branch_id)
      };

      if (formData.Id) {
        await supabase.from("Karyawans").update(payload).eq("Id", formData.Id);
        showAlert("Data Personil Berhasil Diupdate! ✨", "success");
      } else {
        await supabase.from("Karyawans").insert([payload]);
        showAlert("Personil Baru Berhasil Ditambahkan! 🚀", "success");
      }
      setShowModal(false);
      setFormData({ Id: null, Nama: "", Posisi: "Operator", NoTelp: "", branch_id: "" });
      fetchInitialData();
    } catch (err) {
      showAlert("Gagal menyimpan data", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("Karyawans").delete().eq("Id", deleteId);
    if (!error) {
      fetchInitialData();
      showAlert("Data Personil Telah Dihapus", "success");
    } else {
      showAlert("Gagal menghapus data personil", "error");
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
                 <h3 className="text-base font-bold text-slate-900">Hapus Data Karyawan?</h3>
                 <p className="text-xs text-slate-500 mt-1">Sistem akan menghapus record personil ini secara permanen dari basis data.</p>
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
              <div className={`px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all ${pathname === "/dashboard/karyawan" ? "bg-blue-600 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
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
            onClick={fetchInitialData}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-all border border-slate-700/60 active:scale-98 flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw size={12} className={loading ? "animate-spin text-blue-400" : "text-slate-400"} />
            Sync Tim Personil
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 p-6 md:p-10 w-full max-w-5xl mx-auto min-w-0">
        
        {/* HEADER CONTROLS */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
              Database Personil Tim
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Kelola penempatan, jabatan struktur, dan kontak WhatsApp operator.</p>
          </div>

          <button 
            onClick={() => { 
              setFormData({ Id: null, Nama: "", Posisi: "Operator", NoTelp: "", branch_id: "" }); 
              setShowModal(true); 
            }} 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle size={14} />
            TAMBAH KARYAWAN
          </button>
        </div>

        {/* LOOPING SEPARATOR GROUP PER CABANG */}
        {branches.map((branch) => {
          const timCabang = karyawan.filter(k => k.branch_id === branch.id);
          const namaCabangFormatted = branch.nama_cabang?.toUpperCase() === 'UMUM' ? 'CABANG UTAMA' : branch.nama_cabang?.toUpperCase();

          return (
            <div key={branch.id} className="mb-8">
              
              {/* Divider Nama Cabang yang Elegan */}
              <div className="flex items-center gap-3 mb-4">
                 <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin size={13} className="text-blue-500" /> {namaCabangFormatted}
                    <span className="text-xs bg-slate-200/70 text-slate-600 font-semibold px-2 py-0.2 rounded-full normal-case">
                      {timCabang.length} Personil
                    </span>
                 </h2>
                 <div className="h-px flex-1 bg-slate-200"></div>
              </div>

              {/* Tabel Personil */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3 px-6 w-24">ID Staff</th>
                        <th className="py-3 px-6">Nama Lengkap</th>
                        <th className="py-3 px-6">Posisi Jabatan</th>
                        <th className="py-3 px-6">Kontak WhatsApp</th>
                        <th className="py-3 px-6 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700 text-sm font-normal divide-y divide-slate-100">
                      {timCabang.length > 0 ? timCabang.map((item) => (
                        <tr key={item.Id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 px-6 text-slate-400 font-mono text-xs">#{item.Id}</td>
                          <td className="py-4 px-6 font-semibold text-slate-900">{item.Nama}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              item.Posisi === 'Kasir' 
                                ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                                : item.Posisi === 'Admin'
                                ? 'bg-purple-50 text-purple-600 border border-purple-200'
                                : 'bg-blue-50 text-blue-600 border border-blue-200'
                            }`}>
                              {item.Posisi}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-medium text-xs">{item.NoTelp || "-"}</td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center items-center gap-3">
                              <button 
                                onClick={() => { setFormData(item); setShowModal(true); }} 
                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => setDeleteId(item.Id)} 
                                className="text-slate-400 hover:text-rose-600 transition-colors"
                                title="Hapus"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-xs text-slate-400 font-medium">
                            Belum ada personil tim yang ditugaskan di cabang ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* MODAL INPUT / EDIT STAFF */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider">{formData.Id ? "Edit Profil Personil" : "Registrasi Personil Baru"}</span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Nama Lengkap</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-blue-500 transition-all">
                  <User size={14} className="text-slate-400" />
                  <input 
                    required 
                    type="text"
                    placeholder="Contoh: Fadel"
                    className="w-full bg-transparent font-semibold text-slate-800 outline-none text-sm uppercase" 
                    value={formData.Nama} 
                    onChange={(e) => setFormData({ ...formData, Nama: e.target.value })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Posisi Jabatan</label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-blue-500 transition-all">
                    <Briefcase size={14} className="text-slate-400" />
                    <select 
                      className="w-full bg-transparent font-semibold text-slate-800 outline-none text-xs cursor-pointer" 
                      value={formData.Posisi} 
                      onChange={(e) => setFormData({ ...formData, Posisi: e.target.value })}
                    >
                      <option value="Operator">Operator</option>
                      <option value="Kasir">Kasir</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Penempatan Unit</label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-blue-500 transition-all">
                    <Layers size={14} className="text-slate-400" />
                    <select 
                      required 
                      className="w-full bg-transparent font-semibold text-slate-800 outline-none text-xs cursor-pointer" 
                      value={formData.branch_id || ""} 
                      onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    >
                      <option value="">Pilih Cabang</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.nama_cabang?.toUpperCase() === 'UMUM' ? 'UTAMA' : b.nama_cabang?.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">No WhatsApp Aktif</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-blue-500 transition-all">
                  <Phone size={14} className="text-slate-400" />
                  <input 
                    required 
                    type="text"
                    placeholder="Contoh: 08123456789"
                    className="w-full bg-transparent font-semibold text-slate-800 outline-none text-sm" 
                    value={formData.NoTelp} 
                    onChange={(e) => setFormData({ ...formData, NoTelp: e.target.value })} 
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  disabled={loading} 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold text-xs shadow-md shadow-blue-600/10 transition-all uppercase tracking-wider"
                >
                  {loading ? "Menyimpan Data..." : "Konfirmasi Data Personil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}