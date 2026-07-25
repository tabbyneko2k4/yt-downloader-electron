import React, { useState } from 'react';
import { LogOut, Minimize2, CheckSquare, Square, X, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function CloseModal({ isOpen, onClose, settings, updateSettings }) {
  const { t } = useTranslation();
  const [rememberChoice, setRememberChoice] = useState(false);

  if (!isOpen) return null;

  const handleExit = () => {
    if (rememberChoice && updateSettings) {
      updateSettings({ closeAction: 'exit', dontAskClose: true });
    }
    if (window.api && window.api.quitApp) {
      window.api.quitApp();
    }
    onClose();
  };

  const handleMinimize = () => {
    if (rememberChoice && updateSettings) {
      updateSettings({ closeAction: 'minimize', dontAskClose: true });
    }
    if (window.api && window.api.hideWindow) {
      window.api.hideWindow();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in-up select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-pink-500/30 text-slate-800 dark:text-slate-100 shadow-2xl shadow-pink-500/10 dark:shadow-pink-500/20 space-y-5 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-400/30 text-rose-500 dark:text-rose-400 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {t('confirmCloseTitle') || 'Xác nhận đóng ứng dụng'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('confirmCloseMsg') || 'Bạn muốn thoát hoàn toàn hay thu nhỏ xuống khay hệ thống?'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Option Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Exit Option Card */}
          <div
            onClick={handleExit}
            className="group p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-400/30 hover:border-rose-400 text-left transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5 active:scale-95 space-y-1.5"
          >
            <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 group-hover:text-rose-500">
              <LogOut size={16} />
              <span>{t('closeActionExit') || 'Thoát hẳn'}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('closeActionExitDesc') || 'Đóng toàn bộ ứng dụng và ngắt tiến trình'}
            </p>
          </div>

          {/* Minimize Option Card */}
          <div
            onClick={handleMinimize}
            className="group p-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-400/30 hover:border-purple-400 text-left transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5 active:scale-95 space-y-1.5"
          >
            <div className="text-xs font-bold text-purple-600 dark:text-purple-300 flex items-center gap-2 group-hover:text-pink-500">
              <Minimize2 size={16} />
              <span>{t('closeActionMinimize') || 'Thu nhỏ Tray'}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('closeActionMinimizeDesc') || 'Chạy ngầm ở khay hệ thống để tiếp tục tải'}
            </p>
          </div>
        </div>

        {/* Modal Footer (Checkbox & Cancel Button) */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <label
            onClick={() => setRememberChoice(!rememberChoice)}
            className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer select-none"
          >
            {rememberChoice ? (
              <CheckSquare size={16} className="text-pink-500 dark:text-purple-400" />
            ) : (
              <Square size={16} className="text-slate-400" />
            )}
            <span>{t('dontAskAgainLabel') || 'Không hỏi lại lần sau'}</span>
          </label>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
            onClick={onClose}
          >
            {t('cancelBtn') || 'Hủy'}
          </button>
        </div>
      </div>
    </div>
  );
}
