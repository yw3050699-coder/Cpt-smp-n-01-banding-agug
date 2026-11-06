import React from 'react';
import { UserProfile, UserRole } from '../types';
import { LogOut, UserCheck, Shield, BookOpen, Monitor, Award, RefreshCw, LogIn, Scan } from 'lucide-react';
import { TutWuriLogo } from './common/TutWuriLogo';

interface NavbarProps {
  currentUser: UserProfile;
  isLoggedIn: boolean;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onSwitchRole: (role: UserRole) => void;
  onOpenActivation: () => void;
  onResetData: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  isLoggedIn,
  activeTab,
  onSelectTab,
  onSwitchRole,
  onOpenActivation,
  onResetData,
  onLogout,
  onOpenAuth,
}) => {
  const getNavItems = () => {
    if (!isLoggedIn) {
      return [
        { id: 'beranda_login', label: 'Portal Masuk & Registrasi' },
        { id: 'jadwal_info', label: 'Jadwal Asesmen' },
        { id: 'tata_tertib', label: 'Tata Tertib CBT' },
      ];
    }

    switch (currentUser.role) {
      case 'admin':
        return [
          { id: 'siswa', label: 'Data 200+ Siswa' },
          { id: 'absensi_barcode', label: 'Absensi Barcode' },
          { id: 'loadtest', label: 'Uji Beban 200' },
          { id: 'migration', label: 'SQL & Supabase' },
        ];
      case 'guru':
        return [
          { id: 'bank_soal', label: 'Bank Soal (PG & Esai)' },
          { id: 'paket_ujian', label: 'Paket & Jadwal' },
          { id: 'koreksi_esai', label: 'Koreksi Esai' },
        ];
      case 'pengawas':
        return [
          { id: 'monitoring', label: 'Monitoring Ruang' },
          { id: 'absensi_barcode', label: 'Absensi Barcode' },
          { id: 'token_rilis', label: 'Token Ujian' },
          { id: 'log_pelanggaran', label: 'Log Aktivitas' },
        ];
      case 'kepala_sekolah':
        return [
          { id: 'ringkasan', label: 'Eksekutif Dashboard' },
          { id: 'rekap_nilai', label: 'Rekapitulasi Nilai' },
          { id: 'laporan_cetak', label: 'Format Cetak Resmi' },
        ];
      case 'siswa':
      default:
        return [
          { id: 'konfirmasi', label: 'Ruang Ujian CBT' },
          { id: 'petunjuk', label: 'Tata Tertib Ujian' },
          { id: 'hasil', label: 'Riwayat Ujian' },
        ];
    }
  };

  const navItems = getNavItems();

  const getRoleBadgeLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Admin Operator';
      case 'guru': return 'Guru Mapel';
      case 'pengawas': return 'Pengawas Lab';
      case 'kepala_sekolah': return 'Kepala Sekolah';
      case 'siswa': return `Siswa ${currentUser.kelas || 'CBT'}`;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark with Tut Wuri Handayani Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab(navItems[0]?.id || 'home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <TutWuriLogo className="w-9 h-9 shrink-0 drop-shadow-2xs transition-transform group-hover:scale-105" />
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 block leading-tight">
                  E-POTING CBT
                </span>
                <span className="block text-[11px] text-slate-500 font-normal leading-tight">
                  SMP Negeri 01 Banding Agung
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-5 Clean Single-Line Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 -mb-[1px] cursor-pointer ${
                    isActive
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action & Multi-Role Simulator Dropdown */}
          <div className="flex items-center gap-3 shrink-0">
            {!isLoggedIn ? (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk / Daftar Akun</span>
              </button>
            ) : (
              <>
                {/* Quick role selector for testing and grading */}
                <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 text-xs">
                  <span className="text-slate-500 px-2 font-medium hidden lg:inline">Peran:</span>
                  <select
                    value={currentUser.role}
                    onChange={(e) => onSwitchRole(e.target.value as UserRole)}
                    className="bg-white border border-slate-200 text-slate-800 text-xs rounded-md px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    aria-label="Ganti Peran Uji Coba"
                  >
                    <option value="siswa">Siswa (CBT Peserta)</option>
                    <option value="guru">Guru (Bank Soal & Esai)</option>
                    <option value="pengawas">Pengawas (Monitoring)</option>
                    <option value="kepala_sekolah">Kepala Sekolah (Laporan)</option>
                    <option value="admin">Admin (Data 200+ Siswa)</option>
                  </select>
                </div>

                {/* User Profile summary */}
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
                    {currentUser.nama.split(' ')[0]} {currentUser.nama.split(' ')[1] || ''}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {getRoleBadgeLabel(currentUser.role)}
                  </span>
                </div>

                {/* Activation Button or Reset Helper */}
                {currentUser.role === 'admin' && (
                  <button
                    onClick={onResetData}
                    title="Reset Data Demo ke Kondisi Awal"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}

                {currentUser.role === 'siswa' && !currentUser.sudahAktivasi && (
                  <button
                    onClick={onOpenActivation}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Aktivasi
                  </button>
                )}

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  title="Keluar dari Akun"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden xl:inline text-xs font-medium text-slate-600 hover:text-rose-600">
                    Keluar
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-4 border-t border-slate-100 text-xs no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`whitespace-nowrap shrink-0 pb-1 font-medium cursor-pointer ${
                activeTab === item.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
