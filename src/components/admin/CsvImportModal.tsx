import React, { useState } from 'react';
import { UserProfile, StudentGrade } from '../../types';
import { X, UploadCloud, Download, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newUsers: UserProfile[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [importType, setImportType] = useState<'siswa' | 'guru' | 'pengawas'>('siswa');
  const [csvText, setCsvText] = useState('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const sampleCsvTemplates = {
    siswa: `nisn,nama,kelas,tingkat,ruang_ujian,email
0082910001,Ahmad Dani Pratama,VII-A,VII,Lab Komputer 1,ahmad.dani@smpn1ba.sch.id
0082910002,Bunga Citra Lestari,VII-A,VII,Lab Komputer 1,bunga.citra@smpn1ba.sch.id
0082910003,Cahyo Nugroho,VIII-B,VIII,Lab Komputer 2,cahyo.n@smpn1ba.sch.id
0082910004,Dewi Sartika Putri,IX-A,IX,Ruang Multimedia 1,dewi.sartika@smpn1ba.sch.id`,
    guru: `username,nama,email,mata_pelajaran
198503142010011003,Dra. Sri Wahyuni,sri.wahyuni@sekolah.sch.id,Ilmu Pengetahuan Alam (IPA)
198708222011011005,Ahmad Fauzi, M.Pd,ahmad.fauzi@sekolah.sch.id,Matematika
199102172015022001,Ratna Dewi, S.Pd,ratna.dewi@sekolah.sch.id,Bahasa Indonesia`,
    pengawas: `username,nama,email,ruang_ujian
198904122014021002,Rudi Santoso, S.Kom,rudi.santoso@sekolah.sch.id,Lab Komputer 1
199205182016012003,Eko Prasetyo, S.Pd,eko.p@sekolah.sch.id,Lab Komputer 2`,
  };

  const handleDownloadTemplate = () => {
    const content = sampleCsvTemplates[importType];
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `template_import_${importType}_smpn01_banding_agung.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseAndValidateCsv(text);
    };
    reader.readAsText(file);
  };

  const parseAndValidateCsv = (text: string) => {
    const lines = text.trim().split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) {
      setValidationErrors(['File CSV kosong atau hanya memiliki baris header.']);
      setPreviewRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const errors: string[] = [];
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length < headers.length) {
        errors.push(`Baris ${i + 1}: Jumlah kolom kurang dari header.`);
        continue;
      }

      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] || '';
      });

      if (importType === 'siswa') {
        if (!rowObj.nisn || rowObj.nisn.length < 5) {
          errors.push(`Baris ${i + 1}: NISN tidak valid (${rowObj.nisn || 'kosong'}).`);
        }
        if (!rowObj.nama) {
          errors.push(`Baris ${i + 1}: Nama siswa tidak boleh kosong.`);
        }
      }

      rows.push(rowObj);
    }

    setValidationErrors(errors);
    setPreviewRows(rows);
  };

  const handleConfirmImport = () => {
    if (previewRows.length === 0 || validationErrors.length > 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      const newProfiles: UserProfile[] = previewRows.map((row, idx) => {
        if (importType === 'siswa') {
          return {
            id: `imported_std_${Date.now()}_${idx}`,
            username: row.nisn,
            nama: row.nama,
            role: 'siswa',
            kelas: row.kelas || 'VII-A',
            tingkat: (row.tingkat || 'VII') as StudentGrade,
            nomorPeserta: `01-07-${String(idx + 1).padStart(3, '0')}`,
            ruangUjian: row.ruang_ujian || 'Lab Komputer 1',
            statusAktif: true,
            sudahAktivasi: false, // Newly imported students require activation
            email: row.email || `siswa.${row.nisn}@smpn1ba.sch.id`,
            created_at: new Date().toISOString(),
          };
        } else if (importType === 'guru') {
          return {
            id: `imported_guru_${Date.now()}_${idx}`,
            username: row.username,
            nama: row.nama,
            role: 'guru',
            email: row.email,
            mataPelajaran: row.mata_pelajaran || 'Umum',
            statusAktif: true,
            sudahAktivasi: true,
            created_at: new Date().toISOString(),
          };
        } else {
          return {
            id: `imported_pengawas_${Date.now()}_${idx}`,
            username: row.username,
            nama: row.nama,
            role: 'pengawas',
            email: row.email,
            ruangUjian: row.ruang_ujian || 'Lab Komputer 1',
            statusAktif: true,
            sudahAktivasi: true,
            created_at: new Date().toISOString(),
          };
        }
      });

      onImportSuccess(newProfiles);
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Impor Data CSV - SMP Negeri 01 Banding Agung
            </h2>
            <p className="text-xs text-slate-500">
              Unggah file CSV untuk menambahkan data massal siswa, guru, atau pengawas
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Target Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Jenis Data yang Diimpor:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['siswa', 'guru', 'pengawas'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setImportType(type);
                    setCsvText('');
                    setPreviewRows([]);
                    setValidationErrors([]);
                  }}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                    importType === type
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {type === 'siswa' ? 'Daftar Siswa (200+)' : type === 'guru' ? 'Daftar Guru Mapel' : 'Daftar Pengawas Ruang'}
                </button>
              ))}
            </div>
          </div>

          {/* Download Template Bar */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Gunakan format standar kolom yang sesuai dengan sistem sekolah:</span>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Template CSV
            </button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 text-center transition-colors bg-white">
            <input
              type="file"
              id="csvFile"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="csvFile"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Klik untuk memilih file CSV atau seret ke sini
              </p>
              <p className="text-[11px] text-slate-500">
                Pemisah koma (,), UTF-8 encoded
              </p>
            </label>
          </div>

          {/* Validation Feedback */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Ditemukan {validationErrors.length} kesalahan validasi:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                {validationErrors.slice(0, 4).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {validationErrors.length > 4 && (
                  <li>...dan {validationErrors.length - 4} kesalahan lainnya</li>
                )}
              </ul>
            </div>
          )}

          {/* Data Preview */}
          {previewRows.length > 0 && validationErrors.length === 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pratinjau {previewRows.length} baris valid siap diimpor:
                </span>
                <span className="text-slate-500 text-[11px]">
                  Menampilkan 3 baris teratas
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-36">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      {Object.keys(previewRows[0]).map((k) => (
                        <th key={k} className="p-2 border-b border-slate-200">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.slice(0, 3).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {Object.values(r).map((v: any, j) => (
                          <td key={j} className="p-2 text-slate-600 truncate max-w-[150px]">
                            {String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={previewRows.length === 0 || validationErrors.length > 0 || isProcessing}
            onClick={handleConfirmImport}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isProcessing ? 'Memproses Impor...' : `Impor ${previewRows.length} Data ke Database`}
          </button>
        </div>
      </div>
    </div>
  );
};
