"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { BrainCircuit, TrendingUp, Users, Target } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    // DISINI LOGIC NYA:
    // 1. Tarik data histori dari Supabase
    // 2. Idealnya lo kirim ke API Python Prophet
    // 3. Tapi buat sekarang, kita simulasiin dulu datanya biar UI lo JALAN.
    
    const mockData = [
      { date: "2024-01", actual: 4000, forecast: 4000 },
      { date: "2024-02", actual: 3000, forecast: 3200 },
      { date: "2024-03", actual: 5000, forecast: 4800 },
      { date: "2024-04", actual: 4500, forecast: 4600 },
      { date: "2024-05", actual: null, forecast: 5200 }, // Prediksi Bulan Depan
      { date: "2024-06", actual: null, forecast: 5800 }, // Prediksi 2 Bulan Depan
    ];
    
    setData(mockData);
    setLoading(false);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <BrainCircuit className="text-blue-600" size={32} />
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800">
          AI PROPHET ANALYTICS
        </h1>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Estimasi Omset Juni</p>
          <h3 className="text-3xl font-black text-blue-600">Rp 5.800.000</h3>
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold mt-2">
            <TrendingUp size={14} /> +15.4% Dari Bulan Lalu
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Segmentasi Terbesar</p>
          <h3 className="text-3xl font-black text-slate-800">LOYAL CUSTOMER</h3>
          <div className="flex items-center gap-1 text-blue-500 text-xs font-bold mt-2">
            <Users size={14} /> 45% Dari Total Transaksi
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Akurasi Model AI</p>
          <h3 className="text-3xl font-black text-orange-500">92.4%</h3>
          <div className="flex items-center gap-1 text-slate-400 text-xs font-bold mt-2">
            <Target size={14} /> Berdasarkan Data 6 Bulan Terakhir
          </div>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 mb-10">
        <h2 className="text-xl font-bold mb-6 text-slate-800 italic uppercase">Forecasting Trend (Actual vs AI Prediction)</h2>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" name="Data Aktual" />
              <Area type="monotone" dataKey="forecast" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="transparent" name="AI Forecast" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
