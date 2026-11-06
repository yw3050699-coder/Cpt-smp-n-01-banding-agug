import React, { useState } from 'react';
import { UserProfile, StudentGrade } from '../../types';
import {
  Search,
  UserPlus,
  Upload,
  CheckCircle,
  Clock,
  Printer,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { CsvImportModal } from './CsvImportModal';
import { bulkActivateByClass, activateStudentAccount, populateStudentsTo1000 } from '../../lib/storage';
import { TutWuriLogo } from '../common/TutWuriLogo';
import { BarcodeSvg, QrCodeComponent } from '../common/BarcodeSvg';
import { GoogleSheetsSyncModal } from '../common/GoogleSheetsSyncModal';

interface UserManagementProps {
  students: UserProfile[];
  staff: UserProfile[];
  onRefreshData: () => void;
  onAddStudent: (newStudent: UserProfile) => void;
  onImportStudents: (imported: UserProfile[]) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  students,
  staff,
  onRefreshData,
  onAddStudent,
  onImportStudents,
}) => {
  const [activeTab, setActiveTab] = useState<'siswa' | 'staff'>('siswa');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTingkat, setSelectedTingkat] = useState<string>('ALL');
  const [selectedKelas, setSelectedKelas] = useState<string>('ALL');
  const [selectedAktivasi, setSelectedAktivasi] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPrintCardModal, setShowPrintCardModal] = useState(false);
  const [showGoogleSheetsModal, setShowGoogleSheetsModal] = useState(false);

  // New student form state
  const [newNisn, setNewNisn] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKelas, setNewKelas] = useState('VII-A');
  const [newTingkat, setNewTingkat] = useState<StudentGrade>('VII');
  const [newRuang, setNewRuang] = useState('Lab Komputer 1');

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchQuery =
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.includes(searchQuery);
    const matchTingkat = selectedTingkat === 'ALL' || s.tingkat === selectedTingkat;
    const matchKelas = selectedKelas === 'ALL' || s.kelas === selectedKelas;
    const matchAktivasi =
      selectedAktivasi === 'ALL'
        ? true
        : selectedAktivasi === 'ACTIVE'
        ? s.sudahAktivasi
        : !s.sudahAktivasi;

    return matchQuery && matchTingkat && matchKelas && matchAktivasi;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activatedCount = students.filter((s) => s.sudahAktivasi).length;
  const pendingCount = students.length - activatedCount;

  const handleActivateSingle = (id: string) => {
    activateStudentAccount(id);
    onRefreshData();
  };

  const handleBulkActivate = (kelasToActivate: string) => {
    bulkActivateByClass(kelasToActivate);
    onRefreshData();
  };

  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNisn || !newNama) return;

    const newStudent: UserProfile = {
      id: `std_manual_${Date.now()}`,
      username: newNisn,
      nama: newNama,
      role: 'siswa',
      kelas: newKelas,
      tingkat: newTingkat,
      nomorPeserta: `01-${newTingkat === 'VII' ? '07' : newTingkat === 'VIII' ? '08' : '09'}-${Math.floor(
        100 + Math.random() * 900
      )}`,
      ruangUjian: newRuang,
      statusAktif: true,
      sudahAktivasi: true,
      email: `siswa.${newNisn}@smpn1ba.sch.id`,
      created_at: new Date().toISOString(),
    };

    onAddStudent(newStudent);
    setIsAddModalOpen(false);
    setNewNisn('');
    setNewNama('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Total Peserta Terdaftar</p>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold font-mono">
              Maks 1.000
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {students.length} Siswa
          </p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>Kelas VII ({students.filter((s) => s.tingkat === 'VII').length})</span>
            <span>·</span>
            <span>VIII ({students.filter((s) => s.tingkat === 'VIII').length})</span>
            <span>·</span>
            <span>IX ({students.filter((s) => s.tingkat === 'IX').length})</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Akun Sudah Diaktivasi</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
            {activatedCount} Siswa
          </p>
          <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Siap mengikuti ujian CBT</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Menunggu Aktivasi</p>
          <p className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">
            {pendingCount} Siswa
          </p>
          <div className="mt-2 text-xs text-amber-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Perlu aktivasi mandiri / operator</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Guru & Pengawas</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {staff.length} Akun
          </p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>{staff.filter((s) => s.role === 'guru').length} Guru</span>
            <span>·</span>
            <span>{staff.filter((s) => s.role === 'pengawas').length} Pengawas</span>
          </div>
        </div>
      </div>

      {/* Main Tabs & Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('siswa');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'siswa'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Daftar 200+ Siswa ({students.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('staff');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Guru & Pengawas ({staff.length})
            </button>
          </div>

          {/* Action buttons */}
          {activeTab === 'siswa' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowGoogleSheetsModal(true)}
                className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Sinkronkan database siswa dan nilai ke Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Kirim Google Sheets</span>
              </button>
              <button
                onClick={() => {
                  populateStudentsTo1000();
                  onRefreshData();
                }}
                className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Muat data otomatis hingga kuota maksimal 1.000 siswa"
              >
                <span>Kapasitas 1.000 Siswa</span>
              </button>
              <button
                onClick={() => handleBulkActivate(selectedKelas)}
                className="px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Aktivasi massal untuk siswa di filter kelas saat ini"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Aktivasi Massal {selectedKelas !== 'ALL' ? `(${selectedKelas})` : '(Semua)'}
              </button>
              <button
                onClick={() => setShowPrintCardModal(true)}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Cetak Kartu Ujian
              </button>
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                Impor CSV
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Tambah Siswa
              </button>
            </div>
          )}
        </div>

        {/* Tab Siswa */}
        {activeTab === 'siswa' ? (
          <div>
            {/* Filter controls */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari NISN atau Nama Siswa..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <select
                  value={selectedTingkat}
                  onChange={(e) => {
                    setSelectedTingkat(e.target.value);
                    setSelectedKelas('ALL');
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">Semua Tingkat (VII, VIII, IX)</option>
                  <option value="VII">Kelas VII (10 Rombel)</option>
                  <option value="VIII">Kelas VIII (10 Rombel)</option>
                  <option value="IX">Kelas IX (10 Rombel)</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedKelas}
                  onChange={(e) => {
                    setSelectedKelas(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">Semua Rombel (30 Kelas)</option>
                  {selectedTingkat === 'ALL' || selectedTingkat === 'VII' ? (
                    <optgroup label="Kelas VII (A - J)">
                      {['A','B','C','D','E','F','G','H','I','J'].map((l) => (
                        <option key={`VII-${l}`} value={`VII-${l}`}>Kelas VII-{l}</option>
                      ))}
                    </optgroup>
                  ) : null}
                  {selectedTingkat === 'ALL' || selectedTingkat === 'VIII' ? (
                    <optgroup label="Kelas VIII (A - J)">
                      {['A','B','C','D','E','F','G','H','I','J'].map((l) => (
                        <option key={`VIII-${l}`} value={`VIII-${l}`}>Kelas VIII-{l}</option>
                      ))}
                    </optgroup>
                  ) : null}
                  {selectedTingkat === 'ALL' || selectedTingkat === 'IX' ? (
                    <optgroup label="Kelas IX (A - J)">
                      {['A','B','C','D','E','F','G','H','I','J'].map((l) => (
                        <option key={`IX-${l}`} value={`IX-${l}`}>Kelas IX-{l}</option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
              </div>

              <div>
                <select
                  value={selectedAktivasi}
                  onChange={(e) => {
                    setSelectedAktivasi(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">Semua Status Aktivasi</option>
                  <option value="ACTIVE">Sudah Aktivasi</option>
                  <option value="PENDING">Menunggu Aktivasi</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No. Peserta</th>
                    <th className="py-3 px-4">NISN</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Ruang Ujian</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Tidak ditemukan data siswa sesuai filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((std) => (
                      <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {std.nomorPeserta}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {std.username}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {std.nama}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {std.kelas}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {std.ruangUjian}
                        </td>
                        <td className="py-3 px-4">
                          {std.sudahAktivasi ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              Belum Aktivasi
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!std.sudahAktivasi ? (
                            <button
                              onClick={() => handleActivateSingle(std.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                            >
                              Aktivasi
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Siap Ujian</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <div>
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari{' '}
                  <span className="font-semibold text-slate-900">{filteredStudents.length}</span>{' '}
                  siswa (Kapasitas Maks. 1.000)
                </div>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <span className="text-slate-500">Tampilkan:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-slate-200 rounded px-1.5 py-0.5 bg-white text-xs text-slate-700 cursor-pointer"
                  >
                    <option value={15}>15 baris</option>
                    <option value={25}>25 baris</option>
                    <option value={50}>50 baris</option>
                    <option value={100}>100 baris</option>
                    <option value={250}>250 baris</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-medium bg-slate-100 rounded-md">
                  Hal {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Tab Staff (Guru & Pengawas) */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">NIP / Username</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Penugasan / Mapel</th>
                  <th className="py-3 px-4">Email Dinas</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {u.username}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {u.nama}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {u.mataPelajaran || u.ruangUjian || 'Manajemen Sistem'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {u.email || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Siswa Baru Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Tambah Data Siswa Baru (Manual)
            </h3>
            <form onSubmit={handleSaveNewStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">NISN (10 Digit):</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{8,12}"
                  placeholder="Contoh: 0081234999"
                  value={newNisn}
                  onChange={(e) => setNewNisn(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Nama Lengkap Siswa:</label>
                <input
                  type="text"
                  required
                  placeholder="Nama sesuai akta / raport"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tingkat:</label>
                  <select
                    value={newTingkat}
                    onChange={(e) => {
                      const t = e.target.value as StudentGrade;
                      setNewTingkat(t);
                      setNewKelas(`${t}-A`);
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <option value="VII">Kelas VII</option>
                    <option value="VIII">Kelas VIII</option>
                    <option value="IX">Kelas IX</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Rombel / Kelas:</label>
                  <select
                    value={newKelas}
                    onChange={(e) => setNewKelas(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 cursor-pointer"
                  >
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((letter) => (
                      <option key={letter} value={`${newTingkat}-${letter}`}>
                        {newTingkat}-{letter}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Ruang Ujian:</label>
                <select
                  value={newRuang}
                  onChange={(e) => setNewRuang(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Lab Komputer 1">Lab Komputer 1</option>
                  <option value="Lab Komputer 2">Lab Komputer 2</option>
                  <option value="Ruang Multimedia 1">Ruang Multimedia 1</option>
                  <option value="Ruang Multimedia 2">Ruang Multimedia 2</option>
                  <option value="Ruang Kelas 01">Ruang Kelas 01</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kartu Ujian Cetak Pratinjau */}
      {showPrintCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pratinjau Kartu Peserta Ujian (Format Resmi)
                </h3>
                <p className="text-xs text-slate-500">
                  SMP Negeri 01 Banding Agung - Tahun Pelajaran 2025/2026
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Dokumen
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-2">
              {paginatedStudents.slice(0, 4).map((std) => (
                <div
                  key={std.id}
                  className="border-2 border-slate-900 rounded-xl p-3.5 bg-white text-xs space-y-2.5 relative shadow-xs"
                >
                  {/* Card Header with Tut Wuri Handayani Logo */}
                  <div className="flex items-center gap-2.5 border-b border-slate-300 pb-2">
                    <TutWuriLogo className="w-10 h-10 shrink-0" />
                    <div className="flex-1 leading-tight">
                      <p className="font-extrabold text-[11px] uppercase tracking-tight text-slate-900">
                        KARTU PESERTA UJIAN CBT
                      </p>
                      <p className="text-[10px] text-blue-700 font-bold uppercase">
                        SMP NEGERI 01 BANDING AGUNG
                      </p>
                      <p className="text-[9px] text-slate-500">
                        Tahun Pelajaran 2025/2026
                      </p>
                    </div>
                    <div className="text-right">
                      <QrCodeComponent value={std.username} size={42} />
                    </div>
                  </div>

                  {/* Student Credentials */}
                  <div className="space-y-1 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">No. Peserta:</span>
                      <span className="font-mono font-bold text-slate-900">{std.nomorPeserta}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">NISN:</span>
                      <span className="font-mono font-bold text-blue-700">{std.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama Siswa:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[170px]">{std.nama}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kelas / Ruang:</span>
                      <span className="font-medium text-slate-800">{std.kelas} / {std.ruangUjian}</span>
                    </div>
                  </div>

                  {/* Scannable Barcode for Table Attendance */}
                  <div className="pt-1 flex flex-col items-center">
                    <BarcodeSvg value={std.username} height={26} className="w-full" />
                  </div>

                  {/* Footer & Signature */}
                  <div className="pt-1.5 border-t border-dashed border-slate-300 text-[9px] text-slate-500 flex justify-between items-center">
                    <span>Status: {std.sudahAktivasi ? 'Terverifikasi' : 'Belum Aktivasi'}</span>
                    <span className="font-bold text-slate-700">Ttd Pengawas: ...........</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setShowPrintCardModal(false)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportSuccess={(newUsers) => {
          onImportStudents(newUsers);
          onRefreshData();
        }}
      />

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={showGoogleSheetsModal}
        onClose={() => setShowGoogleSheetsModal(false)}
        schedule={{
          id: 'sch_db_export',
          bankId: 'bank_ipa_01',
          namaUjian: 'Database Utama Siswa & Presensi CBT SMPN 01 Banding Agung',
          mataPelajaran: 'Seluruh Siswa (Kelas VII, VIII, IX)',
          tingkat: 'IX',
          durasiMenit: 90,
          waktuMulai: new Date().toISOString(),
          waktuSelesai: new Date(Date.now() + 3600000).toISOString(),
          tokenUjian: 'SMP01B',
          tokenAktif: true,
          acakSoal: true,
          acakOpsi: false,
          tampilkanNilaiLangsung: true,
          pengawasNama: 'Operator Sekolah',
          ruang: 'Lab Komputer & Ruang Multimedia',
          status: 'aktif',
        }}
        students={students}
        sessions={[]}
      />
    </div>
  );
};
