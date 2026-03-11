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
