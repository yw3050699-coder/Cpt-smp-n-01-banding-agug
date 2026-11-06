import React, { useState } from 'react';
import { QuestionBank, QuestionItem, QuestionType, MultipleChoiceOption, StudentGrade } from '../../types';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  HelpCircle,
  FileQuestion,
  FileText,
  CheckCircle,
  Eye,
  X,
} from 'lucide-react';
import { addOrUpdateQuestion, deleteQuestion } from '../../lib/storage';

interface QuestionBankProps {
  banks: QuestionBank[];
  questions: QuestionItem[];
  onRefreshData: () => void;
}

export const QuestionBankManager: React.FC<QuestionBankProps> = ({
  banks,
  questions,
  onRefreshData,
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string>(banks[0]?.id || '');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);

  // Form states
  const [tipe, setTipe] = useState<QuestionType>('pilihan_ganda');
  const [kontenSoal, setKontenSoal] = useState('');
  const [bobot, setBobot] = useState<number>(7);
  const [kunciPG, setKunciPG] = useState<string>('A');
  const [opsiA, setOpsiA] = useState('');
  const [opsiB, setOpsiB] = useState('');
  const [opsiC, setOpsiC] = useState('');
  const [opsiD, setOpsiD] = useState('');
  const [opsiE, setOpsiE] = useState('');
  const [rubrikEsai, setRubrikEsai] = useState('');
  const [kataKunciEsai, setKataKunciEsai] = useState('');

  const currentBank = banks.find((b) => b.id === selectedBankId) || banks[0];
  const bankQuestions = questions.filter((q) => q.bankId === selectedBankId);

  const filteredQuestions = bankQuestions.filter((q) => {
    if (filterType === 'ALL') return true;
    return q.tipe === filterType;
  });

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setTipe('pilihan_ganda');
    setKontenSoal('');
    setBobot(7);
    setKunciPG('A');
    setOpsiA('');
    setOpsiB('');
    setOpsiC('');
    setOpsiD('');
    setOpsiE('');
    setRubrikEsai('');
    setKataKunciEsai('');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (q: QuestionItem) => {
    setEditingQuestion(q);
    setTipe(q.tipe);
    setKontenSoal(q.kontenSoal);
    setBobot(q.bobot);
    if (q.tipe === 'pilihan_ganda' && q.opsi) {
      setKunciPG(q.kunciJawaban || 'A');
      setOpsiA(q.opsi.find((o) => o.key === 'A')?.text || '');
      setOpsiB(q.opsi.find((o) => o.key === 'B')?.text || '');
      setOpsiC(q.opsi.find((o) => o.key === 'C')?.text || '');
      setOpsiD(q.opsi.find((o) => o.key === 'D')?.text || '');
      setOpsiE(q.opsi.find((o) => o.key === 'E')?.text || '');
    } else {
      setRubrikEsai(q.rubrikEsai || '');
      setKataKunciEsai((q.kataKunciEsai || []).join(', '));
    }
    setIsEditorOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kontenSoal.trim()) return;

    let opsi: MultipleChoiceOption[] | undefined = undefined;
    if (tipe === 'pilihan_ganda') {
      opsi = [
        { key: 'A', text: opsiA },
        { key: 'B', text: opsiB },
        { key: 'C', text: opsiC },
        { key: 'D', text: opsiD },
        { key: 'E', text: opsiE },
      ];
    }

    const item: QuestionItem = {
      id: editingQuestion ? editingQuestion.id : `q_${Date.now()}`,
      bankId: selectedBankId,
      nomorUrut: editingQuestion ? editingQuestion.nomorUrut : bankQuestions.length + 1,
      tipe,
      mataPelajaran: currentBank?.mataPelajaran || 'Umum',
      tingkat: currentBank?.tingkat || 'IX',
      kontenSoal,
      opsi,
      kunciJawaban: tipe === 'pilihan_ganda' ? kunciPG : undefined,
      bobot: Number(bobot),
      rubrikEsai: tipe === 'esai' ? rubrikEsai : undefined,
      kataKunciEsai:
        tipe === 'esai'
          ? kataKunciEsai
              .split(',')
              .map((k) => k.trim())
              .filter((k) => k.length > 0)
          : undefined,
    };

    addOrUpdateQuestion(item);
    onRefreshData();
    setIsEditorOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus butir soal ini?')) {
      deleteQuestion(id);
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Bank Selector Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label className="text-xs text-slate-500 font-medium block mb-1">
            Pilih Bank Soal Aktif:
          </label>
          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            className="text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.kode} - {b.judul} (Kelas {b.tingkat})
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1.5">{currentBank?.keterangan}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Butir Soal
          </button>
        </div>
      </div>

      {/* Stats summary of questions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Total Butir Soal</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {bankQuestions.length} Soal
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Pilihan Ganda (PG)</span>
          <span className="text-xl font-bold text-blue-600 tabular-nums">
            {bankQuestions.filter((q) => q.tipe === 'pilihan_ganda').length} Butir
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Uraian / Esai</span>
          <span className="text-xl font-bold text-amber-600 tabular-nums">
            {bankQuestions.filter((q) => q.tipe === 'esai').length} Butir
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Akumulasi Bobot</span>
          <span className="text-xl font-bold text-emerald-600 tabular-nums">
            {bankQuestions.reduce((acc, q) => acc + q.bobot, 0)} Poin
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua ({bankQuestions.length})
            </button>
            <button
              onClick={() => setFilterType('pilihan_ganda')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'pilihan_ganda'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pilihan Ganda (
              {bankQuestions.filter((q) => q.tipe === 'pilihan_ganda').length})
            </button>
            <button
              onClick={() => setFilterType('esai')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'esai'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Esai ({bankQuestions.filter((q) => q.tipe === 'esai').length})
            </button>
          </div>

          <span className="text-xs text-slate-500">
            Guru: {currentBank?.pembuatNama}
          </span>
        </div>

        {/* Question List */}
        <div className="divide-y divide-slate-100">
          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Belum ada soal pada kategori ini. Klik "Tambah Butir Soal" di atas.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => (
              <div key={q.id} className="p-5 hover:bg-slate-50 transition-colors space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 capitalize">
                      {q.tipe === 'pilihan_ganda' ? 'Pilihan Ganda (5 Opsi)' : 'Uraian / Esai'}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-medium text-emerald-700">
                      Bobot: {q.bobot} Poin
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Butir Soal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question content */}
                <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-normal">
                  {q.kontenSoal}
                </p>

                {/* Multiple choice options */}
                {q.tipe === 'pilihan_ganda' && q.opsi && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    {q.opsi.map((op) => {
                      const isCorrect = q.kunciJawaban === op.key;
                      return (
                        <div
                          key={op.key}
                          className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {op.key}
                          </span>
                          <span className="truncate">{op.text}</span>
                          {isCorrect && (
                            <span className="ml-auto text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                              KUNCI
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Essay rubric & keywords */}
                {q.tipe === 'esai' && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs space-y-1.5">
                    <div className="font-semibold text-amber-900">
                      Pedoman Penilaian / Rubrik Guru:
                    </div>
                    <p className="text-amber-800">{q.rubrikEsai}</p>
                    {q.kataKunciEsai && q.kataKunciEsai.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-amber-900 font-semibold">
                          Kata Kunci Jawaban:
                        </span>
                        {q.kataKunciEsai.map((kw, i) => (
                          <span
                            key={i}
                            className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded font-mono"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Editor Soal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingQuestion ? 'Edit Butir Soal' : 'Tambah Butir Soal Baru'} -{' '}
                {currentBank?.mataPelajaran}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tipe Soal:</label>
                  <select
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value as QuestionType)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="pilihan_ganda">Pilihan Ganda (5 Opsi A-E)</option>
                    <option value="esai">Uraian / Esai Mandiri</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Bobot Nilai (Poin):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={bobot}
                    onChange={(e) => setBobot(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Isi Pertanyaan / Narasi Soal:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan teks pertanyaan soal di sini secara jelas..."
                  value={kontenSoal}
                  onChange={(e) => setKontenSoal(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {tipe === 'pilihan_ganda' ? (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      Opsi Pilihan Ganda & Kunci Jawaban:
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <span>Kunci Jawaban Benar:</span>
                      <select
                        value={kunciPG}
                        onChange={(e) => setKunciPG(e.target.value)}
                        className="bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded px-2 py-0.5"
                      >
                        <option value="A">Opsi A</option>
                        <option value="B">Opsi B</option>
                        <option value="C">Opsi C</option>
                        <option value="D">Opsi D</option>
                        <option value="E">Opsi E</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { key: 'A', val: opsiA, set: setOpsiA },
                      { key: 'B', val: opsiB, set: setOpsiB },
                      { key: 'C', val: opsiC, set: setOpsiC },
                      { key: 'D', val: opsiD, set: setOpsiD },
                      { key: 'E', val: opsiE, set: setOpsiE },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                            kunciPG === item.key
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.key}
                        </span>
                        <input
                          type="text"
                          required
                          placeholder={`Teks pilihan jawaban ${item.key}...`}
                          value={item.val}
                          onChange={(e) => item.set(e.target.value)}
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Rubrik / Panduan Penskoran Guru:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: Skor maksimal 15 jika menyebutkan 3 tahapan lengkap dengan contoh..."
                      value={rubrikEsai}
                      onChange={(e) => setRubrikEsai(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Kata Kunci Esai (Pisahkan dengan koma):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: fotosintesis, klorofil, glukosa, oksigen"
                      value={kataKunciEsai}
                      onChange={(e) => setKataKunciEsai(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer"
                >
                  Simpan Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
