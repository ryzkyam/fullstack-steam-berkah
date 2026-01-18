"use client";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManajemenKaryawan() {
  const [karyawan, setKaryawan] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  // State Notifikasi & Konfirmasi Hapus
  const [notif, setNotif] = useState({ show: false, message: "", type: "success" });
  const [deleteId, setDeleteId] = useState(null); // ID yang mau dihapus

  const [formData, setFormData] = useState({ Id: null, Nama: "", Posisi: "Operator", NoTelp: "" });

  const showAlert = (message, type = "success") => {
    setNotif({ show: true, message, type });
    setTimeout(() => setNotif({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchKaryawan = async () => {
    const { data, error } = await supabase.from("Karyawans").select("*").order("Id", { ascending: true });
    if (!error) setKaryawan(data);
  };

  useEffect(() => { fetchKaryawan(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.Id) {
        await supabase.from("Karyawans").update({ Nama: formData.Nama, Posisi: formData.Posisi, NoTelp: formData.NoTelp }).eq("Id", formData.Id);
        showAlert("Data Personil Berhasil Diupdate! ✨");
      } else {
        await supabase.from("Karyawans").insert([{ Nama: formData.Nama, Posisi: formData.Posisi, NoTelp: formData.NoTelp }]);
        showAlert("Personil Baru Berhasil Ditambahkan! 🚀");
      }
      setShowModal(false);
      setFormData({ Id: null, Nama: "", Posisi: "Operator", NoTelp: "" });
      fetchKaryawan();
    } catch (err) {
      showAlert(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Hapus yang Baru (Pake Modal Custom)
  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("Karyawans").delete().eq("Id", deleteId);
    if (!error) {
      fetchKaryawan();
      showAlert("Data Personil Telah Dihapus", "success");
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
          <span className="text-lg font-black uppercase tracking-widest">{notif.message}</span>
        </div>
      )}

      {/* 2. CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-xs overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-4">
              <div className="text-5xl">⚠️</div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Yakin Ingin Menghapus?</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">Data yang sudah dihapus tidak bisa dikembalikan lagi bro.</p>
              <div className="flex flex-col gap-2 pt-4">
                <button 
                  onClick={confirmDelete}
                  className="w-full bg-[#ff4d4d] text-white p-4 rounded-2xl font-black text-xs shadow-lg hover:bg-red-600 transition-all uppercase"
                >
                  Ya, Hapus Sekarang
                </button>
                <button 
                  onClick={() => setDeleteId(null)}
                  className="w-full bg-slate-100 text-slate-400 p-4 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all uppercase"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR & MAIN CONTENT (Seperti sebelumnya) */}
      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden fixed top-4 left-4 z-[60] bg-[#2b459a] text-white p-3 rounded-xl shadow-lg">
        {isSidebarOpen ? "✕" : "☰"}
      </button>

      <aside className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-64 bg-[#2b459a] text-white p-6 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} flex flex-col`}>
        <h2 className="text-xl font-black mb-10 italic uppercase border-b border-blue-800 pb-4 mt-12 md:mt-0 text-center md:text-left">STEAM BERKAH 🚀</h2>
        <nav className="flex-1 space-y-2 text-xs font-bold uppercase">
          <Link href="/dashboard"><div className="p-4 rounded-xl hover:bg-blue-800">📊 Dashboard</div></Link>
          <div className="p-4 rounded-xl bg-blue-600 shadow-lg font-black tracking-widest italic">👥 Karyawan</div>
          <Link href="/dashboard/pengeluaran"><div className="p-4 rounded-xl hover:bg-blue-800">💸 Pengeluaran</div></Link>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-12 w-full">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 mt-14 md:mt-0">
            <div>
              <h1 className="text-3xl font-black italic uppercase text-slate-800 tracking-tighter">Personil Steam</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Database Tim Aktif</p>
            </div>
            <button onClick={() => { setFormData({ Id: null, Nama: "", Posisi: "Operator", NoTelp: "" }); setShowModal(true); }} className="w-full md:w-auto bg-[#10b981] text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-lg hover:bg-emerald-600">+ TAMBAH KARYAWAN</button>
          </div>

          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#10b981] p-4 text-white font-black text-[10px] uppercase italic tracking-widest">📋 List Karyawan</div>
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
                  {karyawan.map((item) => (
                    <tr key={item.Id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-center text-slate-300">#{item.Id}</td>
                      <td className="p-4 text-slate-900">{item.Nama}</td>
                      <td className="p-4">
                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] italic">{item.Posisi}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2 md:gap-3">
                          <button onClick={() => { setFormData(item); setShowModal(true); }} className="bg-[#ffb703] text-white p-3 md:px-4 md:py-2 rounded-xl flex items-center gap-2">
                            <span>✏️</span><span className="hidden md:inline text-[11px] font-black">Edit</span>
                          </button>
                          {/* Tombol Hapus ganti panggil setDeleteId */}
                          <button onClick={() => setDeleteId(item.Id)} className="bg-[#ff4d4d] text-white p-3 md:px-4 md:py-2 rounded-xl flex items-center gap-2">
                            <span>🗑️</span><span className="hidden md:inline text-[11px] font-black">Hapus</span>
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

      {/* 3. MODAL INPUT DATA (Sama seperti sebelumnya) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#2b459a] p-5 text-white font-black italic flex justify-between items-center">
              <span className="text-xs uppercase">{formData.Id ? "⚡ Edit Data" : "Personil Baru"}</span>
              <button onClick={() => setShowModal(false)} className="text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              <input required className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold uppercase outline-none focus:border-blue-500" value={formData.Nama} onChange={(e) => setFormData({ ...formData, Nama: e.target.value })} placeholder="NAMA LENGKAP" />
              <select className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500" value={formData.Posisi} onChange={(e) => setFormData({ ...formData, Posisi: e.target.value })}>
                <option value="Operator">Operator</option>
                <option value="Kasir">Kasir</option>
                <option value="Admin">Admin</option>
              </select>
              <input required className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500" placeholder="NO WHATSAPP" value={formData.NoTelp} onChange={(e) => setFormData({ ...formData, NoTelp: e.target.value })} />
              <button disabled={loading} className="w-full bg-[#10b981] text-white p-4 rounded-2xl font-black text-xs shadow-xl hover:bg-emerald-600 transition-all uppercase italic">
                {loading ? "Menyimpan..." : "Konfirmasi Data"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}