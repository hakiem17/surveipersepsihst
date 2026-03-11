<div align="center">
  <h1>📊 Survei Persepsi Publik Kab. HST</h1>
  <p>Platform resmi survei persepsi dan kepuasan masyarakat terhadap kinerja Pemerintah Kabupaten Hulu Sungai Tengah.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  </p>
</div>

## 📌 Tentang Proyek

Aplikasi **Survei Persepsi Publik Kabupaten Hulu Sungai Tengah (HST)** adalah platform digital yang dirancang untuk mengukur tingkat kepuasan dan persepsi masyarakat terhadap pelayanan dan kinerja pemerintah daerah. Aplikasi ini dibangun dengan tujuan mempermudah proses pengumpulan data dari masyarakat secara transparan, mudah digunakan di perangkat genggam (mobile-friendly), dan *real-time*.

## ✨ Fitur Utama

### 🧑‍💻 Halaman Publik (Warga)
- **Landing Page Interaktif:** Menampilkan informasi kriteria responden dan informasi survei.
- **Validasi Calon Responden (Gatekeeper):** Filter awal untuk memastikan responden memenuhi kriteria (Bukan ASN, ber-KTP HST, usia minimal 17 tahun).
- **Formulir Data Demografi:** Pengumpulan data dasar responden (Usia, Pendidikan, Pekerjaan, Wilayah/Desa).
- **Kuesioner Dinamis:** Sistem pertanyaan kuesioner berskala likert (1-5) dengan kolom isian saran kendala.
- **Sistem *Light/Dark Mode*:** Tampilan otomatis/manual menyesuaikan preferensi pengguna (didukung penuh di mode terang dan gelap).

### 🛡️ Dasbor Administrasi (Admin)
- **Ikhtisar Sistem (Dashboard):** Rekapitulasi jumlah responden, survei masuk, rata-rata makro, dan pertanyaan aktif.
- **Manajemen Data Responden:** Tabel daftar responden yang dapat difilter, koreksi demografi tipe data yang salah, melihat rincian jawaban (modal kuesioner), dan melakukan *invalidation* (menganulir) data *spam* / duplikat yang berlebihan.
- **Laporan Analitik:** Grafik bar *real-time* perbandingan Indeks Kepuasan per Kategori Urusan dan pemetaan sebaran demografi responden.
- **Master Data Survei:** Fitur untuk mengelola pertanyaan survei (Tambah, Edit, Hapus, Nonaktifkan) serta mengelola Urusan Pemerintahan.
- **Master Wilayah:** CRUD untuk menyesuaikan relasi hierarki Kecamatan dan Desa di lingkungan Kabupaten HST.
- **Pengaturan Sistem Global:** *Toggle* untuk membuka/menutup layanan pengisian survei di sisi publik beserta pengaturan pesan penutupan (*Closing Notice*) dan sistem tahun.

## 🛠️ Stack Teknologi

Proyek ini dibangun menggunakan teknologi web terdepan:

- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Bahasa Pemrograman:** [TypeScript](https://www.typescriptlang.org/)
- **Penataan Gaya (Styling):** [Tailwind CSS v4](https://tailwindcss.com/)
- **Ikon UI:** [Lucide React](https://lucide.dev/)
- **Animasi:** [Framer Motion](https://www.framer.com/motion/)
- **Basis Data & Autentikasi:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Grafik/Visualisasi Data:** [Recharts](https://recharts.org/)

## 📂 Struktur Folder Utama

```text
surveypersepsi/
├── src/
│   ├── app/                 # Next.js App Router (Halaman dan API)
│   │   ├── (public)/        # Halaman muka (Landing Page, Form Survei)
│   │   ├── admin/           # Laman Dasbor Administrasi
│   │   ├── api/             # Backend API Routes
│   │   └── login/           # Halaman Login Admin
│   ├── components/          # Komponen UI Reusable (Header, Sidebar, Tabel, dll)
│   └── lib/                 # Konfigurasi utility (contoh: Akses Supabase Client)
├── public/                  # Aset publik statis (Gambar, Favicon)
└── *.sql                    # Berkas skema tabel / database policies
```

## 🚀 Panduan Setup (Development)

Untuk mengkloning dan menjalankan proyek ini secara lokal, ikuti langkah-langkah berikut:

**1. Klon Repositori**
```bash
git clone https://github.com/hakiem17/surveipersepsihst.git
cd surveypersepsihst
```

**2. Instal Dependensi**
Disarankan menggunakan `npm`:
```bash
npm install
```

**3. Konfigurasi Environment Variables**
Buat file bernama `.env.local` di *root* direktori proyek dan masukkan variabel kredensial Supabase Anda yang berisi konfigurasi tabel-tabel project ini:
```env
NEXT_PUBLIC_SUPABASE_URL=urssupabaseanda
NEXT_PUBLIC_SUPABASE_ANON_KEY=keyanonanda
SUPABASE_SERVICE_ROLE_KEY=keyserviceroleanda
```

**4. Jalankan Development Server**
```bash
npm run dev
```
Buka peramban Anda dan kunjungi tautan [http://localhost:3000](http://localhost:3000).

---
*Dikembangkan untuk digitalisasi pelayanan publik Pemerintah Kabupaten Hulu Sungai Tengah.*
