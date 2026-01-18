"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [transaksis, setTransaksis] = useState([]);
  const [karyawans, setKaryawans] = useState([]);
  const [motors, setMotors] = useState([]);
  const [loading, setLoading] = useState(true);

  // State bantuan untuk auto-fill harga
  const [selectedTarif, setSelectedTarif] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resT, resK, resM] = await Promise.all([
        supabase
          .from("Transaksis")
          .select("*")
          .order("Id", { ascending: false }),
        supabase.from("Karyawans").select("Id, Nama"),
        supabase.from("Motors").select("Id, Kategori, Tarif"), // Sesuai foto lo
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

  useEffect(() => {
    fetchData();
  }, []);

  // Fungsi auto-fill harga pas pilih motor
  const handleMotorChange = (e) => {
    const motorId = e.target.value;
    const motorTerpilih = motors.find((m) => m.Id == motorId);
    if (motorTerpilih) {
      setSelectedTarif(motorTerpilih.Tarif);
    } else {
      setSelectedTarif(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const mId = formData.get("motorId");
    const kId = formData.get("karyawanId");

    const newTransaksi = {
      Layanan: formData.get("layanan"),
      Total: parseInt(formData.get("total")),
      Tanggal: new Date().toISOString(),
      // Sesuaikan dengan skema foto lo (MotorId, KaryawanId, dll)
      MotorId: mId,
      KaryawanId: kId,
      MotorId1: mId, // Sisipan kolom EF Core
      KaryawanId1: kId, // Sisipan kolom EF Core
    };

    const { error } = await supabase.from("Transaksis").insert([newTransaksi]);

    if (error) {
      alert("Gagal simpan: " + error.message);
    } else {
      alert("Mantap! Transaksi Berhasil.");
      e.target.reset();
      setSelectedTarif(0);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 text-[#1e293b]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-blue-600 mb-8">
          STEAM BERKAH 🚀
        </h1>

        {/* --- FORM INPUT --- */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
          <h2 className="text-lg font-bold mb-4">Input Transaksi</h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-5 gap-4"
          >
            <input
              name="layanan"
              placeholder="Nama Layanan"
              className="border-2 p-3 rounded-xl outline-none focus:border-blue-500"
              required
            />

            {/* DROPDOWN MOTOR - Sekarang pake m.Kategori */}
            <select
              name="motorId"
              onChange={handleMotorChange}
              className="border-2 p-3 rounded-xl outline-none focus:border-blue-500"
              required
            >
              <option value="">-- Pilih Motor --</option>
              {motors.map((m) => (
                <option key={m.Id} value={m.Id}>
                  {m.Kategori}
                </option>
              ))}
            </select>

            {/* DROPDOWN KARYAWAN */}
            <select
              name="karyawanId"
              className="border-2 p-3 rounded-xl outline-none focus:border-blue-500"
              required
            >
              <option value="">-- Karyawan --</option>
              {karyawans.map((k) => (
                <option key={k.Id} value={k.Id}>
                  {k.Nama}
                </option>
              ))}
            </select>

            {/* INPUT HARGA - Pake value selectedTarif buat auto-fill */}
            <input
              name="total"
              type="number"
              value={selectedTarif || ""}
              onChange={(e) => setSelectedTarif(e.target.value)}
              placeholder="Harga (Rp)"
              className="border-2 p-3 rounded-xl outline-none focus:border-blue-500 font-bold text-blue-600"
              required
            />

            <button
              type="submit"
              className="bg-blue-600 text-white font-bold p-3 rounded-xl hover:bg-blue-800 transition-all"
            >
              Simpan
            </button>
          </form>
        </div>

        {/* --- DAFTAR TABEL --- */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-slate-500 text-sm">
              <tr>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Layanan</th>
                <th className="p-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transaksis.map((t) => (
                <tr key={t.Id} className="hover:bg-slate-50 transition-colors">
                  <td
                    className="p-4 text-sm text-slate-500"
                    suppressHydrationWarning
                  >
                    {new Date(t.Tanggal).toLocaleDateString("id-ID")}
                  </td>
                  <td className="p-4 font-bold">{t.Layanan}</td>
                  <td className="p-4 font-black text-blue-600 text-right">
                    Rp {t.Total?.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
