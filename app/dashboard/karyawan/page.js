"use client";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManajemenKaryawan() {
  const [karyawan, setKaryawan] = useState([]);
  const [branches, setBranches] = useState([]); // State Cabang Baru
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  const [notif, setNotif] = useState({ show: false, message: "", type: "success" });
  const [deleteId, setDeleteId] = useState(null);

  // Update formData: Tambah branch_id
  const [formData, setFormData] = useState({ Id: null, Nama: "", Posisi: "Operator", NoTelp: "", branch_id: "" });

  const showAlert = (message, type = "success") => {
    setNotif({ show: true, message, type });
    setTimeout(() => setNotif({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchInitialData = async () => {
    // Ambil Karyawan & Cabang sekaligus
    const [resK, resB] = await Promise.all([
      supabase.from("Karyawans").select("*").order("Id", { ascending: true }),
      supabase.from("branches").select("*").order("id", { ascending: true })
    ]);
    
    if (!resK.error) setKaryawan(resK.data);
    if (!resB.error) setBranches(resB.data);
  };

  useEffect(() => { fetchInitialData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        Nama: formData.Nama, 
        Posisi: formData.Posisi, 
        NoTelp: formData.NoTelp,
        branch_id: formData.branch_id || null // Kirim branch_id ke DB
      };

      if (formData.Id) {
        await supabase.from("Karyawans").update(payload).eq("Id", formData.Id);
        showAlert("Data Personil Berhasil Diupdate! ✨");
      } else {
        await supabase.from("Karyawans").insert([payload]);
        showAlert("Personil Baru Berhasil Ditambahkan! 🚀");
      }
      setShowModal(false);
      setFormData({ Id: null, Nama: "", Posisi: "Operator", NoTelp: "", branch_id: "" });
      fetchInitialData();
    } catch (err) {
      showAlert(err.message, "error");
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
    }
    setDeleteId(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 overflow-x-hidden relative">
      
      {/* 1. CUSTOM TOAST NOTIFICATION (Style Fix) */}
      {notif.show && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${
          notif.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}>
          <span className="text-lg font-black uppercase tracking-widest">{notif.message}</span>
        </div>
      )}

      {/* 2. CUSTOM DELETE CONFIRMATION MODAL (Style Fix) */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-xs overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-4">
              <div className="text-5xl">⚠️</div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Yakin Ingin Menghapus?</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">Data yang sudah dihapus tidak bisa dikembalikan lagi bro.</p>
              <div className="flex flex-col gap-2 pt-4">
                <button onClick={confirmDelete} className="w-full bg-[#ff4d4d] text-white p-4 rounded-2xl font-black text-xs shadow-lg hover:bg-red-600 transition-all uppercase">Ya, Hapus Sekarang</button>
                <button onClick={() => setDeleteId(null)} className="w-full bg-slate-100 text-slate-400 p-4 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all uppercase">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR (Warna Biru Fix) */}
      <aside className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-64 bg-[#2b459a] text-white p-6 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} flex flex-col`}>
        <h2 className="text-xl font-black mb-10 italic uppercase border-b border-blue-800 pb-4 mt-12 md:mt-0 text-center md:text-left">STEAM BERKAH 🚀</h2>
        <nav className="flex-1 space-y-2 text-xs font-bold uppercase tracking-wider">
          <Link href="/dashboard"><div className="p-4 rounded-xl hover:bg-blue-800 transition-all">📊 Dashboard</div></Link>
          <div className="p-4 rounded-xl bg-blue-600 shadow-lg font-black italic tracking-widest">👥 Karyawan</div>
          <Link href="/dashboard/transaksi"><div className="p-4 rounded-xl hover:bg-blue-800 transition-all">📝 Transaksi</div></Link>
          <Link href="/dashboard/pengeluaran"><div className="p-4 rounded-xl hover:bg-blue-800 transition-all">💸 Pengeluaran</div></Link>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-12 w-full">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 mt-14 md:mt-0">
            <div>
              <h1 className="text-3xl font-black italic uppercase text-slate-800 tracking-tighter">Personil Steam</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Database Tim Per Cabang</p>
            </div>
            <button onClick={() => { setFormData({ Id: null, Nama: "", Posisi: "Operator", NoTelp: "", branch_id: "" }); setShowModal(true); }} className="w-full md:w-auto bg-[#10b981] text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-lg hover:bg-emerald-600 transition-all">+ TAMBAH KARYAWAN</button>
          </div>

          {/* LOOPING GROUP CABANG */}
          {branches.map((branch) => {
            const timCabang = karyawan.filter(k => k.branch_id === branch.id);
            return (
              <div key={branch.id} className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-4">
                   <div className="h-px flex-1 bg-slate-200"></div>
                   <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] bg-blue-50 px-4 py-2 rounded-full border border-blue-100 italic">
                      📍 {branch.nama_cabang} ({timCabang.length})
                   </h2>
                   <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black border-b">
                          <th className="p-4 text-center w-16">ID</th>
                          <th className="p-4">Nama</th>
                          <th className="p-4">Posisi</th>
                          <th className="p-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="text-[12px] font-bold uppercase">
                        {timCabang.length > 0 ? timCabang.map((item) => (
                          <tr key={item.Id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                            <td className="p-4 text-center text-slate-300">#{item.Id}</td>
                            <td className="p-4 text-slate-900 font-black">{item.Nama}</td>
                            <td className="p-4">
                              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] italic border border-blue-100">{item.Posisi}</span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => { setFormData(item); setShowModal(true); }} className="bg-[#ffb703] text-white p-3 rounded-xl hover:scale-110 transition-all shadow-md">✏️</button>
                                <button onClick={() => setDeleteId(item.Id)} className="bg-[#ff4d4d] text-white p-3 rounded-xl hover:scale-110 transition-all shadow-md">🗑️</button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="4" className="p-6 text-center text-slate-300 text-[10px] italic uppercase tracking-widest">Belum ada personil di cabang ini</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 3. MODAL INPUT DATA (Style Emerald/Blue Fix) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-[#2b459a] p-5 text-white font-black italic flex justify-between items-center shadow-lg">
              <span className="text-xs uppercase tracking-widest">{formData.Id ? "⚡ Edit Data Personil" : "🚀 Personil Baru"}</span>
              <button onClick={() => setShowModal(false)} className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/40">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Nama Lengkap</label>
                <input required className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold uppercase outline-none focus:border-blue-500" value={formData.Nama} onChange={(e) => setFormData({ ...formData, Nama: e.target.value })} placeholder="MISAL: FADEL" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Posisi</label>
                  <select className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 cursor-pointer" value={formData.Posisi} onChange={(e) => setFormData({ ...formData, Posisi: e.target.value })}>
                    <option value="Operator">Operator</option>
                    <option value="Kasir">Kasir</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Penempatan</label>
                  <select required className="w-full bg-blue-50 border-2 border-blue-100 p-3 rounded-xl text-sm font-black outline-none focus:border-blue-500 cursor-pointer text-blue-600 uppercase" value={formData.branch_id || ""} onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}>
                    <option value="">Pilih Cabang</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>SB {b.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">No WhatsApp</label>
                <input required className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500" placeholder="08123xxx" value={formData.NoTelp} onChange={(e) => setFormData({ ...formData, NoTelp: e.target.value })} />
              </div>

              <button disabled={loading} className="w-full bg-[#10b981] text-white p-4 rounded-2xl font-black text-xs shadow-xl hover:bg-emerald-600 transition-all uppercase italic mt-4">
                {loading ? "Sabar Bro, Lagi Nyimpen..." : "Konfirmasi Data"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}