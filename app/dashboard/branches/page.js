import { createClient } from "@supabase/supabase-js";
import { addBranch } from "./actions.js"; // Pakai ekstensi .js yang jelas
import { MapPin, Building2, Plus, Globe, Store } from "lucide-react";

export default async function BranchesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Ambil data cabang dari database
  const { data: branches } = await supabase
    .from("branches")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <Store className="text-blue-600 w-10 h-10" /> 
            List Cabang
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manajemen lokasi operasional Steam Berkah.</p>
        </div>

        {/* FORM INPUT COMPACT */}
        <div className="bg-white p-5 rounded-3xl shadow-xl shadow-blue-100/50 border border-blue-50 w-full md:w-auto">
          <form action={addBranch} className="flex flex-col sm:flex-row gap-4">
            <input 
              name="nama_cabang" 
              type="text"
              placeholder="Nama Cabang..." 
              className="border border-slate-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64 transition-all"
              required 
            />
            <input 
              name="kota" 
              type="text"
              placeholder="Kota..." 
              className="border border-slate-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-40 transition-all"
              required
            />
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-200"
            >
              <Plus size={20} strokeWidth={3} /> Tambah
            </button>
          </form>
        </div>
      </div>

      {/* GRID DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {branches && branches.length > 0 ? (
          branches.map((branch) => (
            <div 
              key={branch.id} 
              className="bg-white p-7 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden"
            >
              {/* Aksesoris Desain */}
              <div className="absolute -right-4 -top-4 text-slate-50 opacity-10 group-hover:text-blue-500 group-hover:opacity-20 transition-all duration-500">
                <Building2 size={120} />
              </div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
                  <Globe size={24} />
                </div>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                  Aktif
                </span>
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                  {branch.nama_cabang}
                </h3>
                
                <div className="flex items-center gap-2 text-slate-500 font-bold mb-4">
                  <MapPin size={16} className="text-red-500" />
                  <span className="text-sm tracking-tight">{branch.kota}</span>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center text-[11px] text-slate-400 font-bold uppercase tracking-tighter">
                  <span>ID: #{branch.id}</span>
                  <span>📅 {new Date(branch.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[50px] border-4 border-dashed border-slate-100">
            <Building2 className="text-slate-200 w-20 h-20 mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-black text-slate-400">Belum Ada Cabang</h3>
            <p className="text-slate-400 mt-2 font-medium italic">Klik tombol tambah untuk mendaftarkan cabang baru.</p>
          </div>
        )}
      </div>
    </div>
  );
}