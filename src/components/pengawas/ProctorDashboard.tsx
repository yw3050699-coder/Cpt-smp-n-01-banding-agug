import React, { useState } from 'react';
import { ExamSession, ExamSchedule, ProctorAlert } from '../../types';
import {
  Monitor,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Clock,
  Key,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { resetStudentSession, updateScheduleToken } from '../../lib/storage';

interface ProctorDashboardProps {
  sessions: ExamSession[];
  schedule: ExamSchedule;
  alerts: ProctorAlert[];
  onRefreshData: () => void;
}

export const ProctorDashboard: React.FC<ProctorDashboardProps> = ({
  sessions,
  schedule,
  alerts,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');

  const filteredSessions = sessions.filter((s) => {
    const matchQuery =
      s.siswaNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.siswaNisn.includes(searchQuery) ||
      s.siswaKelas.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchRoom = selectedRoom === 'ALL' || s.ruangUjian === selectedRoom;

    return matchQuery && matchStatus && matchRoom;
  });

  const handleReset = (sessionId: string) => {
    if (confirm('Reset sesi login siswa ini? Siswa dapat melakukan login kembali dan melanjutkan pengerjaan.')) {
      resetStudentSession(sessionId);
      onRefreshData();
    }
  };

  const handleRegenerateToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    updateScheduleToken(schedule.id, res, true);
    onRefreshData();
  };

  const handleToggleToken = () => {
    updateScheduleToken(schedule.id, schedule.tokenUjian, !schedule.tokenAktif);
    onRefreshData();
  };

  const countMengerjakan = sessions.filter((s) => s.status === 'mengerjakan' || s.status === 'ragu').length;
  const countTerkendala = sessions.filter((s) => s.status === 'terkendala' || s.jumlahPindahTab >= 2).length;
  const countSelesai = sessions.filter((s) => s.status === 'selesai').length;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Token Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider block">
            Pengawasan Ruang Ujian CBT
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-600" />
            {schedule.namaUjian}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengawas: {schedule.pengawasNama} · Alokasi: {schedule.ruang}
          </p>
        </div>

        {/* Live Token Release Widget */}
        <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center gap-4 shrink-0 shadow-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              TOKEN UJIAN AKTIF
            </span>
            <span className="font-mono text-2xl font-black tracking-widest text-emerald-400">
              {schedule.tokenUjian}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 border-l border-slate-700 pl-4">
            <button
              onClick={handleRegenerateToken}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded font-medium transition-colors cursor-pointer text-slate-200"
            >
              Rilis Token Baru
            </button>
            <button
              onClick={handleToggleToken}
              className={`px-2.5 py-1 text-[11px] rounded font-semibold cursor-pointer ${
                schedule.tokenAktif
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-700 hover:bg-rose-800 text-white'
              }`}
            >
              {schedule.tokenAktif ? 'Token Diizinkan' : 'Token Dikunci'}
            </button>
          </div>
        </div>
      </div>

      {/* Proctor Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Total Peserta di Ruang</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            {sessions.length} Siswa
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Sedang Mengerjakan</span>
          <span className="text-2xl font-bold text-blue-600 tabular-nums">
            {countMengerjakan} Siswa
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Terkendala / Pelanggaran</span>
          <span className="text-2xl font-bold text-rose-600 tabular-nums">
            {countTerkendala} Siswa
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Sudah Mengirim Jawaban</span>
          <span className="text-2xl font-bold text-emerald-600 tabular-nums">
            {countSelesai} Siswa
          </span>
        </div>
      </div>

      {/* Main Monitoring Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Students Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari siswa atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="mengerjakan">Mengerjakan</option>
                <option value="terkendala">Terkendala / Pindah Tab</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">NISN & Nama</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3">Status CBT</th>
                  <th className="py-2.5 px-3">Sisa Waktu</th>
                  <th className="py-2.5 px-3">Pindah Tab</th>
                  <th className="py-2.5 px-3 text-right">Aksi Pengawas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      Tidak ada peserta sesuai kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 block truncate max-w-[160px]">
                          {s.siswaNama}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {s.siswaNisn}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                        {s.siswaKelas}
                      </td>

                      <td className="py-2.5 px-3">
                        {s.status === 'selesai' ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Selesai
                          </span>
                        ) : s.status === 'terkendala' || s.jumlahPindahTab >= 2 ? (
                          <span className="text-rose-700 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Terkendala ({s.jumlahPindahTab}x)
                          </span>
                        ) : (
                          <span className="text-blue-700 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Mengerjakan
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700 tabular-nums">
                        {s.status === 'selesai' ? '-' : formatSeconds(s.sisaWaktuDetik)}
                      </td>

                      <td className="py-2.5 px-3 font-mono">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            s.jumlahPindahTab > 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'text-slate-500'
                          }`}
                        >
                          {s.jumlahPindahTab} Kali
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleReset(s.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                          title="Reset Sesi Login Peserta"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset Login
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Realtime Alerts Log */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[520px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Notifikasi Keamanan & Anti-Curang
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Live</span>
          </div>

          <div className="p-4 divide-y divide-slate-100 flex-1 overflow-y-auto space-y-3">
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                Belum ada insiden atau pelanggaran keamanan di ruang ujian.
              </p>
            ) : (
              alerts.map((al) => (
                <div key={al.id} className="pt-2 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900">
                      {al.siswaNama} ({al.siswaKelas})
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {al.timestamp}
                    </span>
                  </div>
                  <p
                    className={`text-xs ${
                      al.tipe === 'pelanggaran'
                        ? 'text-rose-700 font-medium'
                        : al.tipe === 'peringatan'
                        ? 'text-amber-800'
                        : 'text-slate-600'
                    }`}
                  >
                    {al.pesan}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
