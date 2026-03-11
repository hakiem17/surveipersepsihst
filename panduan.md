# Panduan Pembuatan Survei Persepsi Publik Kabupaten Hulu Sungai Tengah

Berikut adalah pemetaan arsitektur aplikasi survei Pemkab HST ke dalam tiga konteks utama, struktur database, dan tech stack yang digunakan:

---

## I. Konteks Arsitektur Aplikasi

### 1. System Layer Context (Konteks Infrastruktur & Teknologi)
Lapisan ini murni membahas alat, framework, dan infrastruktur teknis yang menggerakkan aplikasi.

*   **Frontend Environment**: Menggunakan **Next.js** untuk membangun aplikasi web (*Client-Side & Server-Side Rendering*) yang ringan dan cepat diakses melalui peramban HP.
*   **UI/UX Framework**: Menggunakan **Tailwind CSS** untuk menyusun tata letak responsif, gradasi warna skala penilaian, dan tipografi antarmuka.
*   **Backend & Data Storage**: Menggunakan **Supabase (PostgreSQL)** sebagai Database-as-a-Service (DBaaS) relasional untuk menyimpan data terenkripsi dan menyediakan API.
*   **Data Visualization**: Menggunakan library grafik (seperti **Recharts** atau **Chart.js** yang berjalan di atas Next.js) untuk merender Dasbor Eksekutif.

### 2. Domain Layer Context (Konteks Aturan Bisnis & Data)
Lapisan ini berisi "otak" birokrasi dan aturan main sistem. Teknologi apa pun yang dipakai di System Layer, aturan di lapisan ini tidak boleh berubah.

*   **Entitas Data Master**: Hierarki data wilayah (Kecamatan dan Desa/Kelurahan) dan hierarki evaluasi (Urusan Pemerintahan Wajib/Pilihan merujuk UU 23/2014, dan Butir Pertanyaan).
*   **Aturan Kriteria Inklusi (Objek Survei)**: Penetapan syarat mutlak responden: Warga Sipil, Usia 17+ (atau sudah menikah), KTP domisili HST, dan **bukan** ASN/TNI/Polri aktif.
*   **Standar Pengukuran**: Penggunaan **Skala Likert 1 sampai 5** untuk mengukur tingkat kepuasan layanan.
*   **Metodologi Pengumpulan**: Penerapan metode *Proportional Stratified Random Sampling* (target 400 sampel proporsional di 11 kecamatan).

### 3. Behavior Context (Konteks Perilaku & Interaksi)
Lapisan ini mengatur bagaimana sistem bereaksi terhadap input dari pengguna dan bagaimana aliran datanya bergerak.

*   **Perilaku Penjaga Gerbang (Gatekeeper Flow)**: Jika sistem mendeteksi input yang tidak memenuhi kriteria inklusi (misal: responden memilih status ASN), sistem secara otomatis memblokir akses ke kuesioner dan menampilkan transisi pesan penolakan yang halus dan apresiatif (*polite rejection*) tanpa pesan error.
*   **Perilaku Validasi Bersyarat (Conditional Logic)**: Saat responden berada di halaman kuesioner dan memilih skor 1 (Sangat Buruk) atau 2 (Buruk), sistem akan memunculkan kolom "Cerita Kendala" dan mengubah statusnya menjadi **wajib diisi (mandatory)**. Jika memilih skor 3, 4, atau 5, kolom tersebut bersifat opsional atau disembunyikan.
*   **Perilaku Sinkronisasi Hibrida**: Sistem dapat menerima submit langsung dari perangkat warga (jalur online mandiri/QR Code) atau dari perangkat fasilitator lapangan yang melakukan sinkronisasi *offline-to-online* setelah turun dari wilayah pelosok.
*   **Perilaku Agregasi Seketika (Real-time Behavior)**: Segera setelah satu sesi kuesioner di-submit, sistem tidak menunggu rekapitulasi, melainkan langsung mengirimkan sinyal ke Dasbor Eksekutif untuk memperbarui perhitungan rata-rata Indeks Kepuasan.

---

## II. Struktur Database (Tabel Sistem)

### A. Tabel Referensi (Master Data)
Kelompok tabel ini adalah kerangka dasar sistem yang bersifat tetap dan menjadi patokan untuk pelaporan.

1.  **Tabel Master Kecamatan**
    *   **Fungsi**: Menyimpan daftar 11 kecamatan di Kabupaten HST beserta kuota target surveinya.
    *   **Isi Kolom**: ID Kecamatan, Nama Kecamatan, Jumlah Target Sampel.
2.  **Tabel Master Desa/Kelurahan**
    *   **Fungsi**: Menyimpan daftar seluruh desa dan kelurahan agar pelacakan masalah bisa menukik tajam ke tingkat wilayah terkecil.
    *   **Isi Kolom**: ID Desa, ID Kecamatan (sebagai induk), Nama Desa/Kelurahan.
3.  **Tabel Master Urusan**
    *   **Fungsi**: Mengklasifikasikan area evaluasi kinerja agar selaras dengan pembagian urusan konkuren daerah menurut UU No. 23 Tahun 2014.
    *   **Isi Kolom**: ID Urusan, Klasifikasi Urusan (Wajib Pelayanan Dasar / Wajib Non-Pelayanan Dasar / Pilihan), Nama Urusan.
4.  **Tabel Master Pertanyaan**
    *   **Fungsi**: Menyimpan daftar butir pertanyaan survei yang terikat langsung pada urusan pemerintahan terkait.
    *   **Isi Kolom**: ID Pertanyaan, ID Urusan (sebagai penghubung), Teks Pertanyaan, Status Aktif.

### B. Tabel Demografi
Kelompok tabel untuk memetakan siapa yang memberikan penilaian, memastikan data berasal dari representasi warga yang valid.

5.  **Tabel Data Responden**
    *   **Fungsi**: Menyimpan profil demografi dari warga sipil yang sudah lolos filter kriteria awal (Bukan ASN/TNI/Polri aktif, KTP HST, Usia 17+).
    *   **Isi Kolom**: ID Responden, Jenis Kelamin, Kelompok Usia, Pendidikan Terakhir, Pekerjaan, Asal Kecamatan, Asal Desa/Kelurahan, dan Waktu Pendaftaran.

### C. Tabel Transaksi (Perekaman Survei)
Kelompok tabel dinamis yang akan terus merekam arus data dari masyarakat yang masuk setiap harinya.

6.  **Tabel Sesi Survei (Data Makro)**
    *   **Fungsi**: Merekam informasi umum untuk setiap satu kali pengisian kuesioner utuh yang diselesaikan warga.
    *   **Isi Kolom**: ID Sesi Survei, ID Responden, Jalur Pengisian (Digital / Intercept / Lapangan), Titik Layanan (diisi jika memindai QR Code di lokasi seperti MPP atau RSUD), Skor Penilaian Makro Kinerja Pemkab secara keseluruhan, Saran/Aspirasi Bebas, dan Waktu Selesai.
7.  **Tabel Detail Jawaban (Data Mikro)**
    *   **Fungsi**: Menyimpan rekam jejak skor spesifik (skala 1 sampai 5) dari setiap butir pertanyaan yang dijawab.
    *   **Isi Kolom**: ID Jawaban, ID Sesi Survei, ID Pertanyaan, Skor Pilihan (1, 2, 3, 4, atau 5), dan Kolom Cerita Kendala *(Dengan aturan sistem: Wajib diisi jika skor yang dipilih adalah 1 atau 2, dan bersifat opsional jika memilih skor 3, 4, atau 5)*.

---

## III. Tech Stack (Framework Teknologi)

Berikut adalah daftar framework teknologi yang digunakan sebagai fondasi arsitektur sistem survei ini, merujuk pada cetak biru infrastruktur digital skala kabupaten:

1.  **Framework Frontend (Antarmuka Aplikasi): Next.js**
    *   **Peran Utama**: Membangun aplikasi web yang ringan dan responsif.
    *   **Fungsi Sistem**: Mengelola logika antarmuka secara keseluruhan, termasuk sistem Gatekeeper (filter awal responden), validasi kuesioner (logika wajib isi untuk skor 1 dan 2), serta memastikan aksesibilitas yang lancar baik di kawasan urban maupun area minim sinyal.
2.  **Framework UI/Styling (Desain Visual): Tailwind CSS**
    *   **Peran Utama**: Membentuk struktur visual dan tata letak aplikasi.
    *   **Fungsi Sistem**: Mengeksekusi desain UI yang ramah dan inklusif, seperti gradasi warna pada tombol skor 1-5 agar terhindar dari ambiguitas, serta membuat transisi yang sangat halus pada pesan penolakan (*polite rejection*) maupun kemunculan kolom alasan.
3.  **Framework Backend & Database: Supabase**
    *   **Peran Utama**: Mengelola basis data relasional (PostgreSQL) yang aman dan terenkripsi.
    *   **Fungsi Sistem**: Menyimpan seluruh data master (Urusan, Kecamatan, Desa) dan data transaksi (jawaban responden). Supabase juga menangani aliran data *real-time* dari aplikasi warga ke dasbor analitik tanpa perlu rekapitulasi manual.
4.  **Framework Visualisasi Data: Recharts / Chart.js (Terintegrasi di Next.js)**
    *   **Peran Utama**: Mengolah angka mentah menjadi grafik interaktif.
    *   **Fungsi Sistem**: Menerjemahkan ratusan entri data yang masuk secara seketika (*real-time*) ke dalam Dasbor Analitik di meja kerja eksekutif, menampilkan tren kinerja bulanan, peta demografi, dan Indeks Kepuasan.

> Susunan *tech stack* ini memastikan aplikasi berjalan cepat, aman, dan siap menampung lonjakan data dari seluruh penjuru kabupaten.
