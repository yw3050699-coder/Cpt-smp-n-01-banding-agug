import { UserProfile, QuestionBank, QuestionItem, ExamSchedule, ExamSession } from '../types';

export const INITIAL_STAFF_USERS: UserProfile[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    nama: 'Heri Kurniawan, S.Pd (Operator)',
    role: 'admin',
    email: 'admin.smpn1ba@sekolah.sch.id',
    statusAktif: true,
    sudahAktivasi: true,
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'usr_kepsek',
    username: 'kepsek',
    nama: 'Drs. H. Muhammad Ilyas, M.M.',
    role: 'kepala_sekolah',
    email: 'kepsek.smpn1ba@sekolah.sch.id',
    statusAktif: true,
    sudahAktivasi: true,
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'usr_guru_ipa',
    username: 'guru_ipa',
    nama: 'Dra. Sri Wahyuni',
    role: 'guru',
    email: 'sri.wahyuni@sekolah.sch.id',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    statusAktif: true,
    sudahAktivasi: true,
    created_at: '2026-01-11T09:00:00Z',
  },
  {
    id: 'usr_guru_mtk',
    username: 'guru_mtk',
    nama: 'Ahmad Fauzi, M.Pd',
    role: 'guru',
    email: 'ahmad.fauzi@sekolah.sch.id',
    mataPelajaran: 'Matematika',
    statusAktif: true,
    sudahAktivasi: true,
    created_at: '2026-01-11T09:30:00Z',
  },
  {
    id: 'usr_pengawas_01',
    username: 'pengawas_01',
    nama: 'Rudi Santoso, S.Kom',
    role: 'pengawas',
    email: 'rudi.santoso@sekolah.sch.id',
    ruangUjian: 'Lab Komputer 1',
    statusAktif: true,
    sudahAktivasi: true,
    created_at: '2026-01-12T07:30:00Z',
  },
];

// Helper to generate up to 1000 realistic Indonesian student records for SMPN 01 Banding Agung
const FIRST_NAMES = [
  'Aditya', 'Aisyah', 'Alif', 'Anindya', 'Bayu', 'Bunga', 'Cahya', 'Dimas', 'Dwi', 'Eka',
  'Fajar', 'Fatimah', 'Galih', 'Gita', 'Hafizh', 'Hanif', 'Indah', 'Ilham', 'Joko', 'Kurnia',
  'Lestari', 'Mahendra', 'Mawar', 'Nabila', 'Naufal', 'Putri', 'Rafi', 'Rahma', 'Reza', 'Rian',
  'Rizky', 'Salsabila', 'Satria', 'Siti', 'Taufik', 'Tri', 'Wahyu', 'Wulan', 'Yusuf', 'Zahra',
  'Arif', 'Bagas', 'Citra', 'Danang', 'Erna', 'Farhan', 'Gilang', 'Hendra', 'Intan', 'Jihan',
  'Kevin', 'Lutfi', 'Mega', 'Nadya', 'Oki', 'Pandu', 'Qori', 'Rangga', 'Syifa', 'Tegar'
];

const LAST_NAMES = [
  'Pratama', 'Hidayat', 'Saputra', 'Ramadhan', 'Wijaya', 'Kusuma', 'Santoso', 'Utami', 'Lestari', 'Putra',
  'Setiawan', 'Nugroho', 'Wibowo', 'Firmansyah', 'Suryani', 'Anggraini', 'Maulana', 'Siregar', 'Pasaribu', 'Hakim',
  'Suhartono', 'Gunawan', 'Purnama', 'Subagyo', 'Kurniawan', 'Yulianto', 'Wahyudi', 'Hermawan', 'Hartono', 'Puspita'
];

export const ALL_SCHOOL_CLASSES = [
  // Kelas VII (10 Rombel)
  { grade: 'VII' as const, name: 'VII-A' },
  { grade: 'VII' as const, name: 'VII-B' },
  { grade: 'VII' as const, name: 'VII-C' },
  { grade: 'VII' as const, name: 'VII-D' },
  { grade: 'VII' as const, name: 'VII-E' },
  { grade: 'VII' as const, name: 'VII-F' },
  { grade: 'VII' as const, name: 'VII-G' },
  { grade: 'VII' as const, name: 'VII-H' },
  { grade: 'VII' as const, name: 'VII-I' },
  { grade: 'VII' as const, name: 'VII-J' },

  // Kelas VIII (10 Rombel)
  { grade: 'VIII' as const, name: 'VIII-A' },
  { grade: 'VIII' as const, name: 'VIII-B' },
  { grade: 'VIII' as const, name: 'VIII-C' },
  { grade: 'VIII' as const, name: 'VIII-D' },
  { grade: 'VIII' as const, name: 'VIII-E' },
  { grade: 'VIII' as const, name: 'VIII-F' },
  { grade: 'VIII' as const, name: 'VIII-G' },
  { grade: 'VIII' as const, name: 'VIII-H' },
  { grade: 'VIII' as const, name: 'VIII-I' },
  { grade: 'VIII' as const, name: 'VIII-J' },

  // Kelas IX (10 Rombel)
  { grade: 'IX' as const, name: 'IX-A' },
  { grade: 'IX' as const, name: 'IX-B' },
  { grade: 'IX' as const, name: 'IX-C' },
  { grade: 'IX' as const, name: 'IX-D' },
  { grade: 'IX' as const, name: 'IX-E' },
  { grade: 'IX' as const, name: 'IX-F' },
  { grade: 'IX' as const, name: 'IX-G' },
  { grade: 'IX' as const, name: 'IX-H' },
  { grade: 'IX' as const, name: 'IX-I' },
  { grade: 'IX' as const, name: 'IX-J' },
];

export function generateStudentsList(targetTotal: number = 1000): UserProfile[] {
  const students: UserProfile[] = [];
  const classes = ALL_SCHOOL_CLASSES;
  const rooms = [
    'Lab Komputer 1', 'Lab Komputer 2', 'Lab Komputer 3',
    'Ruang Multimedia 1', 'Ruang Multimedia 2',
    'Ruang CBT 01', 'Ruang CBT 02', 'Ruang CBT 03', 'Ruang CBT 04', 'Ruang CBT 05'
  ];

  const studentsPerClass = Math.ceil(targetTotal / classes.length); // ~34 per class
  let idCounter = 1;

  for (const cls of classes) {
    for (let i = 1; i <= studentsPerClass; i++) {
      if (students.length >= targetTotal) break;

      const fn = FIRST_NAMES[(idCounter * 7 + i) % FIRST_NAMES.length];
      const ln = LAST_NAMES[(idCounter * 11 + i * 3) % LAST_NAMES.length];
      const nisn = `008${String(1000000 + idCounter).slice(1)}`;
      const gradeCode = cls.grade === 'VII' ? '07' : cls.grade === 'VIII' ? '08' : '09';
      const nomorPeserta = `01-${gradeCode}-${String(idCounter).padStart(4, '0')}`;
      const room = rooms[(idCounter - 1) % rooms.length];
      const sudahAktivasi = idCounter % 6 !== 0; // ~83% activated

      students.push({
        id: `std_${idCounter}`,
        username: nisn,
        nama: `${fn} ${ln}`,
        role: 'siswa',
        kelas: cls.name,
        tingkat: cls.grade,
        nomorPeserta,
        ruangUjian: room,
        statusAktif: true,
        sudahAktivasi,
        email: `siswa.${nisn}@smpn1ba.sch.id`,
        created_at: '2026-02-01T08:00:00Z',
      });

      idCounter++;
    }
    if (students.length >= targetTotal) break;
  }

  return students;
}

export const INITIAL_QUESTION_BANKS: QuestionBank[] = [
  {
    id: 'bank_ipa_07',
    kode: 'IPA-VII-PAS-2026',
    judul: 'Asesmen IPA Terpadu Kelas VII (Klasifikasi Makhluk Hidup & Ekosistem)',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'VII',
    pembuatNama: 'Dra. Sri Wahyuni',
    pembuatId: 'usr_guru_ipa',
    jumlahPilihanGanda: 5,
    jumlahEsai: 1,
    totalBobot: 100,
    keterangan: 'Materi Ciri Makhluk Hidup, Mikroskop, Klasifikasi Lima Kingdom, dan Rantai Makanan',
    created_at: '2026-02-10T08:00:00Z',
  },
  {
    id: 'bank_mtk_08',
    kode: 'MTK-VIII-PTS-2026',
    judul: 'Penilaian Matematika Kelas VIII (Pola Bilangan & Teorema Pythagoras)',
    mataPelajaran: 'Matematika',
    tingkat: 'VIII',
    pembuatNama: 'Ahmad Fauzi, M.Pd',
    pembuatId: 'usr_guru_mtk',
    jumlahPilihanGanda: 5,
    jumlahEsai: 1,
    totalBobot: 100,
    keterangan: 'Mencakup Barisan Aritmatika, Geometri, dan Pembuktian Segitiga Siku-siku Pythagoras',
    created_at: '2026-02-12T08:30:00Z',
  },
  {
    id: 'bank_ipa_01',
    kode: 'IPA-IX-PAS-2026',
    judul: 'Penilaian Akhir Semester IPA Terpadu Kelas IX',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    pembuatNama: 'Dra. Sri Wahyuni',
    pembuatId: 'usr_guru_ipa',
    jumlahPilihanGanda: 10,
    jumlahEsai: 2,
    totalBobot: 100,
    keterangan: 'Mencakup materi Sistem Reproduksi, Pewarisan Sifat, Kelistrikan, dan Bioteknologi',
    created_at: '2026-02-15T09:00:00Z',
  },
  {
    id: 'bank_mtk_01',
    kode: 'MTK-IX-PAT-2026',
    judul: 'Asesmen Matematika Bangun Ruang Sisi Lengkung & Fungsi Kuadrat',
    mataPelajaran: 'Matematika',
    tingkat: 'IX',
    pembuatNama: 'Ahmad Fauzi, M.Pd',
    pembuatId: 'usr_guru_mtk',
    jumlahPilihanGanda: 8,
    jumlahEsai: 2,
    totalBobot: 100,
    keterangan: 'Fokus pemecahan masalah numerik dan penalaran logis',
    created_at: '2026-02-18T10:00:00Z',
  },
];

export const INITIAL_QUESTIONS: QuestionItem[] = [
  // Soal Kelas VII (IPA)
  {
    id: 'q_vii_01',
    bankId: 'bank_ipa_07',
    nomorUrut: 1,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'VII',
    kontenSoal: 'Urutan takson tumbuhan dari tingkat tertinggi sampai terendah yang benar adalah...',
    opsi: [
      { key: 'A', text: 'Kingdom - Divisi - Kelas - Ordo - Famili - Genus - Spesies' },
      { key: 'B', text: 'Kingdom - Filum - Kelas - Ordo - Famili - Genus - Spesies' },
      { key: 'C', text: 'Kingdom - Kelas - Divisi - Ordo - Famili - Genus - Spesies' },
      { key: 'D', text: 'Kingdom - Divisi - Ordo - Kelas - Famili - Genus - Spesies' },
      { key: 'E', text: 'Kingdom - Famili - Kelas - Ordo - Divisi - Genus - Spesies' },
    ],
    kunciJawaban: 'A',
    bobot: 15,
  },
  {
    id: 'q_vii_02',
    bankId: 'bank_ipa_07',
    nomorUrut: 2,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'VII',
    kontenSoal: 'Organel sel yang berfungsi sebagai tempat berlangsungnya respirasi sel untuk menghasilkan energi (ATP) adalah...',
    opsi: [
      { key: 'A', text: 'Ribosom' },
      { key: 'B', text: 'Mitokondria' },
      { key: 'C', text: 'Badan Golgi' },
      { key: 'D', text: 'Retikulum Endoplasma' },
      { key: 'E', text: 'Kloroplas' },
    ],
    kunciJawaban: 'B',
    bobot: 15,
  },
  {
    id: 'q_vii_03',
    bankId: 'bank_ipa_07',
    nomorUrut: 3,
    tipe: 'esai',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'VII',
    kontenSoal: 'Jelaskan perbedaan komponen biotik dan abiotik dalam suatu ekosistem dan berikan masing-masing 3 contoh nyata di lingkungan sekolah!',
    bobot: 20,
    rubrikEsai: 'Skor 20 jika menjelaskan biotik (unsur hidup) dan abiotik (unsur tak hidup) beserta contoh relevan.',
    kataKunciEsai: ['biotik', 'abiotik', 'tumbuhan', 'cahaya', 'air', 'tanah'],
  },

  // Soal Kelas VIII (Matematika)
  {
    id: 'q_viii_01',
    bankId: 'bank_mtk_08',
    nomorUrut: 1,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Matematika',
    tingkat: 'VIII',
    kontenSoal: 'Diketahui suku ke-n barisan aritmetika dinyatakan dengan Un = 4n - 5. Beda (b) dan suku ke-10 (U10) barisan tersebut berturut-turut adalah...',
    opsi: [
      { key: 'A', text: '4 dan 35' },
      { key: 'B', text: '4 dan 40' },
      { key: 'C', text: '-5 dan 35' },
      { key: 'D', text: '5 dan 45' },
      { key: 'E', text: '4 dan 30' },
    ],
    kunciJawaban: 'A',
    bobot: 15,
  },
  {
    id: 'q_viii_02',
    bankId: 'bank_mtk_08',
    nomorUrut: 2,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Matematika',
    tingkat: 'VIII',
    kontenSoal: 'Panjang sisi siku-siku sebuah segitiga adalah 9 cm dan 12 cm. Berapakah panjang sisi miring (hipotenusa) segitiga tersebut menurut Teorema Pythagoras?',
    opsi: [
      { key: 'A', text: '13 cm' },
      { key: 'B', text: '15 cm' },
      { key: 'C', text: '17 cm' },
      { key: 'D', text: '20 cm' },
      { key: 'E', text: '21 cm' },
    ],
    kunciJawaban: 'B',
    bobot: 15,
  },
  {
    id: 'q_viii_03',
    bankId: 'bank_mtk_08',
    nomorUrut: 3,
    tipe: 'esai',
    mataPelajaran: 'Matematika',
    tingkat: 'VIII',
    kontenSoal: 'Sebuah tiang bendera setinggi 12 meter ditambatkan kawat ke tanah dengan jarak titik kawat ke pangkal tiang 5 meter. Hitunglah panjang kawat minimal yang dibutuhkan dengan langkah perhitungan Pythagoras yang lengkap!',
    bobot: 20,
    rubrikEsai: 'Skor 20 jika menuliskan rumus a² + b² = c², substitusi 5² + 12² = 25 + 144 = 169, dan hasil c = 13 meter.',
    kataKunciEsai: ['pythagoras', '169', '13', 'hipotenusa', 'kawat'],
  },

  // Soal Kelas IX (IPA & MTK)
  {
    id: 'q_ipa_01',
    bankId: 'bank_ipa_01',
    nomorUrut: 1,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    kontenSoal: 'Organ reproduksi pria yang berfungsi sebagai tempat pematangan sperma sebelum dikeluarkan melalui vas deferens adalah...',
    opsi: [
      { key: 'A', text: 'Testis' },
      { key: 'B', text: 'Epididimis' },
      { key: 'C', text: 'Vesikula seminalis' },
      { key: 'D', text: 'Kelenjar prostat' },
      { key: 'E', text: 'Uretra' },
    ],
    kunciJawaban: 'B',
    bobot: 7,
  },
  {
    id: 'q_ipa_02',
    bankId: 'bank_ipa_01',
    nomorUrut: 2,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    kontenSoal: 'Jika dua buah muatan listrik masing-masing sebesar +2 μC dan -4 μC terpisah sejauh 3 cm di udara (k = 9 × 10⁹ N.m²/C²), maka gaya tarik-menarik antara kedua muatan tersebut adalah...',
    opsi: [
      { key: 'A', text: '40 Newton' },
      { key: 'B', text: '60 Newton' },
      { key: 'C', text: '80 Newton' },
      { key: 'D', text: '90 Newton' },
      { key: 'E', text: '120 Newton' },
    ],
    kunciJawaban: 'C',
    bobot: 8,
  },
  {
    id: 'q_ipa_03',
    bankId: 'bank_ipa_01',
    nomorUrut: 3,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    kontenSoal: 'Persilangan monohibrid antara kacang ercis berbiji bulat (BB) dengan kacang ercis berbiji kerut (bb) menghasilkan keturunan F1 semuanya berbiji bulat (Bb). Jika sesama F1 disilangkan, persentase fenotipe berbiji kerut pada keturunan F2 adalah...',
    opsi: [
      { key: 'A', text: '100%' },
      { key: 'B', text: '75%' },
      { key: 'C', text: '50%' },
      { key: 'D', text: '25%' },
      { key: 'E', text: '0%' },
    ],
    kunciJawaban: 'D',
    bobot: 7,
  },
  {
    id: 'q_ipa_04',
    bankId: 'bank_ipa_01',
    nomorUrut: 4,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    kontenSoal: 'Penerapan bioteknologi konvensional dalam pembuatan tempe memanfaatkan mikroorganisme berupa jamur...',
    opsi: [
      { key: 'A', text: 'Rhizopus oryzae' },
      { key: 'B', text: 'Saccharomyces cerevisiae' },
      { key: 'C', text: 'Acetobacter xylinum' },
      { key: 'D', text: 'Lactobacillus bulgaricus' },
      { key: 'E', text: 'Aspergillus wentii' },
    ],
    kunciJawaban: 'A',
    bobot: 7,
  },
  {
    id: 'q_ipa_05',
    bankId: 'bank_ipa_01',
    nomorUrut: 5,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    kontenSoal: 'Sebuah lampu dengan daya 60 Watt dinyalakan selama 10 jam setiap hari selama 30 hari. Berapakah besar energi listrik yang digunakan lampu tersebut dalam satuan kWh?',
    opsi: [
      { key: 'A', text: '12 kWh' },
      { key: 'B', text: '18 kWh' },
      { key: 'C', text: '24 kWh' },
      { key: 'D', text: '36 kWh' },
      { key: 'E', text: '60 kWh' },
    ],
    kunciJawaban: 'B',
    bobot: 8,
  },
  {
    id: 'q_ipa_06',
    bankId: 'bank_ipa_01',
    nomorUrut: 6,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    kontenSoal: 'Bagian neuron yang berfungsi menerima rangsangan impuls dari sel saraf lain atau reseptor dan membawanya menuju badan sel disebut...',
    opsi: [
      { key: 'A', text: 'Akson' },
      { key: 'B', text: 'Dendrit' },
      { key: 'C', text: 'Selubung Mielin' },
      { key: 'D', text: 'Nodus Ranvier' },
      { key: 'E', text: 'Sinapsis' },
    ],
    kunciJawaban: 'B',
    bobot: 7,
  },
  {
    id: 'q_ipa_07',
    bankId: 'bank_ipa_01',
    nomorUrut: 7,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    kontenSoal: 'Sifat suatu benda yang tidak dapat ditarik oleh magnet sama sekali disebut...',
    opsi: [
      { key: 'A', text: 'Feromagnetik' },
      { key: 'B', text: 'Paramagnetik' },
      { key: 'C', text: 'Diamagnetik' },
      { key: 'D', text: 'Elektromagnetik' },
      { key: 'E', text: 'Superkonduktor' },
    ],
    kunciJawaban: 'C',
    bobot: 7,
  },
  {
    id: 'q_ipa_08',
    bankId: 'bank_ipa_01',
    nomorUrut: 8,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    kontenSoal: 'Pada trafo step-up, perbandingan jumlah lilitan primer (Np) dan lilitan sekunder (Ns) yang benar adalah...',
    opsi: [
      { key: 'A', text: 'Np > Ns' },
      { key: 'B', text: 'Np < Ns' },
      { key: 'C', text: 'Np = Ns' },
      { key: 'D', text: 'Np = 0' },
      { key: 'E', text: 'Ns = 0' },
    ],
    kunciJawaban: 'B',
    bobot: 7,
  },
  {
    id: 'q_ipa_09',
    bankId: 'bank_ipa_01',
    nomorUrut: 9,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    kontenSoal: 'Teknologi ramah lingkungan yang memanfaatkan kotoran ternak untuk menghasilkan gas metana sebagai sumber energi alternatif disebut...',
    opsi: [
      { key: 'A', text: 'Bioetanol' },
      { key: 'B', text: 'Biogas' },
      { key: 'C', text: 'Biodiesel' },
      { key: 'D', text: 'Geotermal' },
      { key: 'E', text: 'Hidrogen fuel' },
    ],
    kunciJawaban: 'B',
    bobot: 7,
  },
  {
    id: 'q_ipa_10',
    bankId: 'bank_ipa_01',
    nomorUrut: 10,
    tipe: 'pilihan_ganda',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    kontenSoal: 'Zat kimia yang digunakan petani untuk memberantas hama tanaman namun dapat menyebabkan bioakumulasi pada rantai makanan adalah...',
    opsi: [
      { key: 'A', text: 'Pupuk Kompos' },
      { key: 'B', text: 'Pestisida Sintetik (DDT)' },
      { key: 'C', text: 'Pupuk Guano' },
      { key: 'D', text: 'Kapur Dolomit' },
      { key: 'E', text: 'Bakteri Rhizobium' },
    ],
    kunciJawaban: 'B',
    bobot: 7,
  },
  // Esai
  {
    id: 'q_ipa_esai_01',
    bankId: 'bank_ipa_01',
    nomorUrut: 11,
    tipe: 'esai',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    kontenSoal: 'Jelaskan tahapan proses fertilisasi pada manusia mulai dari pelepasan ovum di ovarium hingga terjadinya implantasi di dinding rahim!',
    bobot: 15,
    rubrikEsai: 'Skor 15: Menjelaskan ovulasi, perjalanan di tuba falopi, peleburan inti sperma dan ovum membentuk zigot, pembelahan morula/blastokista, hingga nidasi/implantasi di endometrium dengan akurat.',
    kataKunciEsai: ['ovulasi', 'tuba falopi', 'fertilisasi', 'zigot', 'implantasi', 'endometrium'],
  },
  {
    id: 'q_ipa_esai_02',
    bankId: 'bank_ipa_01',
    nomorUrut: 12,
    tipe: 'esai',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    kontenSoal: 'Sebutkan 3 perbedaan mendasar antara Bioteknologi Konvensional dan Bioteknologi Modern beserta contoh produk masing-masing!',
    bobot: 15,
    rubrikEsai: 'Skor 15: Menyebutkan aspek teknik (fermentasi vs rekayasa genetika/DNA rekombinan), peralatan/sterilitas (sederhana vs steril canggih), dan contoh produk nyata (tempe/tape vs vaksin/insulin/tanaman transgenik).',
    kataKunciEsai: ['rekayasa genetika', 'fermentasi', 'DNA rekombinan', 'tempe', 'insulin', 'steril'],
  },
];

export const INITIAL_EXAM_SCHEDULES: ExamSchedule[] = [
  {
    id: 'sch_ipa_07',
    bankId: 'bank_ipa_07',
    namaUjian: 'Asesmen Harian IPA Terpadu Kelas VII',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'VII',
    durasiMenit: 60,
    waktuMulai: '2026-03-01T07:30:00Z',
    waktuSelesai: '2026-03-01T09:30:00Z',
    tokenUjian: 'IPA7BA',
    tokenAktif: true,
    acakSoal: true,
    acakOpsi: false,
    tampilkanNilaiLangsung: true,
    pengawasNama: 'Dra. Sri Wahyuni',
    ruang: 'Lab Komputer 1, 2 & Ruang CBT 01',
    status: 'aktif',
  },
  {
    id: 'sch_mtk_08',
    bankId: 'bank_mtk_08',
    namaUjian: 'Penilaian Tengah Semester Matematika Kelas VIII',
    mataPelajaran: 'Matematika',
    tingkat: 'VIII',
    durasiMenit: 90,
    waktuMulai: '2026-03-01T08:00:00Z',
    waktuSelesai: '2026-03-01T10:00:00Z',
    tokenUjian: 'MTK8BA',
    tokenAktif: true,
    acakSoal: true,
    acakOpsi: true,
    tampilkanNilaiLangsung: true,
    pengawasNama: 'Ahmad Fauzi, M.Pd',
    ruang: 'Lab Komputer 3 & Ruang Multimedia 1',
    status: 'aktif',
  },
  {
    id: 'sch_ipa_01',
    bankId: 'bank_ipa_01',
    namaUjian: 'Penilaian Akhir Semester (PAS) IPA Kelas IX',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX',
    durasiMenit: 60,
    waktuMulai: '2026-03-01T07:30:00Z',
    waktuSelesai: '2026-03-01T09:30:00Z',
    tokenUjian: 'SMP01B',
    tokenAktif: true,
    acakSoal: true,
    acakOpsi: false,
    tampilkanNilaiLangsung: true,
    pengawasNama: 'Rudi Santoso, S.Kom',
    ruang: 'Lab Komputer 1 & 2',
    status: 'aktif',
  },
  {
    id: 'sch_mtk_01',
    bankId: 'bank_mtk_01',
    namaUjian: 'Ujian Harian Matematika Kelas IX (Fungsi Kuadrat)',
    mataPelajaran: 'Matematika',
    tingkat: 'IX',
    durasiMenit: 90,
    waktuMulai: '2026-03-02T08:00:00Z',
    waktuSelesai: '2026-03-02T10:00:00Z',
    tokenUjian: 'MAT9IX',
    tokenAktif: false,
    acakSoal: false,
    acakOpsi: false,
    tampilkanNilaiLangsung: true,
    pengawasNama: 'Ahmad Fauzi, M.Pd',
    ruang: 'Ruang Multimedia 1',
    status: 'draft',
  },
];

// Helper to seed active exam sessions for proctor monitoring demo across Kelas VII, VIII, and IX
export function generateInitialExamSessions(students: UserProfile[]): ExamSession[] {
  const viiStudents = students.filter((s) => s.tingkat === 'VII').slice(0, 30);
  const viiiStudents = students.filter((s) => s.tingkat === 'VIII').slice(0, 30);
  const ixStudents = students.filter((s) => s.tingkat === 'IX').slice(0, 30);

  const gradeConfigs = [
    { list: viiStudents, scheduleId: 'sch_ipa_07' },
    { list: viiiStudents, scheduleId: 'sch_mtk_08' },
    { list: ixStudents, scheduleId: 'sch_ipa_01' },
  ];

  const sessions: ExamSession[] = [];

  gradeConfigs.forEach(({ list, scheduleId }) => {
    list.forEach((std, idx) => {
      let status: ExamSession['status'] = 'mengerjakan';
      let sisaWaktu = 3600 - idx * 45;
      let pindahTab = 0;
      let statusKoreksi: ExamSession['statusKoreksi'] = 'menunggu_koreksi_guru';
      let pgScore: number | undefined = undefined;
      let esaiScore: number | undefined = undefined;
      let totalScore: number | undefined = undefined;

      if (idx < 5) {
        status = 'selesai';
        sisaWaktu = 0;
        pgScore = 65 + (idx % 6) * 3;
        esaiScore = 18 + (idx % 4) * 2;
        totalScore = pgScore + esaiScore;
        statusKoreksi = 'tuntas_dinilai';
      } else if (idx === 7 || idx === 19) {
        status = 'terkendala';
        pindahTab = 3;
      } else if (idx % 6 === 0) {
        status = 'ragu';
      }

      sessions.push({
        id: `ses_${std.id}`,
        scheduleId,
        siswaId: std.id,
        siswaNama: std.nama,
        siswaNisn: std.username,
        siswaKelas: std.kelas || `${std.tingkat}-A`,
        ruangUjian: std.ruangUjian || 'Lab Komputer 1',
        waktuMulai: new Date(Date.now() - (3600 - Math.max(0, sisaWaktu)) * 1000).toISOString(),
        sisaWaktuDetik: sisaWaktu > 0 ? sisaWaktu : 0,
        status,
        jumlahPindahTab: pindahTab,
        terakhirAutosave: new Date().toISOString(),
        nilaiPilihanGanda: pgScore,
        nilaiEsai: esaiScore,
        nilaiTotal: totalScore,
        statusKoreksi,
        ipAddress: `192.168.10.${100 + (sessions.length % 150)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
      });
    });
  });

  return sessions;
}
