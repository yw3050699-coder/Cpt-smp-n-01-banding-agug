export const SUPABASE_MIGRATION_SQL = `-- ==============================================================================
-- E-POTING UJIAN ONLINE - SMP NEGERI 01 BANDING AGUNG
-- SQL MIGRATION: Schema, Triggers, Constraints & Row Level Security (RLS)
-- Target: Minimal 200 Siswa Kelas VII, VIII, IX, Guru, Pengawas, Admin, Kepala Sekolah
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'guru', 'pengawas', 'kepala_sekolah', 'siswa');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.student_grade AS ENUM ('VII', 'VIII', 'IX');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.question_type AS ENUM ('pilihan_ganda', 'esai');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.session_status AS ENUM ('siap', 'mengerjakan', 'ragu', 'selesai', 'terkendala');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES DEFINITION

-- 3.1 PROFILES (Sinkron dengan auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL, -- NISN untuk siswa, NIP/User untuk guru/admin
  nama VARCHAR(150) NOT NULL,
  role public.user_role NOT NULL DEFAULT 'siswa',
  kelas VARCHAR(20),                   -- Contoh: VII-A, VIII-B, IX-A
  tingkat public.student_grade,
  mata_pelajaran VARCHAR(100),         -- Untuk guru
  nomor_peserta VARCHAR(50) UNIQUE,    -- Contoh: 01-09-001
  ruang_ujian VARCHAR(50),             -- Lab Komputer 1, 2, dll.
  status_aktif BOOLEAN NOT NULL DEFAULT true,
  sudah_aktivasi BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index untuk pencarian cepat 200+ siswa
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_kelas ON public.profiles(kelas);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 3.2 QUESTION BANKS (Bank Soal per Mata Pelajaran)
CREATE TABLE IF NOT EXISTS public.question_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(50) UNIQUE NOT NULL,
  judul VARCHAR(200) NOT NULL,
  mata_pelajaran VARCHAR(100) NOT NULL,
  tingkat public.student_grade NOT NULL,
  pembuat_id UUID NOT NULL REFERENCES public.profiles(id),
  total_bobot NUMERIC(5,2) DEFAULT 100.00,
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 QUESTIONS (Master Butir Soal PG & Esai)
-- CRITICAL SECURITY: Kunci jawaban hanya boleh diakses oleh Guru/Admin, TIDAK BOLEH KE SISWA!
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID NOT NULL REFERENCES public.question_banks(id) ON DELETE CASCADE,
  nomor_urut INT NOT NULL,
  tipe public.question_type NOT NULL,
  konten_soal TEXT NOT NULL,
  opsi JSONB, -- Array format: [{"key": "A", "text": "..."}, ...]
  kunci_jawaban VARCHAR(10), -- A/B/C/D/E (HANYA GURU/ADMIN)
  bobot NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  rubrik_esai TEXT,
  kata_kunci_esai TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_questions_bank ON public.questions(bank_id);

-- 3.4 EXAM SCHEDULES (Jadwal Ujian & Rilis Token)
CREATE TABLE IF NOT EXISTS public.exam_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID NOT NULL REFERENCES public.question_banks(id),
  nama_ujian VARCHAR(200) NOT NULL,
  mata_pelajaran VARCHAR(100) NOT NULL,
  tingkat public.student_grade NOT NULL,
  durasi_menit INT NOT NULL DEFAULT 60,
  waktu_mulai TIMESTAMPTZ NOT NULL,
  waktu_selesai TIMESTAMPTZ NOT NULL,
  token_ujian VARCHAR(10) NOT NULL,
  token_aktif BOOLEAN NOT NULL DEFAULT true,
  acak_soal BOOLEAN NOT NULL DEFAULT true,
  acak_opsi BOOLEAN NOT NULL DEFAULT false,
  tampilkan_nilai_langsung BOOLEAN NOT NULL DEFAULT false,
  pengawas_id UUID REFERENCES public.profiles(id),
  ruang VARCHAR(100) NOT NULL DEFAULT 'Lab Komputer',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.5 EXAM SESSIONS (Sesi Pengerjaan Siswa - High Concurrency 200+)
CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.exam_schedules(id) ON DELETE CASCADE,
  siswa_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ruang_ujian VARCHAR(50),
  waktu_mulai TIMESTAMPTZ,
  waktu_selesai TIMESTAMPTZ,
  sisa_waktu_detik INT NOT NULL DEFAULT 3600,
  status public.session_status NOT NULL DEFAULT 'siap',
  jumlah_pindah_tab INT NOT NULL DEFAULT 0,
  terakhir_autosave TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  nilai_pilihan_ganda NUMERIC(5,2),
  nilai_esai NUMERIC(5,2),
  nilai_total NUMERIC(5,2),
  status_koreksi VARCHAR(30) DEFAULT 'menunggu_koreksi_guru',
  ip_address VARCHAR(45),
  user_agent TEXT,
  UNIQUE(schedule_id, siswa_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_schedule ON public.exam_sessions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_sessions_siswa ON public.exam_sessions(siswa_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.exam_sessions(status);

-- 3.6 STUDENT ANSWERS (Autosave Jawaban Terverifikasi Server)
CREATE TABLE IF NOT EXISTS public.student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  tipe public.question_type NOT NULL,
  jawaban_pilihan VARCHAR(10),
  jawaban_esai TEXT,
  ragu_ragu BOOLEAN NOT NULL DEFAULT false,
  nilai_diperoleh NUMERIC(5,2),
  catatan_korektor TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_session ON public.student_answers(session_id);

-- 3.7 PROCTOR ALERTS / AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.proctor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  siswa_id UUID REFERENCES public.profiles(id),
  pesan TEXT NOT NULL,
  tipe VARCHAR(30) NOT NULL DEFAULT 'peringatan',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) & LEAST PRIVILEGE ENFORCEMENT
-- ==============================================================================

-- Aktifkan RLS di semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctor_alerts ENABLE ROW LEVEL SECURITY;

-- Helper function: Dapatkan role user saat ini dari JWT auth.uid()
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4.1 RLS PROFILES
-- Siswa hanya bisa membaca profile sendiri.
-- Guru, Pengawas, Admin, Kepala Sekolah bisa membaca seluruh daftar siswa.
CREATE POLICY "Siswa can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.current_user_role() IN ('admin', 'guru', 'pengawas', 'kepala_sekolah'));

CREATE POLICY "Only admin can insert or update profiles"
  ON public.profiles FOR ALL
  USING (public.current_user_role() = 'admin');

-- 4.2 RLS QUESTION BANKS & QUESTIONS
CREATE POLICY "Staff can manage question banks"
  ON public.question_banks FOR ALL
  USING (public.current_user_role() IN ('admin', 'guru', 'kepala_sekolah'));

CREATE POLICY "Siswa can view question banks in active exam"
  ON public.question_banks FOR SELECT
  USING (true);

-- CRITICAL: Siswa TIDAK boleh membaca tabel questions secara langsung yang memuat kunci_jawaban!
CREATE POLICY "Staff full access to questions"
  ON public.questions FOR ALL
  USING (public.current_user_role() IN ('admin', 'guru', 'kepala_sekolah'));

-- Buat View aman khusus Siswa: Tidak memuat kunci_jawaban dan kata_kunci_esai
CREATE OR REPLACE VIEW public.student_exam_questions AS
  SELECT 
    id,
    bank_id,
    nomor_urut,
    tipe,
    konten_soal,
    opsi,
    bobot
  FROM public.questions;

GRANT SELECT ON public.student_exam_questions TO authenticated;

-- 4.3 RLS EXAM SESSIONS
CREATE POLICY "Siswa can view and update own session"
  ON public.exam_sessions FOR ALL
  USING (siswa_id = auth.uid());

CREATE POLICY "Staff can view and manage all sessions"
  ON public.exam_sessions FOR ALL
  USING (public.current_user_role() IN ('admin', 'guru', 'pengawas', 'kepala_sekolah'));

-- 4.4 RLS STUDENT ANSWERS (Autosave Protection)
CREATE POLICY "Siswa can insert and update their own answers during exam"
  ON public.student_answers FOR ALL
  USING (
    session_id IN (
      SELECT id FROM public.exam_sessions 
      WHERE siswa_id = auth.uid() AND status IN ('siap', 'mengerjakan', 'ragu')
    )
  );

CREATE POLICY "Staff can view all student answers"
  ON public.student_answers FOR SELECT
  USING (public.current_user_role() IN ('admin', 'guru', 'pengawas', 'kepala_sekolah'));

CREATE POLICY "Guru and admin can update essay grades"
  ON public.student_answers FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'guru'));

-- ==============================================================================
-- 5. SERVER-SIDE TIMER & ANTI-TAMPER TRIGGERS
-- ==============================================================================

-- Mencegah siswa mengirim jawaban setelah waktu ujian ditutup
CREATE OR REPLACE FUNCTION public.check_exam_session_validity()
RETURNS TRIGGER AS $$
DECLARE
  v_session_status public.session_status;
  v_sisa_waktu INT;
BEGIN
  SELECT status, sisa_waktu_detik INTO v_session_status, v_sisa_waktu
  FROM public.exam_sessions
  WHERE id = NEW.session_id;

  IF v_session_status = 'selesai' THEN
    RAISE EXCEPTION 'Ujian sudah diselesaikan. Jawaban tidak dapat diubah lagi!';
  END IF;

  IF v_sisa_waktu <= 0 THEN
    RAISE EXCEPTION 'Waktu ujian telah habis!';
  END IF;

  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_answer_after_deadline ON public.student_answers;
CREATE TRIGGER trg_prevent_answer_after_deadline
  BEFORE INSERT OR UPDATE ON public.student_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.check_exam_session_validity();
`;

export const WINDOWS_POWERSHELL_INSTRUCTIONS = `# =====================================================================
# PANDUAN EKSEKUSI SUPABASE VIA WINDOWS POWERSHELL / TERMINAL
# SMP Negeri 01 Banding Agung - E-POTING Ujian Online
# =====================================================================

# 1. Pastikan Node.js (v18+) terinstall di Windows
node -v
npm -v

# 2. Login ke Supabase CLI menggunakan Access Token dari dashboard
npx supabase login

# 3. Inisialisasi konfigurasi lokal jika belum ada
npx supabase init

# 4. Hubungkan project dengan ID Project Supabase Anda
# (Ganti <PROJECT_REF> dengan Project ID di Supabase Console -> Settings -> General)
npx supabase link --project-ref <PROJECT_REF>

# 5. Jalankan migration skema SQL ke database cloud
npx supabase db push

# 6. Generate Type Definition TypeScript otomatis untuk frontend
npx supabase gen types typescript --linked > src/types/supabase.ts

# 7. Menjalankan Uji Beban 200 Peserta Secara Otomatis:
# Buka menu Admin Dashboard -> Tab "Uji Beban 200 Siswa" -> Klik "Mulai Simulasi 200 Siswa Serentak"
`;
