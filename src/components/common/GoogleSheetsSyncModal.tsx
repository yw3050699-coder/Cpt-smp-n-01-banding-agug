import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  googleLogout,
  exportExamDataToGoogleSheets,
  SyncToSheetsResult,
} from '../../lib/googleSheets';
import { UserProfile, ExamSession, ExamSchedule } from '../../types';
import {
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Users,
  ShieldCheck,
  Calendar,
  X,
  FileCheck,
  Check,
} from 'lucide-react';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  schedule,
  students,
  sessions,
  attendanceRecords = [],
}) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncToSheetsResult | null>(() => {
    try {
      const raw = localStorage.getItem('epoting_last_sheets_sync');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setHasToken(!!token);
      },
      () => {
        setGoogleUser(null);
        setHasToken(false);
      }
    );
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsAuthenticating(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setHasToken(true);
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Login dengan Google gagal. Pastikan jendela popup diizinkan pada browser.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleLogout();
      setGoogleUser(null);
      setHasToken(false);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Trigger sync with explicit user confirmation as mandated by Workspace skill
  const executeSync = async () => {
    setShowConfirmDialog(false);
    setErrorMsg('');
    setIsSyncing(true);

    try {
      const res = await exportExamDataToGoogleSheets({
        schedule,
        students,
        sessions,
        attendanceRecords,
      });
      setSyncResult(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat mengekspor data ke Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Sinkronisasi Database ke Google Sheets
              </h2>
              <p className="text-xs text-slate-300">
                Presensi Peserta Ujian, Siswa Tidak Hadir & Rekap Nilai Otomatis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs text-slate-700">
          {/* Google Auth Status Strip */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Status Akun Google Workspace:
              </span>
              {googleUser ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Terhubung
                </span>
              ) : (
                <span className="text-slate-500 text-[11px]">Belum Masuk</span>
              )}
            </div>

            {googleUser ? (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'Google User'}
                      className="w-8 h-8 rounded-full border border-slate-300"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                      {(googleUser.displayName || 'G')[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">
                      {googleUser.displayName || 'Pengguna Google'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">{googleUser.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-rose-600 hover:bg-slate-200/60 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <p className="text-slate-600 leading-relaxed">
                  Hubungkan akun Google Anda untuk mengizinkan sistem mengekspor data absensi dan nilai siswa langsung ke akun Google Drive Anda.
                </p>

                {/* Official Material Google Sign-In Button */}
                <button
                  type="button"
                  disabled={isAuthenticating}
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                  <span>{isAuthenticating ? 'Membuka Google Sign-In...' : 'Masuk dengan Google (Sign in with Google)'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Target Exam Info */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <h3 className="font-bold text-slate-900 text-xs flex items-center justify-between">
              <span>Paket Data Ujian yang Disinkronkan:</span>
              <span className="text-blue-700 font-mono text-[11px] font-semibold">
                {schedule.namaUjian}
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
              <div>
                <span className="text-slate-400">Tingkat Kelas:</span>{' '}
                <strong className="text-slate-800">Kelas {schedule.tingkat}</strong>
              </div>
              <div>
                <span className="text-slate-400">Total Siswa Terdaftar:</span>{' '}
                <strong className="text-slate-800">{students.length} Siswa</strong>
              </div>
              <div>
                <span className="text-slate-400">Mata Pelajaran:</span>{' '}
                <strong className="text-slate-800">{schedule.mataPelajaran}</strong>
              </div>
              <div>
                <span className="text-slate-400">Status Sesi:</span>{' '}
                <strong className="text-emerald-700">{sessions.length} Sesi Terbuka</strong>
              </div>
            </div>
          </div>

          {/* Sheets Structure Preview */}
          <div className="space-y-2 text-[11px]">
            <span className="font-semibold text-slate-700 block">
              Struktur Tab Spreadsheet yang Dihasilkan di Google Drive:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="font-bold text-emerald-800 block">Tab 1: Rekap Presensi & Nilai</span>
                <span className="text-slate-500 text-[10px]">
                  Memuat NISN, Nama, Rombel, Ruang, Status Kehadiran, Waktu Presensi, Nilai PG, Nilai Esai, dan Ketuntasan KKM.
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="font-bold text-rose-800 block">Tab 2: Daftar Siswa Tidak Hadir</span>
                <span className="text-slate-500 text-[10px]">
                  Daftar otomatis siswa yang belum/tidak mengikuti ujian agar pengawas & wali kelas segera menindaklanjuti.
                </span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Last Sync Result Badge & Direct Link */}
          {syncResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Sinkronisasi Terakhir Berhasil
                </span>
                <span className="text-[10px] text-emerald-700 font-mono">
                  {syncResult.syncedAt}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">{syncResult.message}</p>

              <div className="flex items-center gap-3 pt-1">
                <a
                  href={syncResult.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Spreadsheet di Google Sheets</span>
                </a>
                <span className="text-[10px] text-emerald-700 font-mono">
                  ID: {syncResult.spreadsheetId.substring(0, 14)}...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
          >
            Tutup
          </button>

          <button
            type="button"
            disabled={!hasToken || isSyncing}
            onClick={() => setShowConfirmDialog(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyinkronkan ke Google Sheets...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>Kirim & Sinkronkan Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Destructive / Mutating Operation */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FileCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm">
                Konfirmasi Sinkronisasi Google Sheets
              </h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem akan membuat atau memperbarui spreadsheet{' '}
              <strong>"E-POTING CBT - {schedule.namaUjian}"</strong> di akun Google Drive Anda{' '}
              (<em>{googleUser?.email}</em>) dengan data presensi terkini ({students.length} siswa), daftar yang hadir & tidak hadir, serta perolehan nilai CBT.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
              *Tindakan ini akan menimpa sel data pada tab presensi & nilai di spreadsheet terkait.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeSync}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Ya, Sinkronkan Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
