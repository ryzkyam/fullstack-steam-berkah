"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StokBarang() {
  const [barang, setBarang] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  const [formData, setFormData] = useState({ id: null, nama_barang: "", kategori: "Bahan Kimia", harga_pokok: 0, stok: 0 });

  const fetchBarang = async () => {
    const { data } = await supabase.from("Stok").select("*").order("id", { ascending: true });
    if (data) setBarang(data);
  };

  useEffect(() => { fetchBarang(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (formData.id) {
      await supabase.from("Stok").update(formData).eq("id", formData.id);
    } else {
      await supabase.from("Stok").insert([formData]);
    }
    setLoading(false); setShowModal(false); fetchBarang();
  };

  return (
    <div className="flex min-h-screen bg-slate-100 relative">
      {/* SIDEBAR SOLID MENTOK BAWAH */}
      <aside className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#2b459a] text-white p-6 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} flex flex-col border-r border-blue-800`}>
        <h2 className="text-xl font-bold mb-10 border-b border-blue-800 pb-4 uppercase tracking-widest">STEAM BERKAH 🚀</h2>
        <nav className="flex-1 space-y-3 text-sm font-medium">
          <Link href="/dashboard"><div className="p-4 rounded-xl hover:bg-blue-800/50 opacity-80 cursor-pointer">📊 Dashboard</div></Link>
          <div className="p-4 rounded-xl bg-blue-600 shadow-lg cursor-pointer">📦 Stok Barang</div>
          <Link href="/dashboard/pengeluaran"><div className="p-4 rounded-xl hover:bg-blue-800/50 opacity-80 cursor-pointer">💸 Pengeluaran</div></Link>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-12 ml-0 md:ml-64 transition-all duration-300">
        <div className="max-w-5xl mx-auto">
          <Link href="/dashboard" className="text-[10px] font-bold text-slate-500 mb-4 inline-block uppercase tracking-widest">← Kembali ke Dashboard</Link>
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">📦 Manajemen Stok</h1>
              <p className="text-xs text-slate-500 mt-1">Kelola inventaris dan perlengkapan cuci motor.</p>
            </div>
            <button onClick={() => { setFormData({ id: null, nama_barang: "", kategori: "Bahan Kimia", harga_pokok: 0, stok: 0 }); setShowModal(true); }} className="bg-[#10b981] text-white px-5 py-2 rounded-full text-[11px] font-black shadow-md hover:bg-emerald-600">+ TAMBAH BARANG</button>
          </div>

          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#2b65d9] p-4 text-white font-bold text-xs uppercase tracking-widest">Daftar Stok Inventaris</div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#1e3a8a] text-white text-[10px] uppercase font-black">
                  <th className="p-4 text-center w-16">ID</th>
                  <th className="p-4">Nama Barang</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Harga Pokok</th>
                  <th className="p-4 text-center">Stok</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-bold text-slate-700 uppercase">
                {barang.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4 text-center text-slate-400 font-medium">{item.id}</td>
                    <td className="p-4 text-slate-900 font-black">{item.nama_barang}</td>
                    <td className="p-4 text-slate-500">{item.kategori}</td>
                    <td className="p-4">Rp {Number(item.harga_pokok).toLocaleString('id-ID')}</td>
                    <td className={`p-4 text-center font-black ${item.stok < 5 ? 'text-red-600' : ''}`}>{item.stok}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setFormData(item); setShowModal(true); }} className="bg-[#ffc107] text-white px-4 py-1 rounded-full text-[9px] font-black shadow-sm">EDIT</button>
                        <button onClick={async () => { if(confirm("Hapus?")) { await supabase.from("Stok").delete().eq("id", item.id); fetchBarang(); }}} className="bg-[#dc3545] text-white px-4 py-1 rounded-full text-[9px] font-black shadow-sm">HAPUS</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* FORM MODAL STOK */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-[#1e3a8a] p-5 text-white text-center">
              <h3 className="text-sm font-black tracking-widest uppercase">{formData.id ? "Edit Data Barang" : "Tambah Barang Baru"}</h3>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nama Barang</label>
                <input required className="w-full border-2 border-slate-100 p-3 rounded-xl text-sm font-bold" placeholder="Contoh: Sabun Colek" value={formData.nama_barang} onChange={(e) => setFormData({...formData, nama_barang: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Harga Pokok (Rp)</label>
                  <input type="number" className="w-full border-2 border-slate-100 p-3 rounded-xl text-sm font-bold" value={formData.harga_pokok} onChange={(e) => setFormData({...formData, harga_pokok: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Jumlah Stok</label>
                  <input type="number" className="w-full border-2 border-slate-100 p-3 rounded-xl text-sm font-bold" value={formData.stok} onChange={(e) => setFormData({...formData, stok: e.target.value})} />
                </div>
              </div>
              <button disabled={loading} className="w-full bg-[#10b981] text-white p-4 rounded-2xl shadow-lg font-black text-sm uppercase">{loading ? "Proses..." : "SIMPAN DATA"}</button>
              <button type="button" onClick={() => setShowModal(false)} className="w-full text-slate-400 text-[10px] font-black uppercase">Batal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}