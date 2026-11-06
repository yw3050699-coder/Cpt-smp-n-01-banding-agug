/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  QuestionBank,
  QuestionItem,
  ExamSchedule,
  ExamSession,
  ProctorAlert,
} from './types';
import {
  getCurrentUser,
  setCurrentUser,
  getStaffUsers,
  getStudentUsers,
  getQuestionBanks,
  getQuestions,
  getExamSchedules,
  getExamSessions,
  getProctorAlerts,
  resetSystemData,
  saveStudentUsers,
  isUserLoggedIn,
  logoutUser,
} from './lib/storage';
import { Navbar } from './components/Navbar';
import { AuthPage } from './components/auth/AuthPage';
import { UserManagement } from './components/admin/UserManagement';
import { LoadTestRunner } from './components/admin/LoadTestRunner';
import { SqlMigrationViewer } from './components/admin/SqlMigrationViewer';
import { QuestionBankManager } from './components/guru/QuestionBank';
import { ExamPackageManager } from './components/guru/ExamPackageManager';
import { EssayGrading } from './components/guru/EssayGrading';
import { ProctorDashboard } from './components/pengawas/ProctorDashboard';
import { PrincipalDashboard } from './components/kepala/PrincipalDashboard';
import { CbtExamPlayer } from './components/cbt/CbtExamPlayer';
import { ExamRules } from './components/cbt/ExamRules';
import { ExamHistory } from './components/cbt/ExamHistory';
import { ActivationModal } from './components/auth/ActivationModal';
import { BarcodeAttendanceScanner } from './components/pengawas/BarcodeAttendanceScanner';

export default function App() {
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile>(getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isUserLoggedIn());
  const [activeTab, setActiveTab] = useState<string>('siswa');

  // Master records
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [alerts, setAlerts] = useState<ProctorAlert[]>([]);

  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

  const refreshAllData = () => {
    setStudents(getStudentUsers());
    setStaff(getStaffUsers());
    setQuestionBanks(getQuestionBanks());
    setQuestions(getQuestions());
    setSchedules(getExamSchedules());
    setSessions(getExamSessions());
    setAlerts(getProctorAlerts());
    setCurrentUserProfile(getCurrentUser());
    setIsLoggedIn(isUserLoggedIn());
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const getDefaultTabForRole = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'siswa';
      case 'guru': return 'bank_soal';
      case 'pengawas': return 'monitoring';
      case 'kepala_sekolah': return 'ringkasan';
      case 'siswa': return 'konfirmasi';
    }
  };

  // Switch role handler (also ensures login is marked true)
  const handleSwitchRole = (role: UserRole) => {
    let targetUser: UserProfile | undefined;
    const allStaff = getStaffUsers();
    const allStudents = getStudentUsers();

    if (role === 'admin') {
      targetUser = allStaff.find((u) => u.role === 'admin') || allStaff[0];
    } else if (role === 'guru') {
      targetUser = allStaff.find((u) => u.role === 'guru') || allStaff[0];
    } else if (role === 'pengawas') {
      targetUser = allStaff.find((u) => u.role === 'pengawas') || allStaff[0];
    } else if (role === 'kepala_sekolah') {
      targetUser = allStaff.find((u) => u.role === 'kepala_sekolah') || allStaff[0];
    } else {
      // Siswa
      targetUser = allStudents.find((s) => s.tingkat === 'IX') || allStudents[0];
    }

    if (targetUser) {
      setCurrentUser(targetUser);
      setCurrentUserProfile(targetUser);
      setIsLoggedIn(true);
      setActiveTab(getDefaultTabForRole(role));
    }
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUserProfile(user);
    setIsLoggedIn(true);
    setActiveTab(getDefaultTabForRole(user.role));
    refreshAllData();
  };

  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
    setActiveTab('beranda_login');
  };

  const handleResetData = () => {
    if (confirm('Kembalikan seluruh data simulasi ke kondisi awal pabrik?')) {
      resetSystemData();
      refreshAllData();
      setIsLoggedIn(false);
      setActiveTab('beranda_login');
    }
  };

  const handleAddStudent = (newStudent: UserProfile) => {
    const updated = [newStudent, ...students];
    saveStudentUsers(updated);
    setStudents(updated);
  };

  const handleImportStudents = (imported: UserProfile[]) => {
    const updated = [...imported, ...students];
    saveStudentUsers(updated);
    setStudents(updated);
  };

  const activeSchedule = schedules.find((s) => s.status === 'aktif') || schedules[0] || {
    id: 'sch_default',
    bankId: 'bank_ipa_01',
    namaUjian: 'Penilaian Akhir Semester (PAS) IPA Kelas IX',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    tingkat: 'IX' as const,
    durasiMenit: 60,
    waktuMulai: new Date().toISOString(),
    waktuSelesai: new Date(Date.now() + 3600000).toISOString(),
    tokenUjian: 'SMP01B',
    tokenAktif: true,
    acakSoal: true,
    acakOpsi: false,
    tampilkanNilaiLangsung: true,
    pengawasNama: 'Rudi Santoso, S.Kom',
    ruang: 'Lab Komputer 1',
    status: 'aktif' as const,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Universal Top Navigation */}
      <Navbar
        currentUser={currentUserProfile}
        isLoggedIn={isLoggedIn}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onSwitchRole={handleSwitchRole}
        onOpenActivation={() => setIsActivationModalOpen(true)}
        onResetData={handleResetData}
        onLogout={handleLogout}
        onOpenAuth={() => {
          setIsLoggedIn(false);
          setActiveTab('beranda_login');
        }}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ============================================================== */}
        {/* NOT LOGGED IN: LOGIN & REGISTRATION / PUBLIC PORTAL */}
        {/* ============================================================== */}
        {!isLoggedIn ? (
          <>
            {activeTab === 'tata_tertib' ? (
              <ExamRules onGoToExam={() => setActiveTab('beranda_login')} />
            ) : activeTab === 'jadwal_info' ? (
              <div className="max-w-3xl mx-auto space-y-4 py-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900">
                    Jadwal Asesmen Ujian Online SMP Negeri 01 Banding Agung
                  </h2>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {schedules.map((sch) => (
                      <div key={sch.id} className="p-4 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{sch.namaUjian}</p>
                          <p className="text-slate-500">
                            Kelas {sch.tingkat} · {sch.mataPelajaran} · {sch.durasiMenit} Menit
                          </p>
                        </div>
                        <span className="font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-bold">
                          Ruang: {sch.ruang}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('beranda_login')}
                    className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 cursor-pointer"
                  >
                    Kembali ke Menu Masuk / Daftar Akun
                  </button>
                </div>
              </div>
            ) : (
              <AuthPage onLoginSuccess={handleLoginSuccess} />
            )}
          </>
        ) : (
          /* ============================================================== */
          /* LOGGED IN VIEW BASED ON USER ROLE */
          /* ============================================================== */
          <>
            {/* ROLE: ADMIN (Operator Sekolah) */}
            {currentUserProfile.role === 'admin' && (
              <>
                {activeTab === 'siswa' && (
                  <UserManagement
                    students={students}
                    staff={staff}
                    onRefreshData={refreshAllData}
                    onAddStudent={handleAddStudent}
                    onImportStudents={handleImportStudents}
                  />
                )}
                {activeTab === 'absensi_barcode' && (
                  <BarcodeAttendanceScanner
                    students={students}
                    schedule={activeSchedule}
                    sessions={sessions}
                    onRefreshData={refreshAllData}
                  />
                )}
                {activeTab === 'loadtest' && <LoadTestRunner />}
                {activeTab === 'migration' && <SqlMigrationViewer />}
              </>
            )}

            {/* ROLE: GURU (Mata Pelajaran) */}
            {currentUserProfile.role === 'guru' && (
              <>
                {activeTab === 'bank_soal' && (
                  <QuestionBankManager
                    banks={questionBanks}
                    questions={questions}
                    onRefreshData={refreshAllData}
                  />
                )}
                {activeTab === 'paket_ujian' && (
                  <ExamPackageManager
                    schedules={schedules}
                    banks={questionBanks}
                    onRefreshData={refreshAllData}
                  />
                )}
                {activeTab === 'koreksi_esai' && (
                  <EssayGrading
                    sessions={sessions}
                    questions={questions}
                    onRefreshData={refreshAllData}
                  />
                )}
              </>
            )}

            {/* ROLE: PENGAWAS (Ruang Ujian) */}
            {currentUserProfile.role === 'pengawas' && (
              <>
                {activeTab === 'absensi_barcode' ? (
                  <BarcodeAttendanceScanner
                    students={students}
                    schedule={activeSchedule}
                    sessions={sessions}
                    onRefreshData={refreshAllData}
                  />
                ) : (
                  <ProctorDashboard
                    sessions={sessions}
                    schedule={activeSchedule}
                    alerts={alerts}
                    onRefreshData={refreshAllData}
                  />
                )}
              </>
            )}

            {/* ROLE: KEPALA SEKOLAH (Eksekutif) */}
            {currentUserProfile.role === 'kepala_sekolah' && (
              <PrincipalDashboard
                students={students}
                sessions={sessions}
                schedule={activeSchedule}
              />
            )}

            {/* ROLE: SISWA (CBT Peserta Ujian) */}
            {currentUserProfile.role === 'siswa' && (
              <>
                {activeTab === 'konfirmasi' && (
                  <CbtExamPlayer
                    currentUser={currentUserProfile}
                    schedule={activeSchedule}
                    questions={questions}
                    onFinishExam={() => {
                      refreshAllData();
                      setActiveTab('hasil');
                    }}
                  />
                )}
                {activeTab === 'petunjuk' && (
                  <ExamRules onGoToExam={() => setActiveTab('konfirmasi')} />
                )}
                {activeTab === 'hasil' && (
                  <ExamHistory
                    currentUser={currentUserProfile}
                    schedules={schedules}
                    sessions={sessions}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Global Student Activation Modal */}
      <ActivationModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        currentUser={currentUserProfile}
        students={students}
        onActivationSuccess={refreshAllData}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            E-POTING UJIAN ONLINE · SMP Negeri 01 Banding Agung © 2026
          </span>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Standar ANBK / CBT</span>
            <span>·</span>
            <span>200+ Peserta Aktif</span>
            <span>·</span>
            <span>Supabase RLS Enforced</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
