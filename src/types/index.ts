export type UserRole = 'admin' | 'guru' | 'pengawas' | 'kepala_sekolah' | 'siswa';

export type StudentGrade = 'VII' | 'VIII' | 'IX';

export interface UserProfile {
  id: string;
  username: string; // NISN for students, NIP/Username for staff
  nama: string;
  role: UserRole;
  email?: string;
  kelas?: string; // e.g. "VII-A", "VIII-B", "IX-C"
  tingkat?: StudentGrade;
  mataPelajaran?: string; // for guru
  nomorPeserta?: string; // e.g. "01-02-001"
  ruangUjian?: string; // e.g. "Lab Komputer 1", "Ruang 04"
  statusAktif: boolean;
  sudahAktivasi: boolean;
  password?: string;
  avatarUrl?: string;
  created_at: string;
}

export type QuestionType = 'pilihan_ganda' | 'esai';

export interface MultipleChoiceOption {
  key: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
}

export interface QuestionItem {
  id: string;
  bankId: string;
  nomorUrut: number;
  tipe: QuestionType;
  mataPelajaran: string;
  tingkat: StudentGrade;
  kontenSoal: string;
  opsi?: MultipleChoiceOption[];
  kunciJawaban?: string; // 'A' | 'B' | 'C' | 'D' | 'E' (Restricted on student client)
  bobot: number;
  rubrikEsai?: string; // Scoring guide for teachers
  kataKunciEsai?: string[];
}

export interface QuestionBank {
  id: string;
  kode: string;
  judul: string;
  mataPelajaran: string;
  tingkat: StudentGrade;
  pembuatNama: string;
  pembuatId: string;
  jumlahPilihanGanda: number;
  jumlahEsai: number;
  totalBobot: number;
  keterangan: string;
  created_at: string;
}

export interface ExamSchedule {
  id: string;
  bankId: string;
  namaUjian: string;
  mataPelajaran: string;
  tingkat: StudentGrade;
  durasiMenit: number;
  waktuMulai: string; // ISO string
  waktuSelesai: string; // ISO string
  tokenUjian: string;
  tokenAktif: boolean;
  acakSoal: boolean;
  acakOpsi: boolean;
  tampilkanNilaiLangsung: boolean;
  pengawasNama: string;
  ruang: string;
  status: 'draft' | 'aktif' | 'selesai';
}

export type ExamSessionStatus = 'siap' | 'mengerjakan' | 'ragu' | 'selesai' | 'terkendala';

export interface ExamSession {
  id: string;
  scheduleId: string;
  siswaId: string;
  siswaNama: string;
  siswaNisn: string;
  siswaKelas: string;
  ruangUjian: string;
  waktuMulai?: string;
  waktuSelesai?: string;
  sisaWaktuDetik: number;
  status: ExamSessionStatus;
  jumlahPindahTab: number;
  terakhirAutosave?: string;
  nilaiPilihanGanda?: number;
  nilaiEsai?: number;
  nilaiTotal?: number;
  statusKoreksi: 'otomatis_pg' | 'menunggu_koreksi_guru' | 'tuntas_dinilai';
  ipAddress?: string;
  userAgent?: string;
}

export interface StudentAnswer {
  questionId: string;
  nomorSoal: number;
  tipe: QuestionType;
  jawabanPilihan?: string; // 'A' | 'B' | 'C' | 'D' | 'E'
  jawabanEsai?: string;
  raguRagu: boolean;
  terakhirDisimpan: string;
  nilaiDiperoleh?: number;
  catatanKorektor?: string;
}

export interface ProctorAlert {
  id: string;
  timestamp: string;
  siswaNama: string;
  siswaKelas: string;
  pesan: string;
  tipe: 'peringatan' | 'pelanggaran' | 'logout' | 'selesai';
}

export interface LoadTestMetrics {
  totalConcurrentUsers: number;
  requestsSent: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  p95LatencyMs: number;
  requestsPerSecond: number;
  status: 'idle' | 'running' | 'completed';
}
