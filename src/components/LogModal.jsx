import React, { useState } from 'react';
import { X, Copy, Terminal, FileText, Check } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function LogModal({ title, logs, logFilePath, onClose }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenFileLog = () => {
    if (logFilePath && window.api && window.api.openFile) {
      window.api.openFile(logFilePath);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in-up select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col p-5 rounded-3xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-pink-500/30 text-slate-800 dark:text-slate-100 shadow-2xl space-y-4 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-600 dark:text-purple-300 shrink-0">
              <Terminal size={18} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate max-w-sm sm:max-w-md">
              {t('logModalTitle', { title: title || 'Download Process' })}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {logFilePath && (
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                onClick={handleOpenFileLog}
              >
                <FileText size={13} />
                <span className="hidden sm:inline-block">{t('openLogFile')}</span>
              </button>
            )}

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold transition-all cursor-pointer"
              onClick={handleCopy}
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? t('copied') : t('copy')}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Log Body */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] font-mono text-xs text-emerald-400 bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 shadow-inner break-all whitespace-pre-wrap select-all leading-relaxed">
          {logs || t('noLogData')}
        </div>
      </div>
    </div>
  );
}
