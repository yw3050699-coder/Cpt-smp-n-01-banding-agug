import React, { useState } from 'react';
import { UserProfile, UserRole, StudentGrade } from '../../types';
import {
  loginUser,
  registerStudentUser,
  registerStaffUser,
  getStaffUsers,
  getStudentUsers,
} from '../../lib/storage';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  School,
  KeyRound,
  ShieldCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

import { TutWuriLogo } from '../common/TutWuriLogo';

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // --- LOGIN STATES ---
  const [loginRoleCategory, setLoginRoleCategory] = useState<'siswa' | 'staff'>('siswa');
  const [loginIdentifier, setLoginIdentifier] = useState('0081000001'); // default to student 1 for convenience
  const [loginPassword, setLoginPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- REGISTRATION STATES ---
  const [regType, setRegType] = useState<'siswa' | 'staff'>('siswa');

  // Student registration
  const [regNisn, setRegNisn] = useState('');
  const [regNama, setRegNama] = useState('');
  const [regTingkat, setRegTingkat] = useState<StudentGrade>('IX');
  const [regKelas, setRegKelas] = useState('IX-A');
  const [regRuang, setRegRuang] = useState('Lab Komputer 1');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSchoolCode, setRegSchoolCode] = useState('SMPN1BA-2026');

  // Staff registration
  const [regStaffNip, setRegStaffNip] = useState('');
  const [regStaffNama, setRegStaffNama] = useState('');
  const [regStaffRole, setRegStaffRole] = useState<'guru' | 'pengawas'>('guru');
  const [regStaffMapel, setRegStaffMapel] = useState('Ilmu Pengetahuan Alam (IPA)');
  const [regStaffEmail, setRegStaffEmail] = useState('');
  const [regStaffPassword, setRegStaffPassword] = useState('');
  const [regStaffCode, setRegStaffCode] = useState('GURU-SMPN1BA');

  const [regError, setRegError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = loginUser(loginIdentifier, loginPassword);
      setIsSubmitting(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setLoginError(res.message || 'Login gagal. Periksa kembali username dan password.');
      }
    }, 250);
  };

  // Quick Demo Login Handler
  const handleQuickDemoLogin = (targetUsername: string, defaultPw = '123456') => {
    setLoginIdentifier(targetUsername);
    setLoginPassword(defaultPw);
    setLoginError('');

    const res = loginUser(targetUsername, defaultPw);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      // In case password wasn't matched, force bypass for demo testing
      const allStaff = getStaffUsers();
      const allStudents = getStudentUsers();
      const found =
        allStaff.find((s) => s.username === targetUsername) ||
        allStudents.find((s) => s.username === targetUsername);
      if (found) {
        onLoginSuccess(found);
      }
    }
  };

  // Handle Student Registration
  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMsg('');

    if (regPassword && regPassword !== regConfirmPassword) {
      setRegError('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = registerStudentUser({
        nisn: regNisn,
        nama: regNama,
        kelas: regKelas,
        tingkat: regTingkat,
        ruangUjian: regRuang,
        password: regPassword || '123456',
        kodeOtorisasi: regSchoolCode,
      });

      setIsSubmitting(false);
      if (res.success && res.user) {
        setRegSuccessMsg('Pendaftaran akun siswa berhasil! Membuka sesi ujian...');
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 1200);
      } else {
        setRegError(res.message || 'Gagal mendaftarkan akun siswa.');
      }
    }, 350);
  };

  // Handle Staff Registration
  const handleRegisterStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMsg('');

    setIsSubmitting(true);
    setTimeout(() => {
      const res = registerStaffUser({
        username: regStaffNip,
        nama: regStaffNama,
        role: regStaffRole,
        mataPelajaran: regStaffRole === 'guru' ? regStaffMapel : undefined,
        email: regStaffEmail,
        password: regStaffPassword || '123456',
        kodeOtorisasi: regStaffCode,
      });

      setIsSubmitting(false);
      if (res.success && res.user) {
        setRegSuccessMsg('Pendaftaran akun tenaga pendidik berhasil! Mengarahkan ke dashboard...');
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 1200);
      } else {
        setRegError(res.message || 'Gagal mendaftarkan akun staf/guru.');
      }
    }, 350);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* School Header Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 text-center space-y-2 relative overflow-hidden">
          <div className="flex justify-center mb-1">
            <TutWuriLogo className="w-16 h-16 drop-shadow-md" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            E-POTING CBT ONLINE
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            SMP Negeri 01 Banding Agung · OKU Selatan
          </p>
          <p className="text-[11px] text-slate-400">
            Sistem Asesmen Terpadu: Siswa Kelas VII, VIII, IX, Guru, Pengawas & Kepala Sekolah
          </p>
        </div>

        {/* Tab Switcher: Masuk vs Daftar Akun */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
            }}
            className={`flex-1 py-3.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 -mb-[1px] ${
              activeTab === 'login'
                ? 'bg-white border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk ke Akun (Login)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setRegError('');
            }}
            className={`flex-1 py-3.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 -mb-[1px] ${
              activeTab === 'register'
                ? 'bg-white border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Daftar Akun Baru</span>
          </button>
        </div>

        {/* TAB 1: MASUK (LOGIN) */}
        {activeTab === 'login' && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Category Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Pilih Tipe Pengguna:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginRoleCategory('siswa');
                    setLoginIdentifier('0081000001'); // NISN sample
                    setLoginError('');
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    loginRoleCategory === 'siswa'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Siswa Peserta Ujian</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginRoleCategory('staff');
                    setLoginIdentifier('admin'); // Default admin/guru
                    setLoginError('');
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    loginRoleCategory === 'staff'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Guru / Pengawas / Admin</span>
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {loginRoleCategory === 'siswa'
                    ? 'Nomor Induk Siswa Nasional (NISN):'
                    : 'NIP / Username Pengguna:'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder={
                      loginRoleCategory === 'siswa'
                        ? 'Contoh: 0081000001'
                        : 'Contoh: admin / guru_ipa / pengawas_01'
                    }
                    value={loginIdentifier}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      setLoginError('');
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Kata Sandi / PIN Akun:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi..."
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError('');
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Ingat sesi saya di gawai ini</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Belum punya akun?
                </button>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                {isSubmitting ? 'Memverifikasi Kredensial...' : 'Masuk ke Sistem Ujian'}
              </button>
            </form>

            {/* Quick Demo Login Shortcut Strip */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Uji Coba Cepat Akun Demo (1-Klik Masuk Langsung):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('0081000001')}
                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold block text-blue-700">Siswa (IX-A)</span>
                  <span className="text-[10px] text-slate-500">Aditya Pratama</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('guru_ipa')}
                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold block text-blue-700">Guru IPA</span>
                  <span className="text-[10px] text-slate-500">Dra. Sri Wahyuni</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('guru_mtk')}
                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold block text-blue-700">Guru MTK</span>
                  <span className="text-[10px] text-slate-500">Ahmad Fauzi, M.Pd</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('pengawas_01')}
                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold block text-blue-700">Pengawas Lab</span>
                  <span className="text-[10px] text-slate-500">Rudi Santoso, S.Kom</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('kepsek')}
                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold block text-blue-700">Kepala Sekolah</span>
                  <span className="text-[10px] text-slate-500">Drs. H. M. Ilyas</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold block text-blue-700">Admin Operator</span>
                  <span className="text-[10px] text-slate-500">Heri Kurniawan</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DAFTAR AKUN BARU (REGISTRASI) */}
        {activeTab === 'register' && (
          <div className="p-6 sm:p-8 space-y-5">
            {/* Sub-selector: Siswa vs Guru */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Pilih Kategori Pendaftaran:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRegType('siswa');
                    setRegError('');
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    regType === 'siswa'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Daftar Sebagai Siswa</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegType('staff');
                    setRegError('');
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    regType === 'staff'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Daftar Guru / Pengawas</span>
                </button>
              </div>
            </div>

            {/* FORM REGISTRASI SISWA */}
            {regType === 'siswa' ? (
              <form onSubmit={handleRegisterStudent} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      NISN (10 Digit):
                    </label>
                    <input
                      type="text"
                      required
                      pattern="[0-9]{8,12}"
                      placeholder="Contoh: 0082910099"
                      value={regNisn}
                      onChange={(e) => setRegNisn(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Nama Lengkap Siswa:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama sesuai raport..."
                      value={regNama}
                      onChange={(e) => setRegNama(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tingkat:</label>
                    <select
                      value={regTingkat}
                      onChange={(e) => {
                        const t = e.target.value as StudentGrade;
                        setRegTingkat(t);
                        setRegKelas(`${t}-A`);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs cursor-pointer"
                    >
                      <option value="VII">Kelas VII</option>
                      <option value="VIII">Kelas VIII</option>
                      <option value="IX">Kelas IX</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Rombel:</label>
                    <select
                      value={regKelas}
                      onChange={(e) => setRegKelas(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs cursor-pointer"
                    >
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((letter) => (
                        <option key={letter} value={`${regTingkat}-${letter}`}>
                          {regTingkat}-{letter}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Ruang Ujian:</label>
                    <select
                      value={regRuang}
                      onChange={(e) => setRegRuang(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs cursor-pointer"
                    >
                      <option value="Lab Komputer 1">Lab Komputer 1</option>
                      <option value="Lab Komputer 2">Lab Komputer 2</option>
                      <option value="Lab Komputer 3">Lab Komputer 3</option>
                      <option value="Ruang Multimedia 1">Ruang Multimedia 1</option>
                      <option value="Ruang Multimedia 2">Ruang Multimedia 2</option>
                      <option value="Ruang CBT 01">Ruang CBT 01</option>
                      <option value="Ruang CBT 02">Ruang CBT 02</option>
                      <option value="Ruang CBT 03">Ruang CBT 03</option>
                      <option value="Ruang CBT 04">Ruang CBT 04</option>
                      <option value="Ruang CBT 05">Ruang CBT 05</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Kata Sandi / PIN:
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Ulangi Kata Sandi:
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Ketik ulang kata sandi"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                    <span>Kode Otorisasi Registrasi Sekolah:</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Default: SMPN1BA-2026
                    </span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="SMPN1BA-2026"
                      value={regSchoolCode}
                      onChange={(e) => setRegSchoolCode(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    *Mencegah pendaftaran pihak luar; diperoleh dari panitia ujian SMPN 01 Banding Agung.
                  </p>
                </div>

                {regError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{regSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs mt-2"
                >
                  {isSubmitting ? 'Mendaftarkan Akun Siswa...' : 'Daftar & Langsung Masuk CBT'}
                </button>
              </form>
            ) : (
              /* FORM REGISTRASI GURU / PENGAWAS */
              <form onSubmit={handleRegisterStaff} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      NIP / NUPTK / Username:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 198801152011011002"
                      value={regStaffNip}
                      onChange={(e) => setRegStaffNip(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Nama Lengkap beserta Gelar:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Nurul Hidayah, S.Pd"
                      value={regStaffNama}
                      onChange={(e) => setRegStaffNama(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Peran Tenaga Pendidik:
                    </label>
                    <select
                      value={regStaffRole}
                      onChange={(e) => setRegStaffRole(e.target.value as 'guru' | 'pengawas')}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs cursor-pointer"
                    >
                      <option value="guru">Guru Mata Pelajaran</option>
                      <option value="pengawas">Pengawas Ruang Ujian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      {regStaffRole === 'guru' ? 'Mata Pelajaran yang Diampu:' : 'Ruang Ujian:'}
                    </label>
                    {regStaffRole === 'guru' ? (
                      <select
                        value={regStaffMapel}
                        onChange={(e) => setRegStaffMapel(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs cursor-pointer"
                      >
                        <option value="Ilmu Pengetahuan Alam (IPA)">Ilmu Pengetahuan Alam (IPA)</option>
                        <option value="Matematika">Matematika</option>
                        <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                        <option value="Bahasa Inggris">Bahasa Inggris</option>
                        <option value="Pendidikan Pancasila (PPKn)">PPKn</option>
                        <option value="Ilmu Pengetahuan Sosial (IPS)">IPS</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value="Lab Komputer 1 & 2"
                        readOnly
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Email Dinas / Pribadi:
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="nama@sekolah.sch.id"
                      value={regStaffEmail}
                      onChange={(e) => setRegStaffEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Kata Sandi Akun:
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={regStaffPassword}
                      onChange={(e) => setRegStaffPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                    <span>Kode Khusus Pendidik dari Operator Sekolah:</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Default: GURU-SMPN1BA
                    </span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="GURU-SMPN1BA"
                      value={regStaffCode}
                      onChange={(e) => setRegStaffCode(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {regError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{regSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs mt-2"
                >
                  {isSubmitting ? 'Mendaftarkan Pendidik...' : 'Daftar Tenaga Pendidik & Masuk'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
