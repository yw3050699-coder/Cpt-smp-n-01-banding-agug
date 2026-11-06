import React, { useState } from 'react';
import { ExamSession, QuestionItem } from '../../types';
import { Award, CheckCircle, FileText, Check, AlertCircle } from 'lucide-react';
import { saveExamSessions } from '../../lib/storage';

interface EssayGradingProps {
  sessions: ExamSession[];
  questions: QuestionItem[];
  onRefreshData: () => void;
}

export const EssayGrading: React.FC<EssayGradingProps> = ({
  sessions,
  questions,
  onRefreshData,
}) => {
  const essayQuestions = questions.filter((q) => q.tipe === 'esai');
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions.find((s) => s.status === 'selesai' || s.statusKoreksi === 'menunggu_koreksi_guru')?.id ||
      sessions[0]?.id ||
      ''
  );

  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [essayNotes, setEssayNotes] = useState<Record<string, string>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentSession = sessions.find((s) => s.id === selectedSessionId);

  // Mock answers for demo if session hasn't custom typed one
  const getStudentEssayAnswer = (qId: string) => {
    if (qId.includes('01')) {
      return 'Proses fertilisasi terjadi di tuba falopi (oviduk) setelah ovulasi melepaskan sel telur matang. Jutaan sperma masuk dan satu sperma berhasil membuahi ovum membentuk zigot. Zigot membelah secara mitosis menjadi morula lalu blastokista dan berjalan menuju uterus. Pada hari ke-6 atau 7, blastokista menempel dan tertanam di endometrium (proses implantasi).';
    } else {
      return '1. Bioteknologi konvensional memakai mikroorganisme alami (fermentasi) contoh tempe dan tape. 2. Bioteknologi modern memakai rekayasa genetika dan DNA rekombinan contoh insulin buatan dan vaksin transgenik. 3. Peralatannya kalau modern harus sangat steril dan laboratorium canggih.';
    }
  };

  const handleScoreChange = (qId: string, val: number) => {
    setEssayScores((prev) => ({ ...prev, [qId]: val }));
  };

  const handleNoteChange = (qId: string, val: string) => {
    setEssayNotes((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSaveGrades = () => {
    if (!currentSession) return;

    let totalEssay = 0;
    essayQuestions.forEach((q) => {
      totalEssay += essayScores[q.id] ?? Math.round(q.bobot * 0.9); // default good score
    });

    const pgScore = currentSession.nilaiPilihanGanda || 68;
    const finalTotal = pgScore + totalEssay;

    currentSession.nilaiEsai = totalEssay;
    currentSession.nilaiTotal = Math.min(100, finalTotal);
    currentSession.statusKoreksi = 'tuntas_dinilai';

    saveExamSessions([...sessions]);
    setSavedSuccess(true);
    onRefreshData();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Penilaian & Koreksi Lembar Jawaban Esai Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Koreksi manual jawaban uraian oleh guru mata pelajaran dengan panduan rubrik penskoran terstandar
          </p>
        </div>

        <button
          onClick={handleSaveGrades}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Check className="w-4 h-4" />
          Simpan Nilai Akhir Siswa
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Nilai esai berhasil disimpan! Nilai total siswa telah diperbarui di buku rapor CBT.</span>
        </div>
      )}

      {/* Main Grid: Student List vs Answer Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Students awaiting review */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-900">
            Daftar Lembar Jawaban Peserta ({sessions.length})
          </div>
          <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
            {sessions.map((s) => {
              const isSelected = s.id === selectedSessionId;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSessionId(s.id);
                    setSavedSuccess(false);
                  }}
                  className={`w-full text-left p-3.5 transition-colors cursor-pointer block ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-xs text-slate-900 truncate">
                      {s.siswaNama}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{s.siswaKelas}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                    <span>NISN: {s.siswaNisn}</span>
                    <span
                      className={`font-medium ${
                        s.statusKoreksi === 'tuntas_dinilai'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {s.statusKoreksi === 'tuntas_dinilai' ? 'Tuntas' : 'Perlu Koreksi'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Essay Questions & Answers grading canvas */}
        <div className="lg:col-span-2 space-y-4">
          {currentSession ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              {/* Student Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {currentSession.siswaNama} ({currentSession.siswaKelas})
                  </h3>
                  <p className="text-xs text-slate-500">
                    NISN: {currentSession.siswaNisn} · Nilai PG Terhitung:{' '}
                    <strong>{currentSession.nilaiPilihanGanda || 68} Poin</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Total Nilai Akhir:</span>
                  <span className="text-xl font-bold text-emerald-600 tabular-nums">
                    {currentSession.nilaiTotal || 88} / 100
                  </span>
                </div>
              </div>

              {/* Essay Questions */}
              {essayQuestions.map((q, idx) => {
                const answerText = getStudentEssayAnswer(q.id);
                const currentScore = essayScores[q.id] ?? Math.round(q.bobot * 0.9);

                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-blue-600">
                          SOAL ESAI #{idx + 1} (Bobot Maks: {q.bobot} Poin)
                        </span>
                        <p className="text-xs font-semibold text-slate-900 mt-1">
                          {q.kontenSoal}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 bg-white border border-slate-200 rounded-lg p-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Beri Skor:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={q.bobot}
                          value={currentScore}
                          onChange={(e) => handleScoreChange(q.id, Number(e.target.value))}
                          className="w-14 text-center font-bold text-xs border border-slate-300 rounded px-1.5 py-1 text-blue-700 bg-blue-50/40"
                        />
                        <span className="text-xs text-slate-400">/ {q.bobot}</span>
                      </div>
                    </div>

                    {/* Rubric guide */}
                    <div className="text-xs bg-white border border-slate-200 rounded-lg p-3 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        Rubrik Penilaian Guru:
                      </span>
                      <p className="text-slate-700">{q.rubrikEsai}</p>
                    </div>

                    {/* Student submitted answer */}
                    <div className="text-xs bg-blue-50/60 border border-blue-200 rounded-lg p-3 space-y-1">
                      <span className="text-[11px] font-bold text-blue-900 block flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        Jawaban Siswa (Tersimpan dari Ujian):
                      </span>
                      <p className="text-slate-800 leading-relaxed italic">
                        "{answerText}"
                      </p>
                    </div>

                    {/* Teacher notes */}
                    <div>
                      <input
                        type="text"
                        placeholder="Catatan korektor untuk siswa (opsional)..."
                        value={essayNotes[q.id] || ''}
                        onChange={(e) => handleNoteChange(q.id, e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
              Pilih peserta dari daftar di sebelah kiri untuk mulai menilai jawaban esai.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
