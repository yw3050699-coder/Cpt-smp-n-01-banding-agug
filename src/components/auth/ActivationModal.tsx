import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { X, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { activateStudentAccount } from '../../lib/storage';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  students: UserProfile[];
  onActivationSuccess: () => void;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  students,
  onActivationSuccess,
}) => {
  const [nisn, setNisn] = useState(currentUser.username || '');
  const [kodeAktivasi, setKodeAktivasi] = useState('SMPN1BA-2026');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNisn = nisn.trim();
    const student = students.find((s) => s.username === cleanNisn);

    if (!student) {
      setErrorMsg('NISN tidak terdaftar dalam data pokok siswa SMP Negeri 01 Banding Agung.');
      return;
    }

    if (student.sudahAktivasi) {
      setErrorMsg('Akun dengan NISN ini sudah berstatus aktif dan terverifikasi.');
      return;
    }

    // Activate
    activateStudentAccount(student.id);
    setIsSuccess(true);
    setErrorMsg('');
    setTimeout(() => {
      onActivationSuccess();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Aktivasi Akun Mandiri Siswa
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Aktivasi Akun Berhasil!
            </h4>
            <p className="text-xs text-slate-500">
              Akun Anda telah aktif dan terverifikasi untuk mengikuti Ujian Online CBT.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Masukkan NISN 10 digit dan Kode Registrasi Resmi dari sekolah untuk mengaktifkan akun peserta ujian:
            </p>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nomor Induk Siswa Nasional (NISN):
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 0081000007"
                value={nisn}
                onChange={(e) => {
                  setNisn(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Kode Registrasi Sekolah / Token Aktivasi:
              </label>
              <input
                type="text"
                required
                placeholder="SMPN1BA-2026"
                value={kodeAktivasi}
                onChange={(e) => setKodeAktivasi(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                *Kode bawaan simulasi: SMPN1BA-2026
              </span>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 cursor-pointer"
              >
                Aktivasi Sekarang
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
