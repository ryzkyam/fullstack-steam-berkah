"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [transaksis, setTransaksis] = useState([]);
  const [karyawans, setKaryawans] = useState([]);
  const [motors, setMotors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTarif, setSelectedTarif] = useState(0);

  // State baru untuk kontrol Custom Alert
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resT, resK, resM] = await Promise.all([
        supabase.from("Transaksis").select("*").order("Id", { ascending: false }),
        supabase.from("Karyawans").select("Id, Nama"),
        supabase.from("Motors").select("Id, Kategori, Tarif"),
      ]);
      setTransaksis(resT.data || []);
      setKaryawans(resK.data || []);
      setMotors(resM.data || []);
    } catch (err) {
      console.error("Gagal tarik data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleMotorChange = (e) => {
    const motorId = e.target.value;
    const motorTerpilih = motors.find((m) => m.Id == motorId);
    setSelectedTarif(motorTerpilih ? motorTerpilih.Tarif : 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const mId = formData.get("motorId");
    const kId = formData.get("karyawanId");
    const layananNama = formData.get("layanan");

    const newTransaksi = {
      Layanan: layananNama,
      Total: parseInt(formData.get("total")),
      Tanggal: new Date().toISOString(),
      MotorId: mId,
      KaryawanId: kId,
      MotorId1: mId,
      KaryawanId1: kId,
    };

    const { error } = await supabase.from("Transaksis").insert([newTransaksi]);

    if (error) {
      setAlertMsg("❌ Gagal Simpan: " + error.message);
      setShowAlert(true);
    } else {
      // Pemicu Custom Alert Mantap
      setAlertMsg(`Layanan ${layananNama} berhasil disimpan.`);
      setShowAlert(true);
      
      e.target.reset();
      setSelectedTarif(0);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 text-[#1e293b] relative">
      
      {/* --- CUSTOM ALERT MODAL (INI BIAR GAK KAKU) --- */}
      {showAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-blue-100 text-center transform animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
              ✅
            </div>
            <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter mb-2">
              MANTAP GASKENN!
            </h3>
            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
              {alertMsg} <br/> Data sudah masuk ke laporan owner.
            </p>
            <button 
              onClick={() => setShowAlert(false)}
              className="w-full bg-blue-600 hover:bg-blue-800 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              OK, LANJUTKAN!
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-blue-600 mb-8 italic tracking-tighter flex items-center gap-3">
          STEAM BERKAH 🚀 
          <span className="bg-blue-100 text-blue-600 text-[10px] px-3 py-1 rounded-lg not-italic uppercase tracking-widest">Input Kasir</span>
        </h1>

        {/* --- FORM INPUT --- */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Layanan</label>
              <input name="layanan" placeholder="Cuci Body" className="border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold bg-slate-50/50" required />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Kategori</label>
              <select name="motorId" onChange={handleMotorChange} className="border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold bg-slate-50/50 cursor-pointer" required>
                <option value="">-- Pilih --</option>
                {motors.map((m) => ( <option key={m.Id} value={m.Id}>{m.Kategori}</option> ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Operator</label>
              <select name="karyawanId" className="border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold bg-slate-50/50 cursor-pointer" required>
                <option value="">-- Pilih --</option>
                {karyawans.map((k) => ( <option key={k.Id} value={k.Id}>{k.Nama}</option> ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Total Harga</label>
              <input name="total" type="number" value={selectedTarif || ""} onChange={(e) => setSelectedTarif(e.target.value)} className="border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-blue-500 font-black text-blue-600 bg-slate-50/50" required />
            </div>

            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white font-black p-4 rounded-2xl hover:bg-blue-800 transition-all shadow-lg shadow-blue-100 active:scale-95">
                GAS SIMPAN!
              </button>
            </div>
          </form>
        </div>

        {/* --- DAFTAR TABEL (Sync dengan Transaksis) --- */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/40">
          <div className="bg-slate-900 p-5 text-white font-black text-[10px] uppercase tracking-widest italic flex justify-between">
            <span>List Antrian Terkini</span>
            <span className="text-blue-400 animate-pulse">● Live Sync</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="p-6 text-center">Unit</th>
                  <th className="p-6">Tanggal</th>
                  <th className="p-6">Layanan</th>
                  <th className="p-6 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transaksis.map((t) => (
                  <tr key={t.Id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-6 text-center">
                       <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-xl font-black text-[10px]">#{t.Id}</span>
                    </td>
                    <td className="p-6 text-xs font-bold text-slate-400" suppressHydrationWarning>
                      {new Date(t.Tanggal).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="p-6 font-black italic text-slate-700 uppercase tracking-tighter">{t.Layanan}</td>
                    <td className="p-6 font-black text-blue-600 text-right text-base">
                      Rp {t.Total?.toLocaleString("id-ID")}
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