import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ExamSchedule, QuestionItem, StudentAnswer, ExamSession } from '../../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Grid,
  Send,
  CloudCheck,
  ShieldAlert,
  Award,
  BookOpen,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getStudentAnswers,
  saveStudentSingleAnswer,
  addProctorAlert,
  getExamSessions,
  saveExamSessions,
} from '../../lib/storage';
import { TutWuriLogo } from '../common/TutWuriLogo';
import { BarcodeSvg, QrCodeComponent } from '../common/BarcodeSvg';

interface CbtExamPlayerProps {
  currentUser: UserProfile;
  schedule: ExamSchedule;
  questions: QuestionItem[];
  onFinishExam: () => void;
}

export const CbtExamPlayer: React.FC<CbtExamPlayerProps> = ({
  currentUser,
  schedule,
  questions,
  onFinishExam,
}) => {
  // Step: 'token_entry' -> 'exam_in_progress' -> 'submitted'
  const [step, setStep] = useState<'token_entry' | 'exam_in_progress' | 'submitted'>('token_entry');
  const [inputToken, setInputToken] = useState(schedule.tokenUjian || 'SMP01B');
  const [tokenError, setTokenError] = useState('');

  // Active question index (0-indexed)
  const [currentIdx, setCurrentIdx] = useState(0);

  // Font size multiplier: 'normal' | 'large' | 'xlarge'
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Answers record keyed by questionId
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [lastAutosaveText, setLastAutosaveText] = useState('Tersimpan di server');
  const [isNavGridOpen, setIsNavGridOpen] = useState(false);

  // Server-synced Timer Countdown in seconds
  const [timeLeft, setTimeLeft] = useState<number>(schedule.durasiMenit * 60);

  // Anti-cheat tab switch warning
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);

  // Finish exam confirmation modal
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [confirmAgreed, setConfirmAgreed] = useState(false);

  // Final score after submission
  const [calculatedPgScore, setCalculatedPgScore] = useState<number>(0);

  const sessionId = `ses_${currentUser.id}`;

  // Initialize stored answers
  useEffect(() => {
    const saved = getStudentAnswers(sessionId);
    setAnswers(saved);
  }, [sessionId]);

  // Handle Token Submission & Start Exam
  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedule.tokenAktif) {
      setTokenError('Token ujian sedang dinonaktifkan oleh pengawas ruang.');
      return;
    }
    if (inputToken.trim().toUpperCase() !== schedule.tokenUjian.toUpperCase()) {
      setTokenError('Token ujian salah! Silakan tanyakan token resmi pada pengawas ruang.');
      return;
    }

    setTokenError('');
    setStep('exam_in_progress');

    // Register active session in storage
    const sessions = getExamSessions();
    const existingIdx = sessions.findIndex((s) => s.siswaId === currentUser.id);
    const newSession: ExamSession = {
      id: sessionId,
      scheduleId: schedule.id,
      siswaId: currentUser.id,
      siswaNama: currentUser.nama,
      siswaNisn: currentUser.username,
      siswaKelas: currentUser.kelas || 'IX-A',
      ruangUjian: currentUser.ruangUjian || 'Lab Komputer 1',
      waktuMulai: new Date().toISOString(),
      sisaWaktuDetik: schedule.durasiMenit * 60,
      status: 'mengerjakan',
      jumlahPindahTab: 0,
      terakhirAutosave: new Date().toISOString(),
      statusKoreksi: 'menunggu_koreksi_guru',
    };

    if (existingIdx >= 0) {
      sessions[existingIdx].status = 'mengerjakan';
    } else {
      sessions.push(newSession);
    }
    saveExamSessions(sessions);
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (step !== 'exam_in_progress') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitFinalExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Anti-Cheating: Detect Window Blur / Tab Visibility Change
  useEffect(() => {
    if (step !== 'exam_in_progress') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((c) => {
          const next = c + 1;
          setShowCheatWarning(true);
          addProctorAlert(
            currentUser.nama,
            currentUser.kelas || 'IX-A',
            `Terdeteksi meninggalkan layar ujian (Pelanggaran ke-${next})`,
            'pelanggaran'
          );

          // Update in session
          const sessions = getExamSessions();
          const sess = sessions.find((s) => s.id === sessionId);
          if (sess) {
            sess.jumlahPindahTab = next;
            if (next >= 2) sess.status = 'terkendala';
            saveExamSessions(sessions);
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [step, currentUser, sessionId]);

  const currentQ = questions[currentIdx] || questions[0];
  const currentAns = answers[currentQ.id];

  // Autosave handler for Multiple Choice
  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const newAnswer: StudentAnswer = {
      questionId: currentQ.id,
      nomorSoal: currentIdx + 1,
      tipe: 'pilihan_ganda',
      jawabanPilihan: key,
      raguRagu: currentAns?.raguRagu || false,
      terakhirDisimpan: new Date().toISOString(),
    };

    setAnswers((prev) => ({ ...prev, [currentQ.id]: newAnswer }));
    saveStudentSingleAnswer(sessionId, newAnswer);
    setLastAutosaveText(`Tersimpan di server (${new Date().toLocaleTimeString('id-ID')})`);
  };

  // Autosave handler for Essay Text
  const handleEssayChange = (text: string) => {
    const newAnswer: StudentAnswer = {
      questionId: currentQ.id,
      nomorSoal: currentIdx + 1,
      tipe: 'esai',
      jawabanEsai: text,
      raguRagu: currentAns?.raguRagu || false,
      terakhirDisimpan: new Date().toISOString(),
    };

    setAnswers((prev) => ({ ...prev, [currentQ.id]: newAnswer }));
    saveStudentSingleAnswer(sessionId, newAnswer);
    setLastAutosaveText(`Tersimpan di server (${new Date().toLocaleTimeString('id-ID')})`);
  };

  // Toggle Ragu-Ragu
  const handleToggleRagu = () => {
    const updated: StudentAnswer = {
      questionId: currentQ.id,
      nomorSoal: currentIdx + 1,
      tipe: currentQ.tipe,
      jawabanPilihan: currentAns?.jawabanPilihan,
      jawabanEsai: currentAns?.jawabanEsai,
      raguRagu: !currentAns?.raguRagu,
      terakhirDisimpan: new Date().toISOString(),
    };

    setAnswers((prev) => ({ ...prev, [currentQ.id]: updated }));
    saveStudentSingleAnswer(sessionId, updated);
  };

  // Submit Final Exam
  const handleSubmitFinalExam = (force = false) => {
    if (!force && !confirmAgreed) return;

    // Calculate PG score automatically
    let pgScore = 0;
    questions.forEach((q) => {
      if (q.tipe === 'pilihan_ganda') {
        const userChoice = answers[q.id]?.jawabanPilihan;
        if (userChoice && userChoice === q.kunciJawaban) {
          pgScore += q.bobot;
        }
      }
    });

    setCalculatedPgScore(pgScore);

    // Update session status in storage
    const sessions = getExamSessions();
    const sess = sessions.find((s) => s.id === sessionId);
    if (sess) {
      sess.status = 'selesai';
      sess.waktuSelesai = new Date().toISOString();
      sess.sisaWaktuDetik = 0;
      sess.nilaiPilihanGanda = pgScore;
      sess.nilaiTotal = pgScore; // Before essay review
      saveExamSessions(sessions);
    }

    addProctorAlert(
      currentUser.nama,
      currentUser.kelas || 'IX-A',
      `Selesai mengerjakan ujian dan mengumpulkan seluruh jawaban.`,
      'selesai'
    );

    setShowFinishModal(false);
    setStep('submitted');

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  // Format seconds to mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Statistics for submission modal
  const answeredCount = Object.values(answers).filter(
    (a) => Boolean(a.jawabanPilihan) || Boolean(a.jawabanEsai?.trim())
  ).length;
  const doubtfulCount = Object.values(answers).filter((a) => a.raguRagu).length;
  const unansweredCount = questions.length - answeredCount;

  // STEP 1: TOKEN CONFIRMATION SCREEN
  if (step === 'token_entry') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 bg-slate-900 text-white flex items-center gap-4">
            <TutWuriLogo className="w-14 h-14 shrink-0" />
            <div>
              <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider block">
                Konfirmasi Data Peserta Ujian CBT
              </span>
              <h2 className="text-lg font-extrabold mt-0.5">
                SMP Negeri 01 Banding Agung
              </h2>
              <p className="text-xs text-slate-400">
                Tahun Pelajaran 2025/2026 · Asesmen Berbasis Komputer
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Nama Peserta:</span>
                <span className="font-bold text-slate-900 text-sm">{currentUser.nama}</span>
              </div>
              <div>
                <span className="text-slate-500 block">NISN:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {currentUser.username}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Kelas / Ruang:</span>
                <span className="font-semibold text-slate-800">
                  {currentUser.kelas || 'IX-A'} ({currentUser.ruangUjian || 'Lab Komputer 1'})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Mata Pelajaran:</span>
                <span className="font-semibold text-blue-700">
                  {schedule.mataPelajaran}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Alokasi Waktu:</span>
                <span className="font-semibold text-slate-800">
                  {schedule.durasiMenit} Menit
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Jumlah Butir Soal:</span>
                <span className="font-semibold text-slate-800">
                  {questions.length} Butir (PG & Esai)
                </span>
              </div>
            </div>

            {/* Student Barcode & QR verification badge */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3">
                <QrCodeComponent value={currentUser.username} size={48} />
                <div>
                  <span className="text-[11px] font-bold text-slate-900 block">
                    Barcode Presensi Ujian Anda
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Diverifikasi oleh Pengawas Ruang saat masuk lab
                  </span>
                </div>
              </div>
              <div className="w-full sm:w-auto flex justify-center">
                <BarcodeSvg value={currentUser.username} height={28} className="w-40" />
              </div>
            </div>

            {/* Token Input Form */}
            <form onSubmit={handleStartExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase">
                  Masukkan Token Ujian (6 Karakter):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Contoh: SMP01B"
                    value={inputToken}
                    onChange={(e) => {
                      setInputToken(e.target.value.toUpperCase());
                      setTokenError('');
                    }}
                    className="w-full text-center font-mono text-2xl tracking-widest font-black uppercase bg-slate-50 border-2 border-slate-300 focus:border-blue-600 rounded-xl py-3 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                  *Token dirilis oleh Pengawas Ruang saat ujian hendak dimulai. (Token aktif saat ini:{' '}
                  <strong className="text-slate-800">{schedule.tokenUjian}</strong>)
                </p>
                {tokenError && (
                  <p className="text-xs text-rose-600 font-semibold mt-2 text-center bg-rose-50 border border-rose-200 p-2 rounded-lg">
                    {tokenError}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <span>Mulai Mengerjakan Ujian</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: SUBMITTED CONFIRMATION & SCORE
  if (step === 'submitted') {
    return (
      <div className="max-w-xl mx-auto py-10 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              Ujian Berhasil Diselesaikan!
            </h2>
            <p className="text-xs text-slate-500">
              Terima kasih, lembar jawaban Anda telah diterima lengkap dan terverifikasi di server CBT SMPN 01 Banding Agung.
            </p>
          </div>

          {/* Instant Score Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">
              Hasil Penilaian Langsung (Pilihan Ganda)
            </span>
            <div className="text-3xl font-black text-blue-600 tabular-nums">
              {calculatedPgScore} / 70 Poin
            </div>
            <div className="text-xs text-slate-600 pt-2 border-t border-slate-200 flex justify-between">
              <span>Status Penilaian Uraian / Esai:</span>
              <span className="font-semibold text-amber-700">Menunggu Koreksi Guru</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onFinishExam}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Kembali ke Beranda Peserta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: ACTIVE CBT EXAM PLAYER (CBT INTERFACE)
  return (
    <div className="space-y-4">
      {/* Top CBT Status Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 sticky top-18 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
            {currentIdx + 1}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Soal Nomor {currentIdx + 1} dari {questions.length}
            </h3>
            <span className="text-[11px] text-slate-500">
              {currentQ.tipe === 'pilihan_ganda' ? 'Pilihan Ganda (Bobot ' + currentQ.bobot + ')' : 'Esai / Uraian (Bobot ' + currentQ.bobot + ')'}
            </span>
          </div>
        </div>

        {/* Server Autosave Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
          <CloudCheck className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">{lastAutosaveText}</span>
        </div>

        {/* Timer & Nav Grid trigger */}
        <div className="flex items-center gap-3">
          {/* Font Resizer */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                fontSize === 'normal' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                fontSize === 'large' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
              }`}
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('xlarge')}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                fontSize === 'xlarge' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
              }`}
            >
              A++
            </button>
          </div>

          {/* Timer Display */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold tabular-nums border ${
              timeLeft < 300
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                : 'bg-slate-900 text-white border-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          {/* Question Grid Modal Toggle */}
          <button
            onClick={() => setIsNavGridOpen(!isNavGridOpen)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Daftar Soal ({answeredCount}/{questions.length})</span>
          </button>
        </div>
      </div>

      {/* Main Question & Answer Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Question Card (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            {/* Question Text */}
            <div
              className={`text-slate-900 leading-relaxed font-normal ${
                fontSize === 'large'
                  ? 'text-base leading-relaxed'
                  : fontSize === 'xlarge'
                  ? 'text-lg leading-loose'
                  : 'text-sm leading-relaxed'
              }`}
            >
              {currentQ.kontenSoal}
            </div>

            {/* Answer Area */}
            {currentQ.tipe === 'pilihan_ganda' && currentQ.opsi && (
              <div className="space-y-3 pt-2">
                {currentQ.opsi.map((op) => {
                  const isSelected = currentAns?.jawabanPilihan === op.key;
                  return (
                    <button
                      key={op.key}
                      onClick={() => handleSelectOption(op.key)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-600 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {op.key}
                      </span>
                      <span
                        className={`pt-0.5 ${
                          fontSize === 'large' ? 'text-base' : fontSize === 'xlarge' ? 'text-lg' : 'text-xs sm:text-sm'
                        }`}
                      >
                        {op.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.tipe === 'esai' && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Tuliskan jawaban uraian Anda pada lembar berikut:
                </label>
                <textarea
                  rows={6}
                  placeholder="Ketikkan argumen dan jawaban lengkap Anda di sini (autosave otomatis aktif)..."
                  value={currentAns?.jawabanEsai || ''}
                  onChange={(e) => handleEssayChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-4 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50"
                />
                <span className="text-[11px] text-slate-400 block text-right">
                  {currentAns?.jawabanEsai ? currentAns.jawabanEsai.length : 0} Karakter
                </span>
              </div>
            )}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-2">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={handleToggleRagu}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                currentAns?.raguRagu
                  ? 'bg-amber-400 text-slate-900 border-amber-500'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              {currentAns?.raguRagu ? 'Hapus Ragu-Ragu' : 'Ragu-Ragu'}
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowFinishModal(true)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Selesaikan Ujian</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Question Number Grid (1 col on desktop) */}
        <div className={`lg:block ${isNavGridOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-xs text-slate-900">Nomor Soal</span>
              <span className="text-[11px] text-slate-500">
                Terjawab: {answeredCount}/{questions.length}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const hasAnswer =
                  Boolean(ans?.jawabanPilihan) || Boolean(ans?.jawabanEsai?.trim());
                const isRagu = ans?.raguRagu;
                const isCurrent = idx === currentIdx;

                let btnBg = 'bg-slate-100 text-slate-700 border-slate-200';
                if (isCurrent) {
                  btnBg = 'ring-2 ring-blue-600 ring-offset-1 font-bold';
                }
                if (hasAnswer && !isRagu) {
                  btnBg = 'bg-blue-600 text-white border-blue-600';
                } else if (isRagu) {
                  btnBg = 'bg-amber-400 text-slate-900 border-amber-500 font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIdx(idx);
                      setIsNavGridOpen(false);
                    }}
                    className={`h-10 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer ${btnBg}`}
                  >
                    <span>{idx + 1}</span>
                    {ans?.jawabanPilihan && (
                      <span className="text-[9px] -mt-0.5 opacity-90">
                        {ans.jawabanPilihan}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="text-[11px] space-y-1.5 pt-2 border-t border-slate-100 text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-blue-600 shrink-0" />
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-400 shrink-0" />
                <span>Ragu-Ragu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-200 shrink-0" />
                <span>Belum Dijawab</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowFinishModal(true)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Kumpulkan Ujian
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Anti-Cheat Warning */}
      {showCheatWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-rose-500 w-full max-w-md p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Peringatan Keamanan Ujian!
              </h3>
              <p className="text-xs text-rose-700 font-semibold">
                Sistem mendeteksi Anda berpindah aplikasi atau membuka tab browser lain (Pelanggaran ke-{tabSwitchCount}).
              </p>
            </div>

            <p className="text-xs text-slate-600">
              Aktivitas ini telah dicatat dan dilaporkan secara real-time ke layar pengawas ruang. Dilarang keras melakukan kecurangan atau membuka materi di luar jendela ujian ini.
            </p>

            <button
              onClick={() => setShowCheatWarning(false)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Saya Mengerti & Kembali ke Soal
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Selesai Ujian */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Penyelesaian Ujian
              </h3>
              <p className="text-xs text-slate-500">
                Periksa kembali ringkasan jawaban Anda sebelum mengumpulkan:
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
                <span className="text-[10px] text-blue-700 block font-semibold">Terjawab</span>
                <span className="text-lg font-bold text-blue-900 tabular-nums">
                  {answeredCount}
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                <span className="text-[10px] text-amber-700 block font-semibold">Ragu-Ragu</span>
                <span className="text-lg font-bold text-amber-900 tabular-nums">
                  {doubtfulCount}
                </span>
              </div>
              <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-600 block font-semibold">Kosong</span>
                <span className="text-lg font-bold text-slate-800 tabular-nums">
                  {unansweredCount}
                </span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Masih ada {unansweredCount} soal yang belum Anda jawab. Yakin ingin mengakhiri?</span>
              </div>
            )}

            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={confirmAgreed}
                onChange={(e) => setConfirmAgreed(e.target.checked)}
                className="rounded text-blue-600 mt-0.5"
              />
              <span>
                Saya menyatakan dengan sadar dan jujur telah menyelesaikan seluruh pengerjaan ujian.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowFinishModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Periksa Kembali
              </button>
              <button
                disabled={!confirmAgreed}
                onClick={() => handleSubmitFinalExam(false)}
                className="px-4 py-2 rounded-lg bg-emerald-600 disabled:opacity-50 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Ya, Kumpulkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
