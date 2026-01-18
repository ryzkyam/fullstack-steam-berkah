"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function StokBarang() {
  const [barang, setBarang] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State Notif & Hapus
  const [notif, setNotif] = useState({ show: false, message: "", type: "success" });
  const [deleteId, setDeleteId] = useState(null);

  // Sesuaikan field dengan gambar ERD: Id, NamaBarang, JumlahStock, Kategori, Harga
  const [formData, setFormData] = useState({ 
    Id: null, NamaBarang: "", Kategori: "Bahan Kimia", Harga: 0, JumlahStock: 0 
  });

  const showAlert = (message, type = "success") => {
    setNotif({ show: true, message, type });
    setTimeout(() => setNotif({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchBarang = async () => {
    // Sesuai ERD: Tabel namanya Barangs
    const { data, error } = await supabase.from("Barangs").select("*").order("Id", { ascending: true });
    if (error) {
      console.error(error);
    } else {
      setBarang(data);
    }
  };

  useEffect(() => { fetchBarang(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        NamaBarang: formData.NamaBarang,
        Kategori: formData.Kategori,
        Harga: formData.Harga,
        JumlahStock: formData.JumlahStock
      };

      if (formData.Id) {
        await supabase.from("Barangs").update(payload).eq("Id", formData.Id);
        showAlert("Data Inventaris Diupdate! ✨");
      } else {
        await supabase.from("Barangs").insert([payload]);
        showAlert("Barang Baru Berhasil Ditambah! 🚀");
      }
      setShowModal(false);
      fetchBarang();
    } catch (err) {
      showAlert("Gagal simpan data", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("Barangs").delete().eq("Id", deleteId);
    if (!error) {
      fetchBarang();
      showAlert("Barang Telah Dihapus", "success");
    }
    setDeleteId(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 overflow-x-hidden relative">
      
      {/* 1. CUSTOM TOAST NOTIFICATION */}
      {notif.show && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${
          notif.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}>
          <span className="text-[10px] font-black uppercase tracking-widest">{notif.message}</span>
        </div>
      )}

      {/* 2. CUSTOM DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-xs overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-4">
              <div className="text-5xl">⚠️</div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Hapus Barang Ini?</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed px-4">Stok inventaris akan dihapus permanen bro.</p>
              <div className="flex flex-col gap-2 pt-4">
                <button onClick={confirmDelete} className="w-full bg-[#ff4d4d] text-white p-4 rounded-2xl font-black text-xs shadow-lg hover:bg-red-600 transition-all uppercase">Ya, Hapus Saja</button>
                <button onClick={() => setDeleteId(null)} className="w-full bg-slate-100 text-slate-400 p-4 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all uppercase">Batalkan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-64 bg-[#2b459a] text-white p-6 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} flex flex-col`}>
        <h2 className="text-xl font-black mb-10 italic uppercase border-b border-blue-800 pb-4 mt-12 md:mt-0">STEAM BERKAH 🚀</h2>
        <nav className="flex-1 space-y-2 text-xs font-bold uppercase">
          <Link href="/dashboard"><div className="p-4 rounded-xl hover:bg-blue-800 opacity-70">📊 Dashboard</div></Link>
          <div className="p-4 rounded-xl bg-blue-600 shadow-lg font-black italic">📦 Stok Barang</div>
          <Link href="/dashboard/pengeluaran"><div className="p-4 rounded-xl hover:bg-blue-800 opacity-70">💸 Pengeluaran</div></Link>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-12 w-full">
        <div className="max-w-5xl mx-auto pt-14 md:pt-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-black italic uppercase text-slate-800 tracking-tighter">📦 Stok Inventaris</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Kelola perlengkapan cuci motor</p>
            </div>
            <button onClick={() => { setFormData({ Id: null, NamaBarang: "", Kategori: "Bahan Kimia", Harga: 0, JumlahStock: 0 }); setShowModal(true); }} className="w-full md:w-auto bg-[#10b981] text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-lg hover:bg-emerald-600 transition-all">+ TAMBAH BARANG</button>
          </div>

          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#2b459a] p-4 text-white font-black text-[10px] uppercase italic tracking-widest">📋 Daftar Inventaris</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black border-b">
                    <th className="p-4 text-center w-16">ID</th>
                    <th className="p-4">Nama Barang</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Harga Pokok</th>
                    <th className="p-4 text-center">Stok</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-bold uppercase">
                  {barang.map((item) => (
                    <tr key={item.Id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-center text-slate-300">#{item.Id}</td>
                      <td className="p-4 text-slate-900 font-black tracking-tight">{item.NamaBarang}</td>
                      <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-[10px]">{item.Kategori}</span></td>
                      <td className="p-4">Rp {Number(item.Harga).toLocaleString('id-ID')}</td>
                      <td className={`p-4 text-center font-black ${item.JumlahStock < 5 ? 'text-red-600' : 'text-emerald-600'}`}>{item.JumlahStock}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          {/* Sesuai desain image_43e8bb.png */}
                          <button onClick={() => { setFormData(item); setShowModal(true); }} className="bg-[#ffb703] text-white p-3 rounded-xl active:scale-95 transition-all">✏️</button>
                          <button onClick={() => setDeleteId(item.Id)} className="bg-[#ff4d4d] text-white p-3 rounded-xl active:scale-95 transition-all">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* FORM MODAL STOK */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-[#10b981] p-5 text-white font-black italic flex justify-between items-center">
              <span className="text-xs uppercase">{formData.Id ? "⚡ Edit Barang" : "📦 Barang Baru"}</span>
              <button onClick={() => setShowModal(false)} className="text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nama Barang</label>
                <input required className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold uppercase outline-none focus:border-emerald-500" value={formData.NamaBarang} onChange={(e) => setFormData({...formData, NamaBarang: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Kategori</label>
                <select className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold outline-none focus:border-emerald-500" value={formData.Kategori} onChange={(e) => setFormData({...formData, Kategori: e.target.value})}>
                  <option value="Bahan Kimia">Bahan Kimia</option>
                  <option value="Peralatan">Peralatan</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Harga (Rp)</label>
                  <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold outline-none focus:border-emerald-500" value={formData.Harga} onChange={(e) => setFormData({...formData, Harga: e.target.value})} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Stok</label>
                  <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold outline-none focus:border-emerald-500" value={formData.JumlahStock} onChange={(e) => setFormData({...formData, JumlahStock: e.target.value})} />
                </div>
              </div>
              <button disabled={loading} className="w-full bg-[#10b981] text-white p-4 rounded-2xl font-black text-xs shadow-xl hover:bg-emerald-600 transition-all uppercase italic tracking-widest">
                {loading ? "Menyimpan..." : "Simpan Inventaris"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}