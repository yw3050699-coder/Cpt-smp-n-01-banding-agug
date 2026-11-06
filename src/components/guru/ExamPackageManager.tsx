import React, { useState } from 'react';
import { ExamSchedule, QuestionBank } from '../../types';
import { Calendar, Clock, Key, Shuffle, CheckCircle, Plus, Eye, Power } from 'lucide-react';
import { updateScheduleToken, saveExamSchedules } from '../../lib/storage';

interface ExamPackageManagerProps {
  schedules: ExamSchedule[];
  banks: QuestionBank[];
  onRefreshData: () => void;
}

export const ExamPackageManager: React.FC<ExamPackageManagerProps> = ({
  schedules,
  banks,
  onRefreshData,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New schedule form state
  const [namaUjian, setNamaUjian] = useState('');
  const [bankId, setBankId] = useState(banks[0]?.id || '');
  const [durasiMenit, setDurasiMenit] = useState(60);
  const [ruang, setRuang] = useState('Lab Komputer 1 & 2');
  const [acakSoal, setAcakSoal] = useState(true);
  const [acakOpsi, setAcakOpsi] = useState(false);
  const [tampilkanNilai, setTampilkanNilai] = useState(true);

  const generateRandomToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleToggleToken = (sch: ExamSchedule) => {
    updateScheduleToken(sch.id, sch.tokenUjian, !sch.tokenAktif);
    onRefreshData();
  };

  const handleRegenerateToken = (sch: ExamSchedule) => {
    const newToken = generateRandomToken();
    updateScheduleToken(sch.id, newToken, true);
    onRefreshData();
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const bank = banks.find((b) => b.id === bankId) || banks[0];
    const newSch: ExamSchedule = {
      id: `sch_${Date.now()}`,
      bankId,
      namaUjian,
      mataPelajaran: bank.mataPelajaran,
      tingkat: bank.tingkat,
      durasiMenit: Number(durasiMenit),
      waktuMulai: new Date().toISOString(),
      waktuSelesai: new Date(Date.now() + durasiMenit * 60000).toISOString(),
      tokenUjian: generateRandomToken(),
      tokenAktif: true,
      acakSoal,
      acakOpsi,
      tampilkanNilaiLangsung: tampilkanNilai,
      pengawasNama: 'Rudi Santoso, S.Kom',
      ruang,
      status: 'aktif',
    };

    saveExamSchedules([...schedules, newSch]);
    onRefreshData();
    setIsAddOpen(false);
    setNamaUjian('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Manajemen Paket & Jadwal Pelaksanaan Ujian CBT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengaturan token ujian server, durasi waktu, pengacakan soal, dan alokasi ruang ujian
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Buat Jadwal Ujian Baru
        </button>
      </div>

      {/* Schedules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {schedules.map((sch) => (
          <div
            key={sch.id}
            className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs hover:border-blue-300 transition-all"
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                  Kelas {sch.tingkat} · {sch.mataPelajaran}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {sch.namaUjian}
                </h3>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                  sch.status === 'aktif'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {sch.status}
              </span>
            </div>

            {/* Token Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                  TOKEN UJIAN SAAT INI
                </span>
                <span className="font-mono text-xl font-bold tracking-widest text-slate-900">
                  {sch.tokenUjian}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRegenerateToken(sch)}
                  className="px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-md transition-colors cursor-pointer"
                  title="Generate Token Baru"
                >
                  Acak Token
                </button>
                <button
                  onClick={() => handleToggleToken(sch)}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold cursor-pointer ${
                    sch.tokenAktif
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {sch.tokenAktif ? 'Token Aktif' : 'Token Nonaktif'}
                </button>
              </div>
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Durasi: <strong>{sch.durasiMenit} Menit</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shuffle className="w-3.5 h-3.5 text-slate-400" />
                <span>Acak Soal: <strong>{sch.acakSoal ? 'Ya' : 'Tidak'}</strong></span>
              </div>
              <div className="col-span-2 text-slate-500 text-[11px]">
                Ruang: {sch.ruang} · Pengawas: {sch.pengawasNama}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Buat Jadwal Baru */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Buat Jadwal Ujian Baru</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Ujian:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penilaian Harian Bersama Matematika"
                  value={namaUjian}
                  onChange={(e) => setNamaUjian(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Pilih Paket Bank Soal:
                </label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.kode} - {b.judul} (Kelas {b.tingkat})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Durasi (Menit):
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={durasiMenit}
                    onChange={(e) => setDurasiMenit(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ruang Pelaksanaan:
                  </label>
                  <input
                    type="text"
                    value={ruang}
                    onChange={(e) => setRuang(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acakSoal}
                    onChange={(e) => setAcakSoal(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Acak Urutan Nomor Soal untuk Setiap Siswa</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acakOpsi}
                    onChange={(e) => setAcakOpsi(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Acak Opsi Pilihan Ganda (A-E)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tampilkanNilai}
                    onChange={(e) => setTampilkanNilai(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Tampilkan Skor Pilihan Ganda Langsung Setelah Ujian Selesai</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer"
                >
                  Terbitkan Jadwal Ujian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
