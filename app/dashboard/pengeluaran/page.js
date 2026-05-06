"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  // Helper untuk nentuin nama tampilan
  const formatBranchName = (branchObj) => {
    if (!branchObj) return "STEAM BERKAH UTAMA";
    // Jika lo mau ID 1 tetap jadi Steam Berkah 2 sesuai DB, hapus logic IF di bawah.
    // Tapi kalo lo mau ID 1 dipaksa jadi "UTAMA", pake logic ini:
    if (branchObj.id === 1) return "STEAM BERKAH 2 (DEPOK)";
    return branchObj.nama_cabang?.toUpperCase() || "CABANG";
  };

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
          // Cari data cabang berdasarkan branch_id yang ada di baris pengeluaran
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
    if (!formData.branch_id) return showAlert("Pilih Cabang Dulu!", "error");

    setLoading(true);
    try {
      const payload = { 
        Tanggal: formData.Tanggal, 
        Keterangan: formData.Keterangan, 
        Jumlah: formData.Jumlah,
        branch_id: formData.branch_id 
      };

      if (formData.Id) {
        await supabase.from("PengeluaranHarians").update(payload).eq("Id", formData.Id);
        showAlert("Data Diupdate! ✨");
      } else {
        await supabase.from("PengeluaranHarians").insert([payload]);
        showAlert("Berhasil Dicatat! 🚀");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showAlert("Gagal simpan", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from("PengeluaranHarians").delete().eq("Id", deleteId);
    fetchData();
    showAlert("Data Dihapus", "success");
    setDeleteId(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-[#2b459a] text-white p-6 flex-col shadow-2xl">
        <h2 className="text-xl font-black mb-10 italic uppercase border-b border-blue-800 pb-4">STEAM BERKAH 🚀</h2>
        <nav className="flex-1 space-y-2 text-xs font-bold uppercase">
          <Link href="/dashboard"><div className={`p-4 rounded-xl ${pathname === '/dashboard' ? 'bg-blue-600' : 'opacity-70'}`}>📊 Dashboard</div></Link>
          <Link href="/dashboard/stock"><div className={`p-4 rounded-xl ${pathname === '/dashboard/stock' ? 'bg-blue-600' : 'opacity-70'}`}>📦 Stok Barang</div></Link>
          <Link href="/dashboard/pengeluaran"><div className={`p-4 rounded-xl ${pathname === '/dashboard/pengeluaran' ? 'bg-blue-600 font-black shadow-lg' : 'opacity-70'}`}>💸 Pengeluaran</div></Link>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-10 w-full">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-black italic uppercase text-slate-800 tracking-tighter">💸 Biaya Operasional</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Monitoring Pengeluaran & Lokasi</p>
            </div>
            <button onClick={() => { setFormData({ Id: null, Keterangan: "", Jumlah: 0, Tanggal: new Date().toISOString().split('T')[0], branch_id: "" }); setShowModal(true); }} className="bg-[#ef4444] text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-xl hover:bg-red-600 transition-all uppercase tracking-widest">+ INPUT BIAYA</button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#10b981] p-4 text-white font-black text-[10px] uppercase italic tracking-widest">📋 Riwayat Transaksi & Alamat Cabang</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black border-b">
                    <th className="p-5">Tanggal</th>
                    <th className="p-5">Nama Cabang</th>
                    <th className="p-5">Alamat / Kota</th>
                    <th className="p-5">Keterangan</th>
                    <th className="p-5 text-right">Nominal</th>
                    <th className="p-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-bold uppercase">
                  {data.length > 0 ? data.map((item) => (
                    <tr key={item.Id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-5 text-slate-400">{item.Tanggal?.split('T')[0]}</td>
                      <td className="p-5">
                        <span className={`px-2 py-1 rounded-md ${item.branch_id == 1 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                          {item.detail_cabang?.nama_cabang || "TANPA CABANG"}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="text-slate-900">{item.detail_cabang?.alamat || "-"}</div>
                        <div className="text-[9px] text-slate-400 italic">{item.detail_cabang?.kota || ""}</div>
                      </td>
                      <td className="p-5 text-slate-600">{item.Keterangan}</td>
                      <td className="p-5 text-right text-red-600 font-black text-sm italic">Rp {Number(item.Jumlah).toLocaleString('id-ID')}</td>
                      <td className="p-5 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => { setFormData({ Id: item.Id, Keterangan: item.Keterangan, Jumlah: item.Jumlah, Tanggal: item.Tanggal.split('T')[0], branch_id: item.branch_id }); setShowModal(true); }} className="hover:scale-125 transition-transform">✏️</button>
                          <button onClick={() => setDeleteId(item.Id)} className="hover:scale-125 transition-transform">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" className="p-20 text-center text-slate-300 font-black italic">DATA TIDAK DITEMUKAN...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL INPUT */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#ef4444] p-6 text-white font-black italic flex justify-between items-center">
              <span className="text-xs uppercase tracking-tighter">{formData.Id ? "⚡ EDIT DATA" : "🚀 INPUT DATA BARU"}</span>
              <button onClick={() => setShowModal(false)} className="text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Pilih Cabang</label>
                <select 
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold focus:border-red-500 outline-none transition-all"
                  value={formData.branch_id}
                  onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                >
                  <option value="">-- PILIH LOKASI --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama_cabang.toUpperCase()} ({b.kota})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Tanggal</label>
                <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold focus:border-red-500 outline-none" value={formData.Tanggal} onChange={(e) => setFormData({...formData, Tanggal: e.target.value})} />
              </div>
              
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Keterangan Biaya</label>
                <input required className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-red-500 uppercase" value={formData.Keterangan} onChange={(e) => setFormData({...formData, Keterangan: e.target.value})} />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nominal (Rp)</label>
                <input type="number" required className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-red-500" value={formData.Jumlah} onChange={(e) => setFormData({...formData, Jumlah: e.target.value})} />
              </div>

              <button disabled={loading} className="w-full bg-[#ef4444] text-white p-5 rounded-[1.5rem] font-black text-xs shadow-xl hover:bg-red-600 transition-all uppercase tracking-widest italic">
                {loading ? "MENYIMPAN..." : "SIMPAN PENGELUARAN"}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* NOTIFIKASI & DELETE MODAL (Gue ringkes buat space) */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] text-center max-w-xs w-full shadow-2xl">
             <div className="text-4xl mb-4">⚠️</div>
             <h3 className="font-black uppercase text-sm mb-6">Hapus permanen data ini?</h3>
             <div className="flex gap-3">
                <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-[10px] uppercase">YA, HAPUS</button>
                <button onClick={() => setDeleteId(null)} className="flex-1 bg-slate-100 text-slate-400 py-3 rounded-xl font-black text-[10px] uppercase">BATAL</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}