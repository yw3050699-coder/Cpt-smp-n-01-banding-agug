import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, ExamSession, ExamSchedule } from '../types';

// Initialize Firebase App instance safely (singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory cache for access token (never stored in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token dari Google Sign-In.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface SyncToSheetsResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  totalSynced: number;
  totalPresent: number;
  totalAbsent: number;
  syncedAt: string;
  message?: string;
}

/**
 * Creates a dedicated Google Spreadsheet or returns existing from cache/Drive
 */
export async function createExamSpreadsheet(
  title: string,
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // Check if we already have an existing spreadsheetId stored in memory or storage
  const savedId = localStorage.getItem('epoting_google_sheet_id');
  if (savedId) {
    try {
      const checkRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${savedId}?fields=spreadsheetId`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (checkRes.ok) {
        return {
          spreadsheetId: savedId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${savedId}`,
        };
      }
    } catch {
      // spreadsheet deleted or unshared, create fresh one
    }
  }

  // Create fresh spreadsheet with predefined sheet tabs
  const createPayload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Rekap Presensi & Nilai',
          gridProperties: { rowCount: 1200, columnCount: 16, frozenRowCount: 4 },
        },
      },
      {
        properties: {
          title: 'Daftar Siswa Tidak Hadir',
          gridProperties: { rowCount: 500, columnCount: 10, frozenRowCount: 4 },
        },
      },
      {
        properties: {
          title: 'Statistik & Ringkasan Rombel',
          gridProperties: { rowCount: 50, columnCount: 8, frozenRowCount: 4 },
        },
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!res.ok) {
    const errorJson = await res.json();
    throw new Error(
      errorJson?.error?.message || 'Gagal membuat Google Spreadsheet baru di Google Drive.'
    );
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  localStorage.setItem('epoting_google_sheet_id', spreadsheetId);

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

/**
 * Uploads and formats exam attendance and score records directly into Google Sheets
 */
export async function exportExamDataToGoogleSheets(params: {
  schedule: ExamSchedule;
  students: UserProfile[];
  sessions: ExamSession[];
  attendanceRecords?: Array<{
    nisn: string;
    nama: string;
    kelas: string;
    status: string;
    waktuPresensi?: string;
    metode?: string;
  }>;
}): Promise<SyncToSheetsResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Anda belum terhubung ke Google Workspace. Silakan masuk terlebih dahulu.');
  }

  const { schedule, students, sessions, attendanceRecords = [] } = params;
  const nowStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const spreadsheetTitle = `E-POTING CBT - ${schedule.namaUjian} (${schedule.tingkat}) - SMPN 01 Banding Agung`;
  const { spreadsheetId, spreadsheetUrl } = await createExamSpreadsheet(spreadsheetTitle, token);

  // Map attendance dictionary for quick lookup
  const attendanceMap = new Map<string, { status: string; waktu?: string; metode?: string }>();
  attendanceRecords.forEach((att) => {
    attendanceMap.set(att.nisn, {
      status: att.status,
      waktu: att.waktuPresensi,
      metode: att.metode,
    });
  });

  // Map sessions dictionary
  const sessionMap = new Map<string, ExamSession>();
  sessions.forEach((s) => {
    sessionMap.set(s.siswaNisn, s);
  });

  // Separate participants into present vs absent
  const presentRows: any[][] = [];
  const absentRows: any[][] = [];

  let totalPresent = 0;
  let totalAbsent = 0;

  students.forEach((std, idx) => {
    const sess = sessionMap.get(std.username);
    const att = attendanceMap.get(std.username);

    const isPresent =
      att?.status === 'hadir' ||
      sess?.status === 'mengerjakan' ||
      sess?.status === 'selesai' ||
      sess?.status === 'ragu';

    const pgScore = sess?.nilaiPilihanGanda ?? '-';
    const esaiScore = sess?.nilaiEsai ?? '-';
    const totalScore = sess?.nilaiTotal ?? '-';
    const statusKetuntasan =
      typeof totalScore === 'number'
        ? totalScore >= 75
          ? 'TUNTAS (≥75)'
          : 'BELUM TUNTAS (<75)'
        : 'MENUNGGU UJIAN';

    const statusUjianLabel = sess
      ? sess.status === 'selesai'
        ? 'Selesai Ujian'
        : sess.status === 'mengerjakan'
        ? 'Sedang Mengerjakan'
        : sess.status === 'ragu'
        ? 'Ada Ragu-ragu'
        : sess.status === 'terkendala'
        ? 'Terkendala / Pelanggaran'
        : 'Siap Login'
      : isPresent
      ? 'Hadir (Belum Memulai)'
      : 'TIDAK HADIR';

    const presensiMetodeLabel = att?.metode === 'barcode_scanner'
      ? 'Scan Barcode / Kamera'
      : att?.metode === 'manual'
      ? 'Presensi Manual'
      : isPresent
      ? 'Presensi Sistem CBT'
      : 'Belum Presensi';

    if (isPresent) {
      totalPresent++;
      presentRows.push([
        totalPresent,
        std.username, // NISN
        std.nomorPeserta || '-',
        std.nama,
        std.kelas || '-',
        std.tingkat || '-',
        std.ruangUjian || '-',
        statusUjianLabel,
        'HADIR',
        att?.waktu || sess?.waktuMulai || '-',
        presensiMetodeLabel,
        pgScore,
        esaiScore,
        totalScore,
        statusKetuntasan,
        sess?.jumlahPindahTab || 0,
      ]);
    } else {
      totalAbsent++;
      absentRows.push([
        totalAbsent,
        std.username,
        std.nomorPeserta || '-',
        std.nama,
        std.kelas || '-',
        std.tingkat || '-',
        std.ruangUjian || '-',
        'TIDAK HADIR / ABSEN',
        'Belum Memasuki Ruang Ujian',
        'Hubungi Panitia / Wali Kelas',
      ]);
    }
  });

  // Header 1: Metadata Banner
  const sheet1Values = [
    ['SMP NEGERI 01 BANDING AGUNG - KABUPATEN OKU SELATAN'],
    [`REKAPITULASI HASIL ASESMEN UJIAN ONLINE & PRESENSI SISWA: ${schedule.namaUjian}`],
    [
      `Mata Pelajaran: ${schedule.mataPelajaran}`,
      `Tingkat: Kelas ${schedule.tingkat}`,
      `Token: ${schedule.tokenUjian}`,
      `Waktu Sinkronisasi: ${nowStr}`,
      `Total Siswa: ${students.length}`,
      `Hadir: ${totalPresent}`,
      `Tidak Hadir: ${totalAbsent}`,
    ],
    [
      'No',
      'NISN',
      'Nomor Peserta',
      'Nama Siswa',
      'Kelas',
      'Tingkat',
      'Ruang Ujian',
      'Status Ujian',
      'Status Kehadiran',
      'Waktu Presensi',
      'Metode Presensi',
      'Nilai PG',
      'Nilai Esai',
      'Nilai Total',
      'Ketuntasan KKM',
      'Pelanggaran Tab',
    ],
    ...presentRows,
  ];

  const sheet2Values = [
    ['SMP NEGERI 01 BANDING AGUNG - DAFTAR SISWA TIDAK HADIR'],
    [`Ujian: ${schedule.namaUjian} | Waktu Ekspor: ${nowStr}`],
    [`Total Siswa Tidak Hadir: ${totalAbsent} Siswa dari ${students.length} Siswa Terdaftar`],
    [
      'No',
      'NISN',
      'Nomor Peserta',
      'Nama Siswa',
      'Kelas',
      'Tingkat',
      'Ruang Ujian',
      'Status Presensi',
      'Keterangan',
      'Tindak Lanjut Pengawas',
    ],
    ...(absentRows.length > 0
      ? absentRows
      : [['-', '-', '-', 'SEMUA SISWA HADIR (100% KEHADIRAN)', '-', '-', '-', '-', '-', '-']]),
  ];

  // Batch update spreadsheet data
  const batchData = [
    {
      range: "'Rekap Presensi & Nilai'!A1:P" + (sheet1Values.length + 1),
      values: sheet1Values,
    },
    {
      range: "'Daftar Siswa Tidak Hadir'!A1:J" + (sheet2Values.length + 1),
      values: sheet2Values,
    },
  ];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err?.error?.message || 'Gagal memperbarui sel data di Google Sheets.');
  }

  // Save last sync info
  const syncResult: SyncToSheetsResult = {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    totalSynced: students.length,
    totalPresent,
    totalAbsent,
    syncedAt: nowStr,
    message: `Berhasil menyinkronkan data ${students.length} siswa ke Google Sheets (${totalPresent} hadir, ${totalAbsent} tidak hadir).`,
  };

  localStorage.setItem('epoting_last_sheets_sync', JSON.stringify(syncResult));
  return syncResult;
}
