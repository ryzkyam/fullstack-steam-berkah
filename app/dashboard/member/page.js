"use client";
import { supabase } from "@/lib/supabase";
import { UserPlus, Trash2, Search, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function MemberPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [nama, setNama] = useState("");
  const [noTelp, setNoTelp] = useState(""); // SESUAIKAN DENGAN DB
  const [platNomor, setPlatNomor] = useState(""); // TAMBAHAN KOLOM PLAT
  
  const [showAlert, setShowAlert] = useState(false);

  // --- 1. DEKLARASIKAN FUNGSI DULU (Biar gak error hoisting) ---
  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .neq("id", 1) 
      .order("nama", { ascending: true });
    
    if (!error) setMembers(data);
    setLoading(false);
  };

  // --- 2. BARU PANGGIL DI USEEFFECT ---
  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama || !noTelp) return;

    // SESUAIKAN NAMA KOLOM DENGAN GAMBAR (no_telp & plat_nomor)
    const { error } = await supabase
      .from("customers")
      .insert([{ 
        nama: nama.toUpperCase(), 
        no_telp: noTelp, 
        plat_nomor: platNomor.toUpperCase() 
      }]);

    if (error) {
      alert("Gagal: " + error.message);
    } else {
      setNama("");
      setNoTelp("");
      setPlatNomor("");
      setShowAlert(true);
      fetchMembers();
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  const deleteMember = async (id) => {
    if (confirm("Yakin mau hapus member ini bro?")) {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (!error) fetchMembers();
    }
  };

  const filteredMembers = members.filter(m => 
    m.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.no_telp && m.no_telp.includes(searchTerm))
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Alert Sukses */}
      {showAlert && (
        <div className="fixed top-5 right-5 bg-green-500 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] animate-bounce">
          <CheckCircle2 size={20} />
          <span className="font-bold uppercase italic text-xs">Member Berhasil Terdaftar!</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter">DATABASE MEMBER 💎</h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Registrasi & Kelola Pelanggan Tetap</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM DAFTAR */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 h-fit">
          <h3 className="text-sm font-black uppercase italic mb-6 text-blue-600">Daftar Member Baru</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Nama Lengkap</label>
              <input 
                type="text" 
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="CONTOH: REZA RIZKI"
                className="w-full border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold bg-slate-50/50 text-xs uppercase"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">No. Telepon / WA</label>
              <input 
                type="text" 
                value={noTelp}
                onChange={(e) => setNoTelp(e.target.value)}
                placeholder="0895xxxx"
                className="w-full border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold bg-slate-50/50 text-xs"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Plat Nomor (Opsional)</label>
              <input 
                type="text" 
                value={platNomor}
                onChange={(e) => setPlatNomor(e.target.value)}
                placeholder="B 1234 ABC"
                className="w-full border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold bg-slate-50/50 text-xs uppercase"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-black p-4 rounded-2xl hover:bg-blue-800 transition-all shadow-lg flex items-center justify-center gap-2 text-xs italic uppercase">
              <UserPlus size={16} /> REGISTRASI MEMBER
            </button>
          </form>
        </div>

        {/* LIST MEMBER */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="CARI NAMA ATAU NO WA..."
              className="w-full bg-white border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-blue-500 font-bold text-xs shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white text-[10px] font-black uppercase italic">
                <tr>
                  <th className="p-5">Nama Member</th>
                  <th className="p-5">No. Telepon</th>
                  <th className="p-5">Plat Nomor</th>
                  <th className="p-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="4" className="p-10 text-center text-xs font-bold animate-pulse text-slate-400">LOADING DATA...</td></tr>
                ) : filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-blue-50/30 transition-all">
                    <td className="p-5 font-black text-xs italic text-slate-700">{m.nama}</td>
                    <td className="p-5 font-bold text-xs text-slate-500">{m.no_telp || '-'}</td>
                    <td className="p-5 font-bold text-xs text-blue-600">{m.plat_nomor || '-'}</td>
                    <td className="p-5 text-center">
                      <button 
                        onClick={() => deleteMember(m.id)}
                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}