import {
  UserProfile,
  QuestionBank,
  QuestionItem,
  ExamSchedule,
  ExamSession,
  StudentAnswer,
  ProctorAlert,
  LoadTestMetrics
} from '../types';
import {
  INITIAL_STAFF_USERS,
  generateStudentsList,
  INITIAL_QUESTION_BANKS,
  INITIAL_QUESTIONS,
  INITIAL_EXAM_SCHEDULES,
  generateInitialExamSessions,
} from './sampleData';

const STORAGE_KEYS = {
  CURRENT_USER: 'epoting_current_user',
  IS_LOGGED_IN: 'epoting_is_logged_in',
  STAFF_USERS: 'epoting_staff_users',
  STUDENT_USERS: 'epoting_student_users',
  QUESTION_BANKS: 'epoting_question_banks',
  QUESTIONS: 'epoting_questions',
  EXAM_SCHEDULES: 'epoting_exam_schedules',
  EXAM_SESSIONS: 'epoting_exam_sessions',
  STUDENT_ANSWERS: 'epoting_student_answers_', // + sessionId
  PROCTOR_ALERTS: 'epoting_proctor_alerts',
};

// Initialize default storage data if not present
export function initLocalStorage(): void {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.STAFF_USERS)) {
      localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(INITIAL_STAFF_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENT_USERS)) {
      const initialStudents = generateStudentsList(1000);
      localStorage.setItem(STORAGE_KEYS.STUDENT_USERS, JSON.stringify(initialStudents));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUESTION_BANKS)) {
      localStorage.setItem(STORAGE_KEYS.QUESTION_BANKS, JSON.stringify(INITIAL_QUESTION_BANKS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS)) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXAM_SCHEDULES)) {
      localStorage.setItem(STORAGE_KEYS.EXAM_SCHEDULES, JSON.stringify(INITIAL_EXAM_SCHEDULES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS)) {
      const students = getStudentUsers();
      const initialSessions = generateInitialExamSessions(students);
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(initialSessions));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROCTOR_ALERTS)) {
      const initialAlerts: ProctorAlert[] = [
        {
          id: 'alt_1',
          timestamp: new Date(Date.now() - 15 * 60000).toLocaleTimeString('id-ID'),
          siswaNama: 'Alif Wijaya',
          siswaKelas: 'IX-A',
          pesan: 'Terdeteksi berpindah tab (Pelanggaran ke-1)',
          tipe: 'peringatan',
        },
        {
          id: 'alt_2',
          timestamp: new Date(Date.now() - 5 * 60000).toLocaleTimeString('id-ID'),
          siswaNama: 'Dimas Santoso',
          siswaKelas: 'IX-B',
          pesan: 'Terdeteksi minimize browser lebih dari 5 detik (Pelanggaran ke-3)',
          tipe: 'pelanggaran',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.PROCTOR_ALERTS, JSON.stringify(initialAlerts));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      // Default to admin for immediate exploration
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_STAFF_USERS[0]));
    }
  } catch (err) {
    console.error('Error initializing local storage:', err);
  }
}

// User state & Authentication
export function isUserLoggedIn(): boolean {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
  return raw === 'true';
}

export function setLoggedInState(isLoggedIn: boolean): void {
  localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, String(isLoggedIn));
}

export function getCurrentUser(): UserProfile {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  return INITIAL_STAFF_USERS[0];
}

export function setCurrentUser(user: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  setLoggedInState(true);
}

export function logoutUser(): void {
  setLoggedInState(false);
}

export function loginUser(
  identifier: string,
  password?: string
): { success: boolean; user?: UserProfile; message?: string } {
  initLocalStorage();
  const cleanId = identifier.trim().toLowerCase();
  const staff = getStaffUsers();
  const students = getStudentUsers();

  // 1. Check in Staff
  const staffFound = staff.find(
    (u) =>
      u.username.toLowerCase() === cleanId ||
      (u.email && u.email.toLowerCase() === cleanId)
  );

  if (staffFound) {
    // If password provided and user has a custom password, check it
    if (staffFound.password && password && staffFound.password !== password) {
      return { success: false, message: 'Kata sandi yang Anda masukkan salah.' };
    }
    setCurrentUser(staffFound);
    return { success: true, user: staffFound };
  }

  // 2. Check in Students
  const studentFound = students.find(
    (s) =>
      s.username.toLowerCase() === cleanId ||
      (s.email && s.email.toLowerCase() === cleanId) ||
      (s.nomorPeserta && s.nomorPeserta.toLowerCase() === cleanId)
  );

  if (studentFound) {
    if (!studentFound.sudahAktivasi) {
      return {
        success: false,
        message: 'Akun siswa belum diaktivasi. Silakan klik menu "Aktivasi Akun" atau gunakan Kode Registrasi Sekolah.',
      };
    }
    if (studentFound.password && password && studentFound.password !== password) {
      return { success: false, message: 'Kata sandi / PIN yang Anda masukkan salah.' };
    }
    setCurrentUser(studentFound);
    return { success: true, user: studentFound };
  }

  return {
    success: false,
    message: 'Akun tidak ditemukan. Pastikan NISN (siswa) atau NIP/Username (guru/staff) sudah benar.',
  };
}

export function registerStudentUser(params: {
  nisn: string;
  nama: string;
  kelas: string;
  tingkat: 'VII' | 'VIII' | 'IX';
  ruangUjian?: string;
  password?: string;
  kodeOtorisasi: string;
}): { success: boolean; user?: UserProfile; message?: string } {
  initLocalStorage();
  if (params.kodeOtorisasi.trim().toUpperCase() !== 'SMPN1BA-2026') {
    return {
      success: false,
      message: 'Kode Otorisasi Sekolah tidak valid! Harap minta kode resmi ke panitia ujian SMPN 01 Banding Agung.',
    };
  }

  const students = getStudentUsers();
  const existingIdx = students.findIndex((s) => s.username === params.nisn.trim());

  if (existingIdx >= 0) {
    // Student was pre-loaded by school admin, now fully activating & registering credentials
    const updated = {
      ...students[existingIdx],
      nama: params.nama.trim(),
      kelas: params.kelas,
      tingkat: params.tingkat,
      ruangUjian: params.ruangUjian || students[existingIdx].ruangUjian || 'Lab Komputer 1',
      sudahAktivasi: true,
      password: params.password,
    };
    students[existingIdx] = updated;
    saveStudentUsers(students);
    setCurrentUser(updated);
    return { success: true, user: updated };
  }

  // Brand new student record
  const newStudent: UserProfile = {
    id: `std_reg_${Date.now()}`,
    username: params.nisn.trim(),
    nama: params.nama.trim(),
    role: 'siswa',
    kelas: params.kelas,
    tingkat: params.tingkat,
    nomorPeserta: `01-${params.tingkat === 'VII' ? '07' : params.tingkat === 'VIII' ? '08' : '09'}-${Math.floor(
      100 + Math.random() * 900
    )}`,
    ruangUjian: params.ruangUjian || 'Lab Komputer 1',
    statusAktif: true,
    sudahAktivasi: true,
    password: params.password,
    email: `siswa.${params.nisn.trim()}@smpn1ba.sch.id`,
    created_at: new Date().toISOString(),
  };

  students.unshift(newStudent);
  saveStudentUsers(students);
  setCurrentUser(newStudent);
  return { success: true, user: newStudent };
}

export function registerStaffUser(params: {
  username: string;
  nama: string;
  role: 'guru' | 'pengawas';
  mataPelajaran?: string;
  ruangUjian?: string;
  email: string;
  password?: string;
  kodeOtorisasi: string;
}): { success: boolean; user?: UserProfile; message?: string } {
  initLocalStorage();
  if (params.kodeOtorisasi.trim().toUpperCase() !== 'GURU-SMPN1BA') {
    return {
      success: false,
      message: 'Kode Otorisasi Guru tidak valid! Harap minta kode resmi ke operator SMPN 01 Banding Agung.',
    };
  }

  const staff = getStaffUsers();
  if (staff.some((u) => u.username.toLowerCase() === params.username.trim().toLowerCase())) {
    return { success: false, message: 'NIP / Username ini sudah terdaftar sebagai tenaga pendidik.' };
  }

  const newStaff: UserProfile = {
    id: `staff_${Date.now()}`,
    username: params.username.trim(),
    nama: params.nama.trim(),
    role: params.role,
    email: params.email.trim(),
    mataPelajaran: params.mataPelajaran,
    ruangUjian: params.ruangUjian,
    statusAktif: true,
    sudahAktivasi: true,
    password: params.password,
    created_at: new Date().toISOString(),
  };

  staff.push(newStaff);
  saveStaffUsers(staff);
  setCurrentUser(newStaff);
  return { success: true, user: newStaff };
}

export function getStaffUsers(): UserProfile[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.STAFF_USERS);
  return raw ? JSON.parse(raw) : INITIAL_STAFF_USERS;
}

export function saveStaffUsers(users: UserProfile[]): void {
  localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(users));
}

export function getStudentUsers(): UserProfile[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.STUDENT_USERS);
  return raw ? JSON.parse(raw) : [];
}

export function saveStudentUsers(students: UserProfile[]): void {
  localStorage.setItem(STORAGE_KEYS.STUDENT_USERS, JSON.stringify(students));
}

export function populateStudentsTo1000(): UserProfile[] {
  const thousand = generateStudentsList(1000);
  saveStudentUsers(thousand);
  return thousand;
}

// Activate single student account
export function activateStudentAccount(id: string): boolean {
  const students = getStudentUsers();
  const idx = students.findIndex((s) => s.id === id);
  if (idx !== -1) {
    students[idx].sudahAktivasi = true;
    saveStudentUsers(students);
    return true;
  }
  return false;
}

// Bulk activate accounts by class
export function bulkActivateByClass(kelas: string): number {
  const students = getStudentUsers();
  let count = 0;
  students.forEach((s) => {
    if ((kelas === 'ALL' || s.kelas === kelas) && !s.sudahAktivasi) {
      s.sudahAktivasi = true;
      count++;
    }
  });
  saveStudentUsers(students);
  return count;
}

// Question Banks & Questions
export function getQuestionBanks(): QuestionBank[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.QUESTION_BANKS);
  return raw ? JSON.parse(raw) : INITIAL_QUESTION_BANKS;
}

export function saveQuestionBanks(banks: QuestionBank[]): void {
  localStorage.setItem(STORAGE_KEYS.QUESTION_BANKS, JSON.stringify(banks));
}

export function getQuestions(bankId?: string): QuestionItem[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
  const all: QuestionItem[] = raw ? JSON.parse(raw) : INITIAL_QUESTIONS;
  if (bankId) {
    return all.filter((q) => q.bankId === bankId);
  }
  return all;
}

export function saveQuestions(questions: QuestionItem[]): void {
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
}

export function addOrUpdateQuestion(item: QuestionItem): void {
  const all = getQuestions();
  const idx = all.findIndex((q) => q.id === item.id);
  if (idx >= 0) {
    all[idx] = item;
  } else {
    all.push(item);
  }
  saveQuestions(all);

  // Recalculate totals in question bank
  const banks = getQuestionBanks();
  const bank = banks.find((b) => b.id === item.bankId);
  if (bank) {
    const bankQuestions = all.filter((q) => q.bankId === item.bankId);
    bank.jumlahPilihanGanda = bankQuestions.filter((q) => q.tipe === 'pilihan_ganda').length;
    bank.jumlahEsai = bankQuestions.filter((q) => q.tipe === 'esai').length;
    bank.totalBobot = bankQuestions.reduce((sum, q) => sum + (q.bobot || 0), 0);
    saveQuestionBanks(banks);
  }
}

export function deleteQuestion(id: string): void {
  const all = getQuestions();
  const target = all.find((q) => q.id === id);
  const filtered = all.filter((q) => q.id !== id);
  saveQuestions(filtered);

  if (target) {
    const banks = getQuestionBanks();
    const bank = banks.find((b) => b.id === target.bankId);
    if (bank) {
      const bankQuestions = filtered.filter((q) => q.bankId === target.bankId);
      bank.jumlahPilihanGanda = bankQuestions.filter((q) => q.tipe === 'pilihan_ganda').length;
      bank.jumlahEsai = bankQuestions.filter((q) => q.tipe === 'esai').length;
      bank.totalBobot = bankQuestions.reduce((sum, q) => sum + (q.bobot || 0), 0);
      saveQuestionBanks(banks);
    }
  }
}

// Exam Schedules
export function getExamSchedules(): ExamSchedule[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.EXAM_SCHEDULES);
  return raw ? JSON.parse(raw) : INITIAL_EXAM_SCHEDULES;
}

export function saveExamSchedules(schedules: ExamSchedule[]): void {
  localStorage.setItem(STORAGE_KEYS.EXAM_SCHEDULES, JSON.stringify(schedules));
}

export function updateScheduleToken(scheduleId: string, newToken: string, isActive: boolean): void {
  const schedules = getExamSchedules();
  const target = schedules.find((s) => s.id === scheduleId);
  if (target) {
    target.tokenUjian = newToken;
    target.tokenAktif = isActive;
    saveExamSchedules(schedules);
  }
}

// Exam Sessions & Proctoring
export function getExamSessions(scheduleId?: string): ExamSession[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS);
  const all: ExamSession[] = raw ? JSON.parse(raw) : [];
  if (scheduleId) {
    return all.filter((s) => s.scheduleId === scheduleId);
  }
  return all;
}

export function saveExamSessions(sessions: ExamSession[]): void {
  localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(sessions));
}

export function resetStudentSession(sessionId: string): void {
  const sessions = getExamSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx !== -1) {
    sessions[idx].status = 'siap';
    sessions[idx].jumlahPindahTab = 0;
    saveExamSessions(sessions);
    addProctorAlert(
      sessions[idx].siswaNama,
      sessions[idx].siswaKelas,
      'Sesi login berhasil di-reset oleh pengawas. Siswa diizinkan login ulang.',
      'peringatan'
    );
  }
}

// Student Answers & Autosave Simulation
export function getStudentAnswers(sessionId: string): Record<string, StudentAnswer> {
  const raw = localStorage.getItem(STORAGE_KEYS.STUDENT_ANSWERS + sessionId);
  return raw ? JSON.parse(raw) : {};
}

export function saveStudentSingleAnswer(sessionId: string, answer: StudentAnswer): void {
  const current = getStudentAnswers(sessionId);
  current[answer.questionId] = {
    ...answer,
    terakhirDisimpan: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.STUDENT_ANSWERS + sessionId, JSON.stringify(current));

  // Also update session last autosave
  const sessions = getExamSessions();
  const sess = sessions.find((s) => s.id === sessionId);
  if (sess) {
    sess.terakhirAutosave = new Date().toISOString();
    if (sess.status === 'siap') {
      sess.status = 'mengerjakan';
    }
    saveExamSessions(sessions);
  }
}

// Alerts
export function getProctorAlerts(): ProctorAlert[] {
  initLocalStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.PROCTOR_ALERTS);
  return raw ? JSON.parse(raw) : [];
}

export function addProctorAlert(siswaNama: string, siswaKelas: string, pesan: string, tipe: ProctorAlert['tipe']): void {
  const alerts = getProctorAlerts();
  const newAlert: ProctorAlert = {
    id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('id-ID'),
    siswaNama,
    siswaKelas,
    pesan,
    tipe,
  };
  alerts.unshift(newAlert);
  if (alerts.length > 50) alerts.pop();
  localStorage.setItem(STORAGE_KEYS.PROCTOR_ALERTS, JSON.stringify(alerts));
}

// Reset everything to factory demo state
export function resetSystemData(): void {
  localStorage.removeItem(STORAGE_KEYS.STAFF_USERS);
  localStorage.removeItem(STORAGE_KEYS.STUDENT_USERS);
  localStorage.removeItem(STORAGE_KEYS.QUESTION_BANKS);
  localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
  localStorage.removeItem(STORAGE_KEYS.EXAM_SCHEDULES);
  localStorage.removeItem(STORAGE_KEYS.EXAM_SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.PROCTOR_ALERTS);
  initLocalStorage();
}

// Concurrent Load Test Simulation (supports 200, 500, and up to 1.000 students)
export async function run200StudentLoadTest(
  onProgress: (metrics: LoadTestMetrics) => void,
  targetConcurrentUsers: number = 200
): Promise<LoadTestMetrics> {
  const totalConcurrent = targetConcurrentUsers;
  const questionsCount = 10;
  const latencies: number[] = [];
  let successfulRequests = 0;
  let failedRequests = 0;

  const startTime = Date.now();

  const metrics: LoadTestMetrics = {
    totalConcurrentUsers: totalConcurrent,
    requestsSent: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatencyMs: 0,
    minLatencyMs: 9999,
    maxLatencyMs: 0,
    p95LatencyMs: 0,
    requestsPerSecond: 0,
    status: 'running',
  };

  const batches = totalConcurrent >= 1000 ? 20 : totalConcurrent >= 500 ? 15 : 10;
  const studentsPerBatch = Math.ceil(totalConcurrent / batches);

  for (let b = 0; b < batches; b++) {
    const promises = [];
    const countThisBatch = Math.min(studentsPerBatch, totalConcurrent - b * studentsPerBatch);
    if (countThisBatch <= 0) break;

    for (let s = 0; s < countThisBatch; s++) {
      const studentIdx = b * studentsPerBatch + s + 1;
      const fakeSessionId = `load_test_std_${studentIdx}`;
      const qIdx = (studentIdx % questionsCount) + 1;

      const task = async () => {
        const reqStart = performance.now();
        try {
          // Simulate realistic edge latency with connection pooler (12ms - 65ms)
          const delay = 12 + Math.floor(Math.random() * 45);
          await new Promise((r) => setTimeout(r, delay));

          const reqEnd = performance.now();
          const latency = Math.round(reqEnd - reqStart);
          latencies.push(latency);
          successfulRequests++;

          metrics.minLatencyMs = Math.min(metrics.minLatencyMs, latency);
          metrics.maxLatencyMs = Math.max(metrics.maxLatencyMs, latency);
        } catch {
          failedRequests++;
        }
      };
      promises.push(task());
    }

    await Promise.all(promises);

    metrics.requestsSent = latencies.length + failedRequests;
    metrics.successfulRequests = successfulRequests;
    metrics.failedRequests = failedRequests;
    metrics.averageLatencyMs = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);

    const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
    metrics.requestsPerSecond = Math.round(metrics.requestsSent / elapsedSec);

    onProgress({ ...metrics });
    await new Promise((r) => setTimeout(r, totalConcurrent >= 1000 ? 35 : 50));
  }

  // Calculate p95
  latencies.sort((a, b) => a - b);
  const p95Idx = Math.floor(latencies.length * 0.95);
  metrics.p95LatencyMs = latencies[p95Idx] || metrics.averageLatencyMs;
  metrics.status = 'completed';

  return metrics;
}
