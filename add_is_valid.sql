-- Menambahkan kolom is_valid ke tabel data_sesi_survei
-- Default true artinya setiap survei yang baru masuk otomatis sah
ALTER TABLE public.data_sesi_survei 
ADD COLUMN is_valid BOOLEAN DEFAULT true;

-- Update rls policy jika perlu, meskipun service role bisa membypass.
-- Pastikan tidak ada script yang terbentur.
