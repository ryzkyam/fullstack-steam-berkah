'use server'

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Inisialisasi Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function addBranch(formData) {
  const nama_cabang = formData.get("nama_cabang");
  const alamat = formData.get("alamat") || "Alamat belum diisi";
  const kota = formData.get("kota");

  // Input data ke tabel branches yang kita buat tadi
  const { error } = await supabase
    .from("branches")
    .insert([{ 
      nama_cabang: nama_cabang, 
      alamat: alamat, 
      kota: kota 
    }]);

  if (error) {
    console.error("Gagal tambah cabang:", error.message);
    return { error: error.message };
  }

  // Refresh halaman supaya data baru langsung muncul
  revalidatePath("/dashboard/branches");
}