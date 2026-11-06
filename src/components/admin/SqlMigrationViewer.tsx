import React, { useState } from 'react';
import { SUPABASE_MIGRATION_SQL, WINDOWS_POWERSHELL_INSTRUCTIONS } from '../../lib/supabaseMigrationSql';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConfigured,
} from '../../lib/supabaseClient';
import { Copy, Check, Terminal, Database, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const SqlMigrationViewer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'sql' | 'powershell' | 'config'>('sql');
  const [copied, setCopied] = useState(false);

  const initialConfig = getSavedSupabaseConfig();
  const [urlInput, setUrlInput] = useState(initialConfig.url);
  const [anonKeyInput, setAnonKeyInput] = useState(initialConfig.anonKey);
  const [configSaved, setConfigSaved] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(urlInput.trim(), anonKeyInput.trim());
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Konfigurasi Database & Skema SQL Migration Supabase
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Skema siap pakai untuk SMP Negeri 01 Banding Agung dengan Row Level Security (RLS) dan proteksi kunci jawaban
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Supabase Terhubung
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
              <ShieldAlert className="w-4 h-4 text-slate-500" />
              Mode Simulasi Lokal Aktif
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 p-2 gap-2 bg-slate-50">
          <button
            onClick={() => setActiveSubTab('sql')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'sql'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Skema SQL Migration (RLS + Triggers)
          </button>
          <button
            onClick={() => setActiveSubTab('powershell')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'powershell'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Perintah Windows PowerShell / CLI
          </button>
          <button
            onClick={() => setActiveSubTab('config')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'config'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pengaturan Supabase Cloud
          </button>
        </div>

        {/* Tab Content */}
        {activeSubTab === 'sql' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600">
                Salin seluruh kode SQL di bawah ini dan jalankan di menu <strong>SQL Editor</strong> pada dashboard proyek Supabase Anda:
              </p>
              <button
                onClick={() => handleCopy(SUPABASE_MIGRATION_SQL)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Tersalin ke Clipboard' : 'Salin Kode SQL'}
              </button>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-[500px]">
              <pre>{SUPABASE_MIGRATION_SQL}</pre>
            </div>
          </div>
        )}

        {activeSubTab === 'powershell' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600">
                Langkah eksekusi melalui Command Prompt / Windows PowerShell menggunakan Supabase CLI:
              </p>
              <button
                onClick={() => handleCopy(WINDOWS_POWERSHELL_INSTRUCTIONS)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Tersalin ke Clipboard' : 'Salin Perintah CLI'}
              </button>
            </div>

            <div className="bg-slate-900 text-emerald-400 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-[500px]">
              <pre>{WINDOWS_POWERSHELL_INSTRUCTIONS}</pre>
            </div>
          </div>
        )}

        {activeSubTab === 'config' && (
          <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                Koneksi Langsung ke Proyek Supabase Cloud Anda
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Masukkan Project URL dan Public Anon Key dari dashboard Supabase Anda (Settings &gt; API).
                Sistem tidak pernah mengekspos Service Role Key!
              </p>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Supabase Project URL (VITE_SUPABASE_URL):
                </label>
                <input
                  type="url"
                  placeholder="https://xyzabcdefghijklmnop.supabase.co"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Supabase Anon Public Key (VITE_SUPABASE_ANON_KEY):
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKeyInput}
                  onChange={(e) => setAnonKeyInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  *Gunakan kunci publik "anon" saja; jangan gunakan "service_role" pada aplikasi web sisi klien.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Simpan Konfigurasi
                </button>
                {configSaved && (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Konfigurasi tersimpan dan aktif!
                  </span>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
