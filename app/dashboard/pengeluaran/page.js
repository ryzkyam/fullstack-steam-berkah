"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Pengeluaran() {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State Notif & Konfirmasi Hapus
  const [notif, setNotif] = useState({ show: false, message: "", type: "success" });
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({ 
    Id: null, Keterangan: "", Jumlah: 0, Tanggal: new Date().toISOString().split('T')[0] 
  });

  const showAlert = (message, type = "success") => {
    setNotif({ show: true, message, type });
    setTimeout(() => setNotif({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchPengeluaran = async () => {
    const { data: res } = await supabase
      .from("PengeluaranHarians")
      .select("*")
      .order("Tanggal", { ascending: false });
    if (res) setData(res);
  };

  useEffect(() => { fetchPengeluaran(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.Id) {
        const { error } = await supabase.from("PengeluaranHarians")
          .update({ Tanggal: formData.Tanggal, Keterangan: formData.Keterangan, Jumlah: formData.Jumlah })
          .eq("Id", formData.Id);
        if (error) throw error;
        showAlert("Data Pengeluaran Diupdate! ✨");
      } else {
        const { error } = await supabase.from("PengeluaranHarians")
          .insert([{ Tanggal: formData.Tanggal, Keterangan: formData.Keterangan, Jumlah: formData.Jumlah }]);
        if (error) throw error;
        showAlert("Biaya Berhasil Dicatat! 🚀");
      }
      setShowModal(false);
      fetchPengeluaran();
    } catch (err) {
      showAlert("Gagal simpan data", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("PengeluaranHarians").delete().eq("Id", deleteId);
    if (!error) {
      fetchPengeluaran();
      showAlert("Catatan Biaya Dihapus", "success");
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
          <span className="text-xs font-black uppercase tracking-widest">{notif.message}</span>
        </div>
      )}

      {/* 2. CUSTOM DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-xs overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-4">
              <div className="text-5xl">⚠️</div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Hapus Catatan Ini?</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed px-4">Data pengeluaran akan hilang permanen dari database bro.</p>
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
        <h2 className="text-xl font-black mb-10 italic uppercase border-b border-blue-800 pb-4 mt-12 md:mt-0 text-center md:text-left">STEAM BERKAH 🚀</h2>
        <nav className="flex-1 space-y-2 text-xs font-bold uppercase">
          <Link href="/dashboard"><div className="p-4 rounded-xl hover:bg-blue-800">📊 Dashboard</div></Link>
          <Link href="/dashboard/karyawan"><div className="p-4 rounded-xl hover:bg-blue-800">👥 Karyawan</div></Link>
          <div className="p-4 rounded-xl bg-red-500 shadow-lg font-black tracking-widest italic">💸 Pengeluaran</div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-12 w-full">
        <div className="max-w-5xl mx-auto pt-14 md:pt-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-black italic uppercase text-slate-800 tracking-tighter">💸 Biaya Operasional</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Database Pengeluaran Harian</p>
            </div>
            <button onClick={() => { setFormData({ Id: null, Keterangan: "", Jumlah: 0, Tanggal: new Date().toISOString().split('T')[0] }); setShowModal(true); }} className="w-full md:w-auto bg-[#ef4444] text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-lg hover:bg-red-600 transition-all">+ CATAT PENGELUARAN</button>
          </div>

          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#10b981] p-4 text-white font-black text-[10px] uppercase italic tracking-widest">📅 Riwayat Biaya</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black border-b">
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Keterangan</th>
                    <th className="p-4 text-right">Nominal</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-bold uppercase">
                  {data.map((item) => (
                    <tr key={item.Id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 text-slate-400 font-medium tracking-tighter">{item.Tanggal.split('T')[0]}</td>
                      <td className="p-4 text-slate-900">{item.Keterangan}</td>
                      <td className="p-4 text-right text-red-600 font-black italic">Rp {Number(item.Jumlah).toLocaleString('id-ID')}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2 md:gap-3">
                          <button onClick={() => { setFormData({ Id: item.Id, Keterangan: item.Keterangan, Jumlah: item.Jumlah, Tanggal: item.Tanggal.split('T')[0] }); setShowModal(true); }} className="bg-[#ffb703] text-white p-3 md:px-4 md:py-2 rounded-xl active:scale-95 transition-all">
                            <span>✏️</span><span className="hidden md:inline text-[11px] font-black ml-1">Edit</span>
                          </button>
                          <button onClick={() => setDeleteId(item.Id)} className="bg-[#ff4d4d] text-white p-3 md:px-4 md:py-2 rounded-xl active:scale-95 transition-all">
                            <span>🗑️</span><span className="hidden md:inline text-[11px] font-black ml-1">Hapus</span>
                          </button>
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

      {/* 3. MODAL INPUT (Responsive Bottom di Mobile) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#ef4444] p-5 text-white font-black italic flex justify-between items-center">
              <span className="text-xs uppercase">{formData.Id ? "⚡ Edit Biaya" : "🚀 Input Biaya"}</span>
              <button onClick={() => setShowModal(false)} className="text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4 mb-6 md:mb-0">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Tanggal</label>
                <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold focus:border-red-500 outline-none" value={formData.Tanggal} onChange={(e) => setFormData({...formData, Tanggal: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Keterangan</label>
                <input required placeholder="CONTOH: BELI SABUN" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold outline-none focus:border-red-500 uppercase" value={formData.Keterangan} onChange={(e) => setFormData({...formData, Keterangan: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nominal (Rp)</label>
                <input type="number" required placeholder="0" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold outline-none focus:border-red-500" value={formData.Jumlah} onChange={(e) => setFormData({...formData, Jumlah: e.target.value})} />
              </div>
              <button disabled={loading} className="w-full bg-[#ef4444] text-white p-4 rounded-2xl font-black text-xs shadow-xl hover:bg-red-600 transition-all uppercase italic tracking-widest">
                {loading ? "Menyimpan..." : "Simpan Pengeluaran"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}