import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { UserProfile, ExamSchedule, ExamSession } from '../../types';
import { TutWuriLogo } from '../common/TutWuriLogo';
import { BarcodeSvg, QrCodeComponent } from '../common/BarcodeSvg';
import { GoogleSheetsSyncModal } from '../common/GoogleSheetsSyncModal';
import {
  Scan,
  CheckCircle2,
  AlertCircle,
  Camera,
  CameraOff,
  Printer,
  RotateCcw,
  Users,
  Search,
  CheckCheck,
  UserCheck,
  Sparkles,
  Volume2,
  FileSpreadsheet,
  FlipHorizontal,
  Video,
  Keyboard,
  ShieldCheck,
} from 'lucide-react';

interface AttendanceRecord {
  siswaId: string;
  nisn: string;
  nama: string;
  kelas: string;
  nomorPeserta: string;
  ruangUjian: string;
  status: 'hadir' | 'belum_hadir' | 'izin' | 'terlambat';
  waktuPresensi?: string;
  metode: 'kamera_scanner' | 'barcode_scanner' | 'manual';
}

interface BarcodeAttendanceScannerProps {
  students: UserProfile[];
  schedule: ExamSchedule;
  sessions?: ExamSession[];
  onRefreshData?: () => void;
}

export const BarcodeAttendanceScanner: React.FC<BarcodeAttendanceScannerProps> = ({
  students,
  schedule,
  sessions = [],
}) => {
  // Filter students for current exam grade (e.g. VII, VIII, IX)
  const examStudents = students
    .filter((s) => !schedule.tingkat || s.tingkat === schedule.tingkat)
    .slice(0, 60);

  const STORAGE_KEY = `epoting_attendance_${schedule.id}`;

  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Initial pre-seed: 35 already scanned, rest pending
    return examStudents.map((std, idx) => ({
      siswaId: std.id,
      nisn: std.username,
      nama: std.nama,
      kelas: std.kelas || `${std.tingkat || 'IX'}-A`,
      nomorPeserta: std.nomorPeserta || `01-${std.tingkat === 'VII' ? '07' : std.tingkat === 'VIII' ? '08' : '09'}-${String(idx + 1).padStart(3, '0')}`,
      ruangUjian: std.ruangUjian || 'Lab Komputer 1',
      status: idx < 36 ? 'hadir' : 'belum_hadir',
      waktuPresensi:
        idx < 36
          ? `07:${String(15 + (idx % 25)).padStart(2, '0')}:${String((idx * 7) % 60).padStart(2, '0')} WIB`
          : undefined,
      metode: 'barcode_scanner',
    }));
  });

  // Scanner Modes: 'camera' vs 'usb_input'
  const [scanMode, setScanMode] = useState<'camera' | 'usb_input'>('camera');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScanned, setLastScanned] = useState<AttendanceRecord | null>(null);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'hadir' | 'belum_hadir'>('ALL');
  const [showPrintSheet, setShowPrintSheet] = useState(false);
  const [showGoogleSheetsModal, setShowGoogleSheetsModal] = useState(false);

  // Camera Scanner States
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  // Play audio beep on successful barcode scan using Web Audio API
  const playScanBeep = (isSuccess = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isSuccess ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 320, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio context blocked or unsupported
    }
  };

  const saveAttendance = (updated: AttendanceRecord[]) => {
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Process barcode or QR code string
  const processBarcodeScan = (code: string, isFromCamera = false) => {
    const cleanCode = code.trim().replace(/\*/g, '');
    if (!cleanCode) return;

    // Cooldown check for camera scans (2 seconds threshold for same code)
    const now = Date.now();
    if (
      isFromCamera &&
      cleanCode === lastScannedCodeRef.current &&
      now - lastScannedTimeRef.current < 2500
    ) {
      return;
    }
    lastScannedCodeRef.current = cleanCode;
    lastScannedTimeRef.current = now;

    // Search record by NISN or nomorPeserta
    const idx = records.findIndex(
      (r) =>
        r.nisn === cleanCode ||
        r.nomorPeserta === cleanCode ||
        cleanCode.includes(r.nisn)
    );

    if (idx !== -1) {
      const target = records[idx];
      const nowTime =
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB';

      const updated = [...records];
      updated[idx] = {
        ...target,
        status: 'hadir',
        waktuPresensi: nowTime,
        metode: isFromCamera ? 'kamera_scanner' : 'barcode_scanner',
      };

      saveAttendance(updated);
      setLastScanned(updated[idx]);
      setScanMessage({
        type: 'success',
        text: `Presensi Terverifikasi! ${target.nama} (${target.kelas}) terdata ${
          isFromCamera ? 'melalui Kamera' : 'melalui Barcode'
        } pada ${nowTime}.`,
      });
      playScanBeep(true);
    } else {
      setScanMessage({
        type: 'error',
        text: `Barcode / QR "${cleanCode}" tidak terdaftar dalam ruang ujian ini!`,
      });
      playScanBeep(false);
    }

    setBarcodeInput('');
    if (!isFromCamera && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Setup Camera via @zxing/library
  useEffect(() => {
    if (scanMode !== 'camera' || !isCameraActive) {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      return;
    }

    let isSubscribed = true;
    const reader = new BrowserMultiFormatReader();
    codeReaderRef.current = reader;

    reader
      .listVideoInputDevices()
      .then((videoInputDevices) => {
        if (!isSubscribed) return;
        setAvailableCameras(videoInputDevices);
        if (videoInputDevices.length === 0) {
          setCameraError('Tidak ada perangkat kamera / webcam yang terdeteksi di gawai ini.');
          return;
        }

        // Prefer environment/back camera if available, or first device
        const targetDevice =
          selectedCameraId ||
          videoInputDevices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'))?.deviceId ||
          videoInputDevices[0].deviceId;

        setSelectedCameraId(targetDevice);
        setCameraError(null);

        if (videoRef.current) {
          reader.decodeFromVideoDevice(
            targetDevice,
            videoRef.current,
            (result, err) => {
              if (!isSubscribed) return;
              if (result) {
                processBarcodeScan(result.getText(), true);
              }
            }
          );
        }
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.warn('Camera initiation notice:', err);
        setCameraError('Akses kamera tidak diizinkan atau sedang dipakai aplikasi lain.');
      });

    return () => {
      isSubscribed = false;
      if (reader) {
        reader.reset();
      }
    };
  }, [scanMode, isCameraActive, selectedCameraId]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcodeScan(barcodeInput, false);
  };

  const handleMarkAllPresent = () => {
    const nowTime =
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB';
    const updated = records.map((r) => ({
      ...r,
      status: 'hadir' as const,
      waktuPresensi: r.waktuPresensi || nowTime,
      metode: 'manual' as const,
    }));
    saveAttendance(updated);
  };

  const handleResetAttendance = () => {
    if (confirm('Reset seluruh data absensi ruang ujian ini?')) {
      const reset = records.map((r) => ({
        ...r,
        status: 'belum_hadir' as const,
        waktuPresensi: undefined,
      }));
      saveAttendance(reset);
      setLastScanned(null);
      setScanMessage(null);
    }
  };

  // Metrics
  const totalCount = records.length;
  const presentCount = records.filter((r) => r.status === 'hadir').length;
  const absentCount = totalCount - presentCount;
  const presentRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const filteredRecords = records.filter((r) => {
    const matchSearch =
      r.nama.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.nisn.includes(searchFilter) ||
      r.nomorPeserta.includes(searchFilter) ||
      r.kelas.toLowerCase().includes(searchFilter.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Tut Wuri Handayani Logo & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl shrink-0">
            <TutWuriLogo className="w-12 h-12" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-600 font-bold uppercase tracking-wider block">
                Sistem Presensi CBT Berbasis Barcode & Kamera
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold font-mono">
                Google Sheets Ready
              </span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
              SMP Negeri 01 Banding Agung · OKU Selatan
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {schedule.namaUjian} · Alokasi: <strong>{schedule.ruang}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Button Sinkron Google Sheets */}
          <button
            onClick={() => setShowGoogleSheetsModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Kirim ke Google Sheets</span>
          </button>

          <button
            onClick={() => setShowPrintSheet(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Lembar Presensi</span>
          </button>

          <button
            onClick={handleMarkAllPresent}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Hadirkan Semua</span>
          </button>

          <button
            onClick={handleResetAttendance}
            title="Reset absensi"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Total Peserta Terdaftar</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {totalCount} Siswa
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Ruang Lab Ujian</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Peserta Hadir (Terscan)</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
            {presentCount} Siswa
          </span>
          <span className="text-[11px] text-emerald-700 block mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tingkat Hadir {presentRate}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Belum Hadir / Absen</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">
            {absentCount} Siswa
          </span>
          <span className="text-[11px] text-amber-700 block mt-1">Terekam di Google Sheets</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Metode Scanner Aktif</span>
          <span className="text-xl font-bold text-blue-600 mt-1 flex items-center gap-1.5">
            {scanMode === 'camera' ? 'Kamera Live' : 'Scanner USB'}
          </span>
          <span className="text-[11px] text-blue-700 block mt-1 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            Audio Beep Konfirmasi
          </span>
        </div>
      </div>

      {/* Scanner Control Deck: Mode Camera vs USB Barcode */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Realtime Scanner Arena */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Scan className="w-4 h-4 text-blue-600" />
                Terminal Presensi Otomatis Kartu Peserta
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dekatkan kartu ujian ber-barcode atau QR ke kamera webcam atau scanner USB:
              </p>
            </div>

            {/* Mode Toggle: Kamera vs USB Input */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setScanMode('camera')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  scanMode === 'camera'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Kamera Live (Webcam)</span>
              </button>
              <button
                type="button"
                onClick={() => setScanMode('usb_input')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  scanMode === 'usb_input'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Scanner USB / Ketik</span>
              </button>
            </div>
          </div>

          {/* MODE 1: LIVE WEBCAM SCANNER */}
          {scanMode === 'camera' ? (
            <div className="space-y-3">
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video max-h-72 flex items-center justify-center border-2 border-slate-800 shadow-inner">
                {/* Video element for ZXing */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Animated Targeting Reticle & Laser */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-56 h-36 border-2 border-emerald-400/80 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                    {/* Animated Scanning Laser Line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-bounce duration-1000 top-1/2" />
                  </div>
                </div>

                {/* Top overlay indicator */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-3 py-1 rounded-full flex items-center gap-2 border border-slate-700/60 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Kamera Memindai Barcode / QR...</span>
                </div>

                {/* Camera Switcher */}
                {availableCameras.length > 1 && (
                  <div className="absolute top-3 right-3">
                    <select
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer"
                    >
                      {availableCameras.map((cam, idx) => (
                        <option key={cam.deviceId || idx} value={cam.deviceId}>
                          {cam.label || `Kamera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white space-y-2">
                    <CameraOff className="w-10 h-10 text-amber-400" />
                    <p className="text-xs font-semibold">{cameraError}</p>
                    <p className="text-[11px] text-slate-400">
                      Anda tetap dapat menggunakan tombol simulasi cepat atau mode scanner USB di bawah.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>*Arahkan kode barcode atau QR kartu ujian tepat ke dalam kotak bidik hijau.</span>
                <span className="text-emerald-700 font-semibold font-mono">Auto-Detect Aktif</span>
              </div>
            </div>
          ) : (
            /* MODE 2: USB BARCODE SCANNER / INPUT MANUAL */
            <form onSubmit={handleBarcodeSubmit} className="space-y-3">
              <div className="relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  autoFocus
                  placeholder="Arahkan scanner laser ke barcode kartu siswa atau ketik NISN (contoh: 0081000001)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-blue-500 focus:border-blue-600 focus:bg-white rounded-xl py-3 px-4 font-mono text-sm tracking-wider focus:outline-none transition-all shadow-2xs"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Scan Barcode
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                *Tekan Enter setelah scan barcode atau biarkan barcode scanner USB mengirimkan karakter otomatis.
              </p>
            </form>
          )}

          {/* Feedback Alert */}
          {scanMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
                scanMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              {scanMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{scanMessage.text}</span>
            </div>
          )}

          {/* Quick Simulation Chips */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Uji Coba Presensi Cepat (Klik salah satu kartu untuk menyimulasikan deteksi):
            </span>
            <div className="flex flex-wrap gap-2">
              {records.slice(0, 6).map((r) => (
                <button
                  key={r.siswaId}
                  type="button"
                  onClick={() => processBarcodeScan(r.nisn, false)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                    r.status === 'hadir'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <span className="font-bold">{r.nisn}</span>
                  <span className="text-slate-400 font-sans truncate max-w-[100px]">{r.nama}</span>
                  {r.status === 'hadir' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Last Scanned Student Card Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Siswa Terakhir Terverifikasi
            </h3>
            {lastScanned && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                PRESENSI SAH
              </span>
            )}
          </div>

          {lastScanned ? (
            <div className="space-y-4">
              <div className="border-2 border-slate-900 rounded-xl p-4 bg-white text-xs space-y-3 relative shadow-xs">
                {/* Header Tut Wuri Handayani */}
                <div className="flex items-center gap-2.5 border-b border-slate-300 pb-2">
                  <TutWuriLogo className="w-10 h-10 shrink-0" />
                  <div className="flex-1 leading-tight">
                    <p className="font-extrabold text-[11px] uppercase tracking-tight text-slate-900">
                      KARTU PESERTA CBT ONLINE
                    </p>
                    <p className="text-[9px] text-blue-700 font-bold uppercase">
                      SMP NEGERI 01 BANDING AGUNG
                    </p>
                  </div>
                  <QrCodeComponent value={lastScanned.nisn} size={40} />
                </div>

                <div className="space-y-1 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Lengkap:</span>
                    <strong className="text-slate-900">{lastScanned.nama}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NISN Siswa:</span>
                    <strong className="font-mono text-blue-700">{lastScanned.nisn}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Peserta:</span>
                    <strong className="font-mono text-slate-800">{lastScanned.nomorPeserta}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kelas / Rombel:</span>
                    <span className="font-semibold text-slate-900">{lastScanned.kelas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ruang Ujian:</span>
                    <span className="font-medium text-slate-700">{lastScanned.ruangUjian}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Metode Presensi:</span>
                    <span className="font-semibold text-emerald-700">
                      {lastScanned.metode === 'kamera_scanner'
                        ? 'Scan Kamera (Webcam)'
                        : 'Scan Barcode USB'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu Presensi:</span>
                    <strong className="text-emerald-700 font-mono">{lastScanned.waktuPresensi}</strong>
                  </div>
                </div>

                <div className="pt-1 flex flex-col items-center">
                  <BarcodeSvg value={lastScanned.nisn} height={24} className="w-full" />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Instruksi Pengawas:
                </span>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Peserta berhak menempati komputer di <strong>{lastScanned.ruangUjian}</strong>. Token ujian sesi ini adalah{' '}
                  <strong className="font-mono font-bold bg-white px-1 rounded">{schedule.tokenUjian}</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl space-y-2">
              <Camera className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">Belum ada barcode yang terscan</p>
              <p className="text-[11px] text-slate-400">
                Arahkan kartu ujian siswa ke webcam atau gunakan barcode scanner USB.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Realtime Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Daftar Hadir Peserta Ujian Ruang Ini ({schedule.ruang})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredRecords.length} dari {totalCount} peserta ujian
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama, NISN, no peserta..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-56"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 text-xs bg-slate-50">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white font-bold text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('hadir')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'hadir'
                    ? 'bg-white font-bold text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hadir ({presentCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('belum_hadir')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'belum_hadir'
                    ? 'bg-white font-bold text-amber-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belum ({absentCount})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">No. Peserta</th>
                <th className="py-3 px-4">NISN Siswa</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Status Presensi</th>
                <th className="py-3 px-4">Waktu & Metode</th>
                <th className="py-3 px-4 text-center">Barcode Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada data peserta yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={r.siswaId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{r.nomorPeserta}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{r.nisn}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.nama}</td>
                    <td className="py-3 px-4 text-slate-600">{r.kelas}</td>
                    <td className="py-3 px-4">
                      {r.status === 'hadir' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Hadir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                          Belum Hadir
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {r.waktuPresensi ? (
                        <div>
                          <span className="font-semibold text-slate-800">{r.waktuPresensi}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {r.metode === 'kamera_scanner'
                              ? 'Scan Kamera'
                              : r.metode === 'barcode_scanner'
                              ? 'Scan Barcode'
                              : 'Manual'}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <BarcodeSvg value={r.nisn} height={18} showText={false} className="w-24 mx-auto" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Print Preview Modal */}
      {showPrintSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl p-8 space-y-6 max-h-[90vh] overflow-y-auto print:m-0 print:p-0 print:shadow-none print:border-none">
            {/* Kop Surat Sekolah Resmi */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 gap-4">
              <div className="p-1">
                <TutWuriLogo className="w-16 h-16" />
              </div>
              <div className="text-center flex-1 space-y-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  PEMERINTAH KABUPATEN OGAN KOMERING ULU SELATAN
                </h3>
                <h2 className="text-base font-black uppercase text-slate-900">
                  DINAS PENDIDIKAN - SMP NEGERI 01 BANDING AGUNG
                </h2>
                <p className="text-[11px] text-slate-600">
                  Jalan Raya Ranau, Banding Agung, OKU Selatan, Sumatera Selatan 32274
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  NPSN: 10601234 · Akreditasi: A · E-POTING CBT ONLINE
                </p>
              </div>
              <div className="w-16 h-16 opacity-0" />
            </div>

            {/* Document Header */}
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 underline">
                DAFTAR HADIR PESERTA UJIAN BERBASIS BARCODE CBT
              </h3>
              <p className="text-xs text-slate-600">
                Mata Pelajaran: <strong>{schedule.mataPelajaran}</strong> · Tingkat: Kelas {schedule.tingkat} · Ruang: {schedule.ruang}
              </p>
            </div>

            {/* Attendance Table */}
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300 w-10 text-center">No.</th>
                  <th className="p-2 border-r border-slate-300">No. Peserta</th>
                  <th className="p-2 border-r border-slate-300">NISN</th>
                  <th className="p-2 border-r border-slate-300">Nama Siswa</th>
                  <th className="p-2 border-r border-slate-300 text-center">Kelas</th>
                  <th className="p-2 border-r border-slate-300 text-center">Barcode</th>
                  <th className="p-2 border-r border-slate-300 text-center">Status</th>
                  <th className="p-2 text-center w-28">Tanda Tangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.slice(0, 16).map((r, idx) => (
                  <tr key={r.siswaId}>
                    <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                    <td className="p-1.5 border-r border-slate-300 font-mono">{r.nomorPeserta}</td>
                    <td className="p-1.5 border-r border-slate-300 font-mono font-bold">{r.nisn}</td>
                    <td className="p-1.5 border-r border-slate-300 font-semibold">{r.nama}</td>
                    <td className="p-1.5 border-r border-slate-300 text-center">{r.kelas}</td>
                    <td className="p-1.5 border-r border-slate-300 text-center">
                      <BarcodeSvg value={r.nisn} height={20} showText={false} className="w-20 mx-auto" />
                    </td>
                    <td className="p-1.5 border-r border-slate-300 text-center">
                      {r.status === 'hadir' ? (
                        <span className="text-emerald-800 font-bold">Hadir ({r.waktuPresensi?.split(' ')[0]})</span>
                      ) : (
                        <span className="text-slate-400">Belum Hadir</span>
                      )}
                    </td>
                    <td className="p-1.5 text-center text-slate-400 font-mono text-[10px]">
                      {idx + 1}. ...........
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signature Area */}
            <div className="pt-6 flex justify-between text-xs">
              <div>
                <p className="text-slate-600">Mengetahui,</p>
                <p className="font-semibold text-slate-800">Pengawas Ruang Ujian</p>
                <div className="h-14" />
                <p className="font-bold underline text-slate-900">{schedule.pengawasNama}</p>
                <p className="text-slate-500">NIP. 198904122014021002</p>
              </div>

              <div className="text-right">
                <p className="text-slate-600">Banding Agung, 06 Maret 2026</p>
                <p className="font-semibold text-slate-800">Kepala SMPN 01 Banding Agung</p>
                <div className="h-14" />
                <p className="font-bold underline text-slate-900">Drs. H. Muhammad Ilyas, M.M.</p>
                <p className="text-slate-500">NIP. 196805121994121002</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t flex justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setShowPrintSheet(false)}
                className="px-4 py-2 border rounded-lg text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Dokumen Presensi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Live Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={showGoogleSheetsModal}
        onClose={() => setShowGoogleSheetsModal(false)}
        schedule={schedule}
        students={students}
        sessions={sessions}
        attendanceRecords={records}
      />
    </div>
  );
};
