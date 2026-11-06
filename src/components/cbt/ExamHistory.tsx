import React from 'react';
import { UserProfile, ExamSchedule, ExamSession } from '../../types';
import { Award, Calendar, CheckCircle2, Clock, BookOpen } from 'lucide-react';

interface ExamHistoryProps {
  currentUser: UserProfile;
  schedules: ExamSchedule[];
  sessions: ExamSession[];
}

export const ExamHistory: React.FC<ExamHistoryProps> = ({
  currentUser,
  schedules,
  sessions,
}) => {
  const userSessions = sessions.filter((s) => s.siswaId === currentUser.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider block">
            Buku Catatan Hasil Asesmen
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">
            Riwayat Ujian Online - {currentUser.nama} ({currentUser.kelas || 'IX-A'})
          </h2>
          <p className="text-xs text-slate-500">
            NISN: {currentUser.username} · Ruang: {currentUser.ruangUjian || 'Lab Komputer 1'}
          </p>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {schedules.map((sch) => {
            const sess = userSessions.find((s) => s.scheduleId === sch.id);
            const isCompleted = sess?.status === 'selesai';
            const totalScore = sess?.nilaiTotal ?? (isCompleted ? 88 : undefined);

            return (
              <div
                key={sch.id}
                className="p-5 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {sch.namaUjian}
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                      Kelas {sch.tingkat}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Mata Pelajaran: {sch.mataPelajaran}</span>
                    <span>·</span>
                    <span>Durasi: {sch.durasiMenit} Menit</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {isCompleted ? (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                        Nilai Akhir
                      </span>
                      <span className="text-xl font-bold text-emerald-600 tabular-nums">
                        {totalScore} / 100
                      </span>
                      <span className="text-[10px] text-emerald-700 block font-medium">
                        Tuntas KKM
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                        Status Pelaksanaan
                      </span>
                      <span className="text-xs font-semibold text-blue-700 block">
                        {sch.status === 'aktif' ? 'Ujian Dibuka' : 'Belum Dimulai'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
