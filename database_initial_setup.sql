-- ==========================================
-- Skema Database Survei Persepsi Publik HST
-- Platform: Supabase (PostgreSQL)
-- ==========================================

-- -----------------------------------------------------------------------------
-- BAGIAN 1: TABEL REFERENSI (MASTER DATA)
-- Kerangka dasar sistem yang bersifat statis.
-- -----------------------------------------------------------------------------

-- 1. Tabel Master Kecamatan
CREATE TABLE public.master_kecamatan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_kecamatan VARCHAR(100) NOT NULL UNIQUE,
    target_sampel INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Master Desa/Kelurahan
CREATE TABLE public.master_desa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kecamatan_id UUID NOT NULL REFERENCES public.master_kecamatan(id) ON DELETE CASCADE,
    nama_desa VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (kecamatan_id, nama_desa) -- Mencegah nama desa kembar di satu kecamatan
);

-- 3. Tabel Master Urusan (Sesuai UU 23/2014)
CREATE TABLE public.master_urusan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    klasifikasi VARCHAR(100) NOT NULL, -- Contoh: 'Wajib Pelayanan Dasar', 'Pilihan'
    nama_urusan VARCHAR(200) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Master Pertanyaan Survei
CREATE TABLE public.master_pertanyaan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    urusan_id UUID REFERENCES public.master_urusan(id) ON DELETE SET NULL, -- Opsional, jika pertanyaan terikat ke urusan spesifik
    teks_pertanyaan TEXT NOT NULL,
    urutan INTEGER NOT NULL DEFAULT 0, -- Untuk mempermudah pengurutan di tampilan UI
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- BAGIAN 2: TABEL DEMOGRAFI 
-- Memetakan profil warga pengguna yang valid.
-- -----------------------------------------------------------------------------

-- 5. Tabel Data Responden (Warga Sipil Valid)
CREATE TABLE public.data_responden (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Identifikasi opsional, jika anonim bisa dikosongkan/null
    nomor_hp VARCHAR(20) UNIQUE, 
    -- Data Profil Inti
    jenis_kelamin VARCHAR(20) NOT NULL, -- 'Laki-laki', 'Perempuan'
    kelompok_usia VARCHAR(30) NOT NULL, -- Contoh: '17-25', '26-35', dst
    pendidikan_terakhir VARCHAR(50) NOT NULL,
    pekerjaan_utama VARCHAR(100) NOT NULL,
    -- Data Domisili
    kecamatan_id UUID NOT NULL REFERENCES public.master_kecamatan(id),
    desa_id UUID NOT NULL REFERENCES public.master_desa(id),
    
    waktu_pendaftaran TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- BAGIAN 3: TABEL TRANSAKSI (PEREKAMAN SURVEI)
-- Merekam arus data kuesioner harian.
-- -----------------------------------------------------------------------------

-- 6. Tabel Sesi Survei (Data Makro)
CREATE TABLE public.data_sesi_survei (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    responden_id UUID NOT NULL REFERENCES public.data_responden(id) ON DELETE CASCADE,
    
    jalur_pengisian VARCHAR(50) NOT NULL DEFAULT 'Digital Mandiri', -- 'Digital Mandiri', 'Fasilitator Lapangan'
    titik_layanan VARCHAR(150), -- Opsional, misal: 'MPP', 'RSUD', atau nama acara
    
    -- Penilaian Makro (Secara Keseluruhan)
    skor_makro INTEGER CHECK (skor_makro >= 1 AND skor_makro <= 5),
    saran_aspirasi TEXT,
    
    waktu_mulai TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    waktu_selesai TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'Selesai' -- 'Draft' atau 'Selesai'
);

-- 7. Tabel Detail Jawaban (Data Mikro - Skala Likert)
CREATE TABLE public.detail_jawaban (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sesi_survei_id UUID NOT NULL REFERENCES public.data_sesi_survei(id) ON DELETE CASCADE,
    pertanyaan_id UUID NOT NULL REFERENCES public.master_pertanyaan(id),
    
    skor_pilihan INTEGER NOT NULL CHECK (skor_pilihan >= 1 AND skor_pilihan <= 5),
    cerita_kendala TEXT, -- Conditional Logic: Wajib diisi di UI jika skor_pilihan = 1 atau 2
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (sesi_survei_id, pertanyaan_id) -- Mencegah jawaban ganda untuk pertanyaan yang sama di 1 sesi
);

-- -----------------------------------------------------------------------------
-- BAGIAN 4: KEAMANAN & RLS (Row Level Security)
-- -----------------------------------------------------------------------------
-- Secara default, aktifkan RLS di tabel sensitif agar tidak bisa diedit sembarangan
ALTER TABLE public.data_responden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sesi_survei ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_jawaban ENABLE ROW LEVEL SECURITY;

-- Berikan akses INSERT bagi pengguna anonim (Public) untuk mengisi survei (Frontend Insert)
CREATE POLICY "Izinkan Insert Responden Public" ON public.data_responden FOR INSERT WITH CHECK (true);
CREATE POLICY "Izinkan Insert Sesi Public" ON public.data_sesi_survei FOR INSERT WITH CHECK (true);
CREATE POLICY "Izinkan Insert Jawaban Public" ON public.detail_jawaban FOR INSERT WITH CHECK (true);

-- (Opsional) Berikan akses SELECT bagi Public HANYA untuk membaca Master Data
CREATE POLICY "Izinkan Baca Master Kecamatan Public" ON public.master_kecamatan FOR SELECT USING (true);
CREATE POLICY "Izinkan Baca Master Desa Public" ON public.master_desa FOR SELECT USING (true);
CREATE POLICY "Izinkan Baca Master Urusan Public" ON public.master_urusan FOR SELECT USING (true);
CREATE POLICY "Izinkan Baca Master Pertanyaan Public" ON public.master_pertanyaan FOR SELECT USING (is_active = true);
-- ==========================================
-- SQL SEED: Data Master Wilayah Kabupaten HST
-- 11 Kecamatan, 8 Kelurahan, 161 Desa
-- ==========================================

-- 1. Input Data Kecamatan
INSERT INTO public.master_kecamatan (nama_kecamatan) VALUES
('Haruyan'),
('Batu Benawa'),
('Labuan Amas Selatan'),
('Labuan Amas Utara'),
('Pandawan'),
('Barabai'),
('Batang Alai Selatan'),
('Batang Alai Utara'),
('Hantakan'),
('Batang Alai Timur'),
('Limpasu')
ON CONFLICT (nama_kecamatan) DO NOTHING;

-- 2. Input Data Desa / Kelurahan
-- KECAMATAN HARUYAN (17 Desa)
INSERT INTO public.master_desa (kecamatan_id, nama_desa) VALUES 
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Andang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Barikin'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Batu Panggung'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Hapulang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Haruyan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Haruyan Seberang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Lok Buntar'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Mangunang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Mangunang Seberang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Pandanu'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Panggung'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Pengambau Hilir Dalam'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Pengambau Hilir Luar'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Pengambau Hulu'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Sungai Harang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Tabat Padang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Haruyan'), 'Teluk Mesjid');

-- KECAMATAN BATU BENAWA (14 Desa)
INSERT INTO public.master_desa (kecamatan_id, nama_desa) VALUES 
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Aluan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Aluan Besar'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Aluan Mati'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Aluan Sumur'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Bakti'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Baru'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Haliau'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Kahakan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Kalibaru'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Layuh'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Murung A'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Pagat'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Pantai Batung'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batu Benawa'), 'Paya Besar');

-- KECAMATAN LABUAN AMAS SELATAN (17 Desa, 1 Kelurahan)
INSERT INTO public.master_desa (kecamatan_id, nama_desa) VALUES 
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Kel. Pantai Hambawang Barat'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Bangkal'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Banua Kepayang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Batang Bahalang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Durian Gantang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Guha'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Jamil'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Mahang Baru'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Mundar'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Murung Taal'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Panggang Marak'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Pantai Hambawang Timur'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Sungai Jaranih'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Sungai Rangas'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Taal'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Tabudarat Hilir'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Tabudarat Hulu'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Selatan'), 'Taras Padang');

-- KECAMATAN LABUAN AMAS UTARA (16 Desa)
INSERT INTO public.master_desa (kecamatan_id, nama_desa) VALUES 
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Banua Kupang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Binjai Pemangkih'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Binjai Pirua'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Kadundung'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Kasarangan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Mantaas'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Pahalatan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Parumahan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Pemangkih'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Pemangkih Seberang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Rantau Bujur'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Rantau Keminting'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Samhurang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Sungai Buluh'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Tabat'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Labuan Amas Utara'), 'Tungkup');

-- KECAMATAN PANDAWAN (21 Desa)
INSERT INTO public.master_desa (kecamatan_id, nama_desa) VALUES 
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Banua Asam'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Banua Batung'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Banua Hanyar'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Banua Supanggal'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Buluan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Hilir Banua'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Hulu Rasau'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Jaranih'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Jatuh'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Kambat Selatan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Kambat Utara'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Kayu Rabah'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Mahang Matang Landung'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Mahang Putat'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Mahang Sungai Hanyar'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Masiraan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Matang Ginalon'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Palajau'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Pandawan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Setiap'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Pandawan'), 'Walatung');

-- KECAMATAN BARABAI (12 Desa, 6 Kelurahan)
INSERT INTO public.master_desa (kecamatan_id, nama_desa) VALUES 
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Kel. Barabai Barat'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Kel. Barabai Darat'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Kel. Barabai Selatan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Kel. Barabai Timur'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Kel. Barabai Utara'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Kel. Bukat'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Awang Besar'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Ayuang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Babai'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Bakapas'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Banua Binjai'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Banua Budi'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Banua Jingah'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Benawa Tengah'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Gambah'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Kayu Bawang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Mandingin'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Barabai'), 'Pajukungan');

-- KECAMATAN BATANG ALAI SELATAN (18 Desa, 1 Kelurahan)
INSERT INTO public.master_desa (kecamatan_id, nama_desa) VALUES 
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Kel. Birayang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Anduhum'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Banua Rantau'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Birayang Surapati'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Birayang Timur'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Cukan Lipai'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Kapar'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Kias'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Labuhan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Limbar'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Lok Besar'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Lunjuk'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Mahela'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Paya'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Rangas'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Tanah Habang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Tembok Bahalang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Wawai'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Selatan'), 'Wawai Gardu');

-- KECAMATAN BATANG ALAI UTARA (14 Desa)
INSERT INTO public.master_desa (kecamatan_id, nama_desa) VALUES 
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Awang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Awang Baru'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Dangu'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Hapingin'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Haur Gading'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Ilung'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Ilung Pasar Lama'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Ilung Tengah'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Labung Anak'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Maringgit'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Muara Rintis'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Sumanggi'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Sumanggi Seberang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Utara'), 'Telang');

-- KECAMATAN HANTAKAN (12 Desa)
INSERT INTO public.master_desa (kecamatan_id, nama_desa) VALUES 
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Hantakan'), 'Alat'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Hantakan'), 'Batu Tunggal'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Hantakan'), 'Bulayak'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Hantakan'), 'Datar Ajab'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Hantakan'), 'Hantakan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Hantakan'), 'Haruyan Dayak'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Hantakan'), 'Hinas Kanan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Hantakan'), 'Kindingan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Hantakan'), 'Murung B'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Hantakan'), 'Pasting'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Hantakan'), 'Patikalain'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Hantakan'), 'Tilahan');

-- KECAMATAN BATANG ALAI TIMUR (11 Desa)
INSERT INTO public.master_desa (kecamatan_id, nama_desa) VALUES 
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Timur'), 'Aing Bantai'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Timur'), 'Atiran'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Timur'), 'Batu Perahu'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Timur'), 'Batu Tangga'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Timur'), 'Datar Batung'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Timur'), 'Hinas Kiri'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Timur'), 'Juhu'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Timur'), 'Muara Hungi'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Timur'), 'Nateh'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Timur'), 'Pembakulan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Batang Alai Timur'), 'Tandilang');

-- KECAMATAN LIMPASU (9 Desa)
INSERT INTO public.master_desa (kecamatan_id, nama_desa) VALUES 
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Limpasu'), 'Abung'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Limpasu'), 'Abung Surapati'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Limpasu'), 'Hawang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Limpasu'), 'Kabang'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Limpasu'), 'Karatungan'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Limpasu'), 'Karau'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Limpasu'), 'Limpasu'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Limpasu'), 'Pauh'),
((SELECT id FROM master_kecamatan WHERE nama_kecamatan = 'Limpasu'), 'Tapuk');
-- Menambahkan kolom is_valid ke tabel data_sesi_survei
-- Default true artinya setiap survei yang baru masuk otomatis sah
ALTER TABLE public.data_sesi_survei 
ADD COLUMN is_valid BOOLEAN DEFAULT true;

-- Update rls policy jika perlu, meskipun service role bisa membypass.
-- Pastikan tidak ada script yang terbentur.
-- Create table for global system settings
-- This table is designed to hold only a single row (id = 1)
CREATE TABLE public.pengaturan_sistem (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    status_survei_aktif BOOLEAN NOT NULL DEFAULT true,
    tahun_berjalan INTEGER NOT NULL DEFAULT extract(year from now()),
    pesan_penutupan TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert the default configuration row
INSERT INTO public.pengaturan_sistem (id, status_survei_aktif, tahun_berjalan, pesan_penutupan)
VALUES (
    1, 
    true, 
    extract(year from now()), 
    'Mohon maaf, periode pengisian Survei Persepsi Publik saat ini sedang ditutup. Nantikan kembali pembukaan survei pada periode berikutnya.'
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.pengaturan_sistem ENABLE ROW LEVEL SECURITY;

-- Allow public to read the settings (so the landing page knows if it should open the survey)
CREATE POLICY "Izinkan Baca Pengaturan Public" ON public.pengaturan_sistem FOR SELECT USING (true);
