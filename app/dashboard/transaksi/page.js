"use client";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// --- KONFIGURASI MENU LAYANAN ---
const LAYANAN_OPTIONS = [
  { nama: "CUCI STANDARD", extra: 0 },
  { nama: "CUCI STANDARD + WAX", extra: 5000 },
  { nama: "CUCI DETAILING", extra: 15000 },
  { nama: "CUCI MESIN", extra: 10000 },
];

export default function TransaksiPage() {
  const [transaksis, setTransaksis] = useState([]);
  const [karyawans, setKaryawans] = useState([]);
  const [filteredKaryawans, setFilteredKaryawans] = useState([]);
  const [motors, setMotors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]); // STATE MEMBER SUDAH DITAMBAHKAN
  const [loading, setLoading] = useState(true);

  // --- STATE KONTROL FORM ---
  const [selectedMotorId, setSelectedMotorId] = useState("");
  const [selectedLayanan, setSelectedLayanan] = useState("");
  const [selectedTarif, setSelectedTarif] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState("");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const pathname = usePathname();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resT, resK, resM, resB, resC] = await Promise.all([
        // JOIN DENGAN TABEL CUSTOMERS UNTUK AMBIL NAMA
        supabase
          .from("Transaksis")
          .select(
            `
            *,
            customers (
              nama
            )
          `,
          )
          .order("Id", { ascending: false })
          .limit(20),
        supabase.from("Karyawans").select("Id, Nama, branch_id"),
        supabase.from("Motors").select("Id, Kategori, Tarif"),
        supabase.from("branches").select("id, nama_cabang"),
        supabase.from("customers").select("id, nama"),
      ]);

      setTransaksis(resT.data || []);
      setKaryawans(resK.data || []);
      setMotors(resM.data || []);
      setBranches(resB.data || []);
      setCustomers(resC.data || []);
    } catch (err) {
      console.error("Gagal tarik data:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGIC FILTER CABANG ---
  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    setSelectedBranch(branchId);
    if (!branchId) {
      setFilteredKaryawans([]);
    } else {
      const filtered = karyawans.filter(
        (k) => String(k.branch_id) === String(branchId),
      );
      setFilteredKaryawans(filtered);
    }
  };

  // --- LOGIC HITUNG HARGA OTOMATIS ---
  const hitungTotalHarga = (motorId, namaLayanan) => {
    const motor = motors.find((m) => String(m.Id) === String(motorId));
    const layanan = LAYANAN_OPTIONS.find((l) => l.nama === namaLayanan);

    if (motor && layanan) {
      setSelectedTarif(motor.Tarif + layanan.extra);
    } else if (motor) {
      setSelectedTarif(motor.Tarif);
    } else {
      setSelectedTarif(0);
    }
  };

  const handleMotorChange = (e) => {
    const mId = e.target.value;
    setSelectedMotorId(mId);
    hitungTotalHarga(mId, selectedLayanan);
  };

  const handleLayananChange = (e) => {
    const lNama = e.target.value;
    setSelectedLayanan(lNama);
    hitungTotalHarga(selectedMotorId, lNama);
  };

  // --- SUBMIT DATA ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (!selectedLayanan || !selectedMotorId || !selectedBranch) {
      setAlertMsg("❌ Lengkapi dulu datanya bro!");
      setShowAlert(true);
      return;
    }

    const newTransaksi = {
      Layanan: selectedLayanan,
      Total: parseInt(selectedTarif),
      Tanggal: new Date().toISOString(),
      MotorId: parseInt(selectedMotorId),
      KaryawanId: parseInt(formData.get("karyawanId")),
      branch_id: parseInt(selectedBranch),
      customer_id: parseInt(formData.get("customerId")), // Ambil dari dropdown member
    };

    const { error } = await supabase.from("Transaksis").insert([newTransaksi]);

    if (error) {
      setAlertMsg("❌ Gagal Simpan: " + error.message);
      setShowAlert(true);
    } else {
      setAlertMsg(`Layanan ${selectedLayanan} Berhasil Disimpan! 🚀`);
      setShowAlert(true);

      // Reset State & Form
      e.target.reset();
      setSelectedLayanan("");
      setSelectedMotorId("");
      setSelectedTarif(0);
      setSelectedBranch("");
      setFilteredKaryawans([]);
      fetchData();
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 relative">
      {/* --- ALERT MODAL --- */}
      {showAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 italic uppercase mb-2">
              MANTAP!
            </h3>
            <p className="text-slate-500 font-bold text-sm mb-8">{alertMsg}</p>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase italic"
            >
              OK, LANJUT!
            </button>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-[60] w-64 h-screen bg-[#2b459a] text-white p-4 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} shadow-2xl border-r border-blue-800 flex flex-col`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold italic uppercase tracking-tighter">
            STEAM BERKAH 🚀
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>
        <nav className="space-y-2 text-xs font-bold uppercase tracking-wider opacity-90">
          <Link href="/dashboard">
            <div
              className={`p-4 rounded-xl ${pathname === "/dashboard" ? "bg-blue-600" : "hover:bg-blue-800"}`}
            >
              📊 Dashboard
            </div>
          </Link>
          <Link href="/dashboard/transaksi">
            <div
              className={`p-4 rounded-xl ${pathname === "/dashboard/transaksi" ? "bg-blue-600 shadow-lg" : "hover:bg-blue-800"}`}
            >
              📝 Transaksi
            </div>
          </Link>
          <Link href="/dashboard/laporan-harian">
            <div className="p-4 rounded-xl hover:bg-blue-800">
              📅 Laporan Harian
            </div>
          </Link>
          <Link href="/dashboard/jasa-operator">
            <div className="p-4 rounded-xl hover:bg-blue-800">
              💰 Gaji Operator
            </div>
          </Link>
          <Link href="/dashboard/member">
            <div
              className={`p-4 rounded-xl ${pathname === "/dashboard/member" ? "bg-blue-600 shadow-lg" : "hover:bg-blue-800"}`}
            >
              💎 Data Member
            </div>
          </Link>
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-4 md:p-8 w-full transition-all">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden mb-4 bg-[#2b459a] text-white p-3 rounded-xl shadow-lg"
        >
          <Menu size={20} />
        </button>

        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter">
              KASIR STEAM BERKAH 🚀
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              Input Transaksi Unit
            </p>
          </div>

          {/* --- FORM INPUT --- */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 mb-8">
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4"
            >
              {/* Cabang */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase ml-2 text-blue-500 italic">
                  Lokasi Cabang
                </label>
                <select
                  name="branchId"
                  value={selectedBranch}
                  onChange={handleBranchChange}
                  className="border-2 border-blue-50 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold bg-blue-50/30 text-[10px]"
                  required
                >
                  <option value="">-- CABANG --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama_cabang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori Motor */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase ml-2 text-slate-400">
                  Kategori
                </label>
                <select
                  name="motorId"
                  value={selectedMotorId}
                  onChange={handleMotorChange}
                  className="border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold bg-slate-50/50 text-[10px]"
                  required
                >
                  <option value="">-- MOTOR --</option>
                  {motors.map((m) => (
                    <option key={m.Id} value={m.Id}>
                      {m.Kategori}
                    </option>
                  ))}
                </select>
              </div>

              {/* Layanan */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase ml-2 text-slate-400">
                  Layanan
                </label>
                <select
                  name="layanan"
                  value={selectedLayanan}
                  onChange={handleLayananChange}
                  className="border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold bg-slate-50/50 text-[10px] uppercase"
                  required
                >
                  <option value="">-- LAYANAN --</option>
                  {LAYANAN_OPTIONS.map((opt) => (
                    <option key={opt.nama} value={opt.nama}>
                      {opt.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase ml-2 text-slate-400">
                  Operator
                </label>
                <select
                  name="karyawanId"
                  className="border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold bg-slate-50/50 text-[10px] disabled:opacity-50"
                  required
                  disabled={!selectedBranch}
                >
                  <option value="">-- OPERATOR --</option>
                  {filteredKaryawans.map((k) => (
                    <option key={k.Id} value={k.Id}>
                      {k.Nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Member / Langganan */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase ml-2 text-slate-400">
                  Pelanggan
                </label>
                <select
                  name="customerId"
                  className="border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold bg-slate-50/50 text-[10px]"
                  required
                >
                  <option value="1">-- UMUM --</option>
                  {customers.map(
                    (c) =>
                      c.id !== 1 && (
                        <option key={c.id} value={c.id}>
                          {c.nama.toUpperCase()}
                        </option>
                      ),
                  )}
                </select>
              </div>

              {/* Total Harga */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase ml-2 text-slate-400">
                  Total Harga
                </label>
                <input
                  name="total"
                  type="number"
                  value={selectedTarif}
                  readOnly
                  className="border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-blue-500 font-black text-blue-600 bg-slate-50/50 text-sm"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-black p-4 rounded-2xl hover:bg-blue-800 transition-all shadow-lg active:scale-95 text-xs italic uppercase"
                >
                  GAS!
                </button>
              </div>
            </form>
          </div>

          {/* --- TABEL LOG --- */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl">
            <div className="bg-slate-900 p-5 text-white font-black text-[10px] uppercase italic flex justify-between">
              <span>Riwayat Transaksi Terakhir</span>
              <span className="text-blue-400">LIVE SYNC</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="p-6">Waktu</th>
                    <th className="p-6">Pelanggan</th> {/* TAMBAH KOLOM INI */}
                    <th className="p-6">Layanan</th>
                    <th className="p-6 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-bold uppercase">
                  {transaksis.map((t) => (
                    <tr key={t.Id} className="hover:bg-blue-50/30">
                      <td className="p-6 text-slate-400">
                        {new Date(t.Tanggal).toLocaleTimeString("id-ID")}
                      </td>

                      {/* LOGIKA MENAMPILKAN NAMA MEMBER */}
                      <td className="p-6 font-black italic">
                        {t.customer_id === 1 ? (
                          <span className="text-slate-400">UMUM</span>
                        ) : (
                          <span className="text-blue-600">
                            💎 {t.customers?.nama}
                          </span>
                        )}
                      </td>

                      <td className="p-6 font-black italic">{t.Layanan}</td>
                      <td className="p-6 font-black text-blue-600 text-right">
                        Rp {t.Total?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
