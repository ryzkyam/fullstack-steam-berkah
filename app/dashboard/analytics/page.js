"use client";
import { useState, useEffect } from "react";
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { BrainCircuit, TrendingUp, Users, Target, RefreshCw, AlertCircle, FileText, Bike, Sparkles } from "lucide-react";

export default function AnalyticsPage() {
  const [dataProphet, setDataProphet] = useState([]); 
  const [dataKmeans, setDataKmeans] = useState({ cluster_terbesar: "LOADING...", persentase: 0, detail: "" });
  // State produk didaftarkan dengan nilai awal LOADING... agar lolos pengecekan di baris bawah
  const [dataProduk, setDataProduk] = useState({ motor_terbanyak: "LOADING...", layanan_laris_lain: "LOADING..." });
  const [branchId, setBranchId] = useState(2); 
  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingKmeans, setLoadingKmeans] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, [branchId]);

  const fetchAllData = async () => {
    setLoadingChart(true);
    setLoadingKmeans(true);
    setError(null);

    // 1. Fetch Data Model Peramalan Omset (Prophet)
    try {
      const resProphet = await fetch(`http://127.0.0.1:8000/api/prediksi-omset?branch_id=${branchId}`);
      const resultProphet = await resProphet.json();
      if (resultProphet.error) {
        setError(resultProphet.error);
        setDataProphet([]);
      } else {
        setDataProphet(resultProphet);
      }
    } catch (err) {
      setError("Gagal menyambung ke Engine ML Python. Pastiin uvicorn running, bro!");
    } finally {
      setLoadingChart(false);
    }

    // 2. Fetch Data Klaster Segmentasi Pelanggan (K-Means)
    try {
      const resKmeans = await fetch(`http://127.0.0.1:8000/api/segmentasi-pelanggan?branch_id=${branchId}`);
      const resultKmeans = await resKmeans.json();
      if (!resultKmeans.status || resultKmeans.status !== "error") {
        setDataKmeans(resultKmeans);
      }
    } catch (err) {
      console.log("Gagal fetch data K-Means", err);
    } finally {
      setLoadingKmeans(false);
    }

    // 3. Fetch Data Mapping Karakteristik Produk & Kendaraan dari Database
    try {
      const resProduk = await fetch(`http://127.0.0.1:8000/api/analisis-produk?branch_id=${branchId}`);
      const resultProduk = await resProduk.json();
      setDataProduk(resultProduk);
    } catch (err) {
      console.log("Gagal fetch data Analisis Produk", err);
      setDataProduk({ motor_terbanyak: "ERROR DATA", layanan_laris_lain: "ERROR DATA" });
    }
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTanggalHuman = (dateStr) => {
    const opsi = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('id-ID', opsi);
  };

  const totalEstimasiOmset = dataProphet.reduce((sum, item) => sum + item.yhat, 0);

  // LOGIC ENGINE UNTUK REKOMENDASI BISNIS OTOMATIS (AI INSIGHT)
  const generateBusinessInsight = () => {
    if (dataProphet.length === 0 || dataProduk.motor_terbanyak === "LOADING...") {
      return "Menunggu kalkulasi data untuk menghasilkan rekomendasi...";
    }

    const hariTertinggi = [...dataProphet].sort((a, b) => b.yhat - a.yhat)[0];
    const motorDominan = dataProduk.motor_terbanyak || "SMALL";
    const layananAlternatif = dataProduk.layanan_laris_lain || "TIDAK ADA";

    let rekomendasi = "";

    if (branchId === 3) {
      rekomendasi += `Tren Cabang 3 terpantau stabil tinggi dengan estimasi puncak pada ${formatTanggalHuman(hariTertinggi.ds)} mencapai ${formatRupiah(hariTertinggi.yhat)}. `;
      rekomendasi += "Saran Operasional: Amankan ketersediaan bahan baku utama (sabun salju, semir ban) sebelum akhir pekan. Pastikan kehadiran penuh 4 karyawan cuci untuk memangkas durasi antrean pelanggan agar tidak terjadi bottleneck.";
    } else if (branchId === 2) {
      rekomendasi += `Karakteristik Cabang 2 menunjukkan fluktuasi ekstrem dengan potensi hari sepi di tengah pekan. Namun, lonjakan tinggi diprediksi terjadi pada ${formatTanggalHuman(hariTertinggi.ds)} (${formatRupiah(hariTertinggi.yhat)}). `;
      rekomendasi += "Saran Operasional: Terapkan strategi promosi diskon 10-20% pada hari kerja (weekday) yang diprediksi sepi untuk merangsang volume kendaraan, dan gunakan sistem shift commission berbasis bagi hasil 60/40 secara ketat guna menekan fixed cost operasional.";
    } else {
      rekomendasi += `Data gabungan unit memproyeksikan akumulasi omset sebesar ${formatRupiah(totalEstimasiOmset)} dalam 7 hari ke depan. `;
      rekomendasi += "Saran Strategis: Lakukan rotasi beban kerja antar cabang berdasarkan titik jenuh transaksi harian yang tertera pada grafik tren.";
    }

    // Suntikan analisis taktis live dari hasil database mapping data layanan & motor
    rekomendasi += ` Berdasarkan rekam data taktis cabang ini, tipe unit masuk sangat didominasi oleh motor kelas *${motorDominan}*. Selain varian cuci biasa, pelanggan terpantau sangat meminati penambahan treatment alternatif yaitu *${layananAlternatif}*. `;
    rekomendasi += `Disarankan bagi manajemen untuk memperketat pengecekan tools sediaan khusus yang mendukung layanan *${layananAlternatif}* menjelang hari sibuk transaksi.`;

    // Tambahan rekomendasi berbasis klaster K-Means
    if (dataKmeans.cluster_terbesar === "REGULAR CUSTOMER") {
      rekomendasi += " Dari sisi segmentasi, dominasi pelanggan masih bersifat umum (Regular). Direkomendasikan untuk mulai mengonversi mereka menjadi member tetap lewat program loyalty kartu cuci gratis setelah 8 kali kunjungan.";
    }

    return rekomendasi;
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-blue-600" size={32} />
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800">
            AI PROPHET ANALYTICS
          </h1>
        </div>

        {/* CONTROLLER */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase pl-2">Filter Unit:</span>
          <select
            value={branchId}
            onChange={(e) => setBranchId(Number(e.target.value))}
            className="text-sm font-bold bg-slate-100 text-slate-700 rounded-xl p-2 outline-none border-none cursor-pointer focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Cabang 1 (Utama)</option>
            <option value={2}>Cabang 2</option>
            <option value={3}>Cabang 3</option>
          </select>
          <button 
            onClick={fetchAllData}
            className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500"
          >
            <RefreshCw size={16} className={loadingChart || loadingKmeans || dataProduk.motor_terbanyak === "LOADING..." ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* METRICS GRID - 4 KOLOM MEWAH */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Estimasi Omset (Awan 7 Hari)</p>
          <h3 className="text-3xl font-black text-blue-600">
            {loadingChart ? "Loading..." : error ? "Rp 0" : formatRupiah(totalEstimasiOmset)}
          </h3>
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold mt-2">
            <TrendingUp size={14} /> Proyeksi Kumulatif Masa Depan
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200" title={dataKmeans.detail}>
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Segmentasi Terbesar</p>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            {loadingKmeans ? "MENGHITUNG..." : dataKmeans.cluster_terbesar}
          </h3>
          <div className="flex items-center gap-1 text-blue-500 text-xs font-bold mt-2">
            <Users size={14} /> {loadingKmeans ? "0" : dataKmeans.persentase}% Dari Dominasi Data Cabang
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Motor Terbanyak</p>
          <h3 className="text-2xl font-black text-purple-600 uppercase tracking-tight">
            {dataProduk.motor_terbanyak === "LOADING..." ? "MEMILAH..." : dataProduk.motor_terbanyak}
          </h3>
          <div className="flex items-center gap-1 text-purple-500 text-xs font-bold mt-2">
            <Bike size={14} /> Dominasi Volume Unit Cabang
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Layanan Non-Standar Terlaris</p>
          <h3 className="text-xl font-black text-emerald-600 uppercase tracking-tight truncate">
            {dataProduk.layanan_laris_lain === "LOADING..." ? "MENGHITUNG..." : dataProduk.layanan_laris_lain}
          </h3>
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold mt-2">
            <Sparkles size={14} /> Produk Paling Tinggi Diminati
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTENT AREA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start mb-10">
        
        {/* CHART CONTAINER */}
        <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 h-[510px]">
          <h2 className="text-xl font-bold mb-6 text-slate-800 italic uppercase">
            Forecasting Trend (7 Days Horizon Prediction)
          </h2>
          
          {loadingChart ? (
            <div className="h-[380px] flex flex-col items-center justify-center gap-3 text-slate-400 font-bold">
              <RefreshCw className="animate-spin text-blue-500" size={32} />
              <p>Mengekstraksi Tren Pola Dari Supabase Cloud...</p>
            </div>
          ) : error ? (
            <div className="h-[380px] flex flex-col items-center justify-center text-red-500 bg-red-50 rounded-2xl border border-red-100 p-6 text-center">
              <p className="font-bold text-lg mb-1">Penyebab Gagal Memuat Grafik:</p>
              <p className="text-sm max-w-md">{error}</p>
            </div>
          ) : (
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataProphet} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="ds" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatRupiah} />
                  <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value) => [formatRupiah(value)]} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: "15px" }} />
                  
                  <Line type="monotone" dataKey="yhat_upper" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Batas Atas (Maksimum)" />
                  <Line type="monotone" dataKey="yhat" stroke="#3b82f6" strokeWidth={4} activeDot={{ r: 8 }} name="Estimasi Utama Prophet" />
                  <Line type="monotone" dataKey="yhat_lower" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Batas Bawah (Minimum)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* TABEL DETAIL DATA */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 h-[510px] flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-slate-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800 italic uppercase">Data Angka Riil</h2>
          </div>
          
          <div className="overflow-y-auto flex-1 border border-slate-100 rounded-2xl bg-slate-50/50">
            {loadingChart ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">Memuat tabel...</div>
            ) : dataProphet.length === 0 ? (
              <div className="p-8 text-center text-xs text-red-400 font-bold">Tidak ada data angka.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-200 text-slate-700 font-bold sticky top-0">
                    <th className="p-3 rounded-tl-2xl">Tanggal</th>
                    <th className="p-3 text-right rounded-tr-2xl">Prediksi Utama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dataProphet.map((item, index) => (
                    <tr key={index} className="hover:bg-blue-50/50 text-slate-600 font-medium transition">
                      <td className="p-3">{formatTanggalHuman(item.ds)}</td>
                      <td className="p-3 text-right font-bold text-blue-600">{formatRupiah(item.yhat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* AI BUSINESS RECOMMENDATION BLOCK - AMAN TOTAL */}
      {!loadingChart && !loadingKmeans && dataProduk.motor_terbanyak !== "LOADING..." && dataProphet.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-[2rem] shadow-lg flex flex-col md:flex-row items-start gap-4 border border-blue-700">
          <div className="bg-white/20 p-3 rounded-2xl text-white shrink-0 shadow-inner">
            <AlertCircle size={28} />
          </div>
          <div>
            <h3 className="text-lg font-black italic tracking-wide uppercase mb-1">
              AI Decision Support System (Rekomendasi Bisnis)
            </h3>
            <p className="text-sm font-medium leading-relaxed opacity-95">
              {generateBusinessInsight()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}