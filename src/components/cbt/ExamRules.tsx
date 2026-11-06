import React from 'react';
import { ShieldCheck, AlertTriangle, Clock, Wifi, BookOpen, CheckCircle } from 'lucide-react';

interface ExamRulesProps {
  onGoToExam: () => void;
}

export const ExamRules: React.FC<ExamRulesProps> = ({ onGoToExam }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="border-b pb-4">
          <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider block">
            Panduan & Prosedur Operasional Standar (POS)
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Tata Tertib Pelaksanaan Asesmen Ujian Online CBT
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            SMP Negeri 01 Banding Agung - Tahun Pelajaran 2025/2026
          </p>
        </div>

        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 mb-0.5">
                1. Ketepatan Waktu & Token Ujian
              </h3>
              <p>
                Peserta wajib memasuki ruang ujian (Lab Komputer atau gawai pribadi) 10 menit sebelum waktu ujian dimulai. Ujian baru dapat diakses setelah Pengawas Ruang merilis <strong>Token 6 Karakter</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 mb-0.5">
                2. Keamanan & Larangan Membuka Tab / Aplikasi Lain
              </h3>
              <p>
                Sistem CBT dilengkapi <strong>Deteksi Fokus Layar Terotomasi</strong>. Apabila peserta meminimalkan jendela ujian, berpindah tab peramban, atau membuka aplikasi lain, sistem akan merekam log pelanggaran dan mengirim notifikasi langsung ke pengawas ruang. Pelanggaran berulang dapat menyebabkan sesi ujian dikunci.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Wifi className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 mb-0.5">
                3. Autosave Terverifikasi & Penanganan Kendala Jaringan
              </h3>
              <p>
                Seluruh jawaban pilihan ganda dan ketikan esai disimpan secara otomatis setiap beberapa detik ke server. Jika terjadi pemadaman listrik atau koneksi internet terputus, jawaban Anda tetap aman dan dapat dilanjutkan setelah pengawas mereset status login Anda.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 mb-0.5">
                4. Navigasi & Konfirmasi Selesai Ujian
              </h3>
              <p>
                Gunakan tombol "Ragu-Ragu" (warna kuning) jika belum yakin dengan jawaban Anda. Tombol "Selesaikan Ujian" hanya aktif setelah seluruh soal diperiksa dan peserta menyetujui pernyataan kejujuran.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t flex justify-end">
          <button
            onClick={onGoToExam}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Lanjutkan ke Ruang Ujian CBT
          </button>
        </div>
      </div>
    </div>
  );
};
