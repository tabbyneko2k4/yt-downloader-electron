import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function FooterDisclaimer({ onClose }) {
  const { t } = useTranslation();
  return (
    <footer className="w-full max-w-5xl mx-auto px-3 sm:px-6 my-2 select-none animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-amber-300/60 dark:border-amber-500/30 shadow-sm text-slate-800 dark:text-slate-200 text-xs">
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <AlertCircle size={15} className="text-amber-500 shrink-0" />
          <span className="truncate">
            <strong className="text-amber-600 dark:text-amber-400">{t('disclaimerTitle')}</strong> {t('disclaimerText')}
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-600 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
            title="OK"
          >
            <Check size={12} />
            <span>OK</span>
          </button>
        )}
      </div>
    </footer>
  );
}
