const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { createClient } = require("@supabase/supabase-js");
const ws = require("ws"); // <-- Ini penangkal error Node 20 lo

// ==========================================
// KREDENSIAL ASLI SUPABASE LO
// ==========================================
const SUPABASE_URL = "https://vmhuvevvnoaawaqlrlzd.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtaHV2ZXZ2bm9hYXdhcWxybHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTk1MTUsImV4cCI6MjA4NDE3NTUxNX0.vzSfGDIy2hQTZdR1MB2xRl9mCTSiyAuzQQJNANvREKo";
// ==========================================

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { 
    transport: ws // <-- Memaksa Supabase pakai package 'ws' lokal
  } 
});

function readCsv(fileName) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(path.resolve(__dirname, fileName))
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

async function runSeeder() {
  try {
    console.log("⏳ Membaca file CSV sintetis...");
    const dataTransaksi = await readCsv("transaksi_synthetic_data_v2.csv");
    const dataPengeluaran = await readCsv("pengeluaran_synthetic_data_v2.csv");

    console.log("🧹 Mengosongkan data lama di Supabase agar bersih...");
    await supabase.from("Transaksis").delete().neq("Id", 0);
    await supabase.from("PengeluaranHarians").delete().neq("Id", 0);

    console.log(`🚀 Memulai insert ${dataTransaksi.length} data Transaksi...`);
    
    const CHUNK_SIZE = 500;
    for (let i = 0; i < dataTransaksi.length; i += CHUNK_SIZE) {
      const chunk = dataTransaksi.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from("Transaksis").insert(chunk);
      if (error) throw error;
      console.log(`✅ Berhasil insert transaksi baris ke ${i} - ${i + chunk.length}`);
    }

    console.log(`🚀 Memulai insert ${dataPengeluaran.length} data Pengeluaran...`);
    for (let i = 0; i < dataPengeluaran.length; i += CHUNK_SIZE) {
      const chunk = dataPengeluaran.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from("PengeluaranHarians").insert(chunk);
      if (error) throw error;
      console.log(`✅ Berhasil insert pengeluaran baris ke ${i} - ${i + chunk.length}`);
    }

    console.log("🎉 SEEDING SELESAI! SEMUA DATA BERHASIL MASUK, BRO! 🚀");
  } catch (err) {
    console.error("❌ Waduh Gagal saat proses insert:", err.message);
  }
}

runSeeder();