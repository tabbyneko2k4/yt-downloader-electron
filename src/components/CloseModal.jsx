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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '24px',
          borderRadius: '16px',
          background: 'var(--bg-card, #12131a)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          animation: 'scaleUp 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
                {t('confirmCloseTitle') || 'Xác nhận đóng ứng dụng'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                {t('confirmCloseMsg') || 'Bạn muốn thoát hoàn toàn hay thu nhỏ xuống khay hệ thống?'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Option Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Exit Option */}
          <div
            onClick={handleExit}
            style={{
              padding: '16px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.08)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
            className="hover-card-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '700', fontSize: '14px' }}>
              <LogOut size={18} />
              <span>{t('closeActionExit') || 'Thoát hẳn'}</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
              {t('closeActionExitDesc') || 'Đóng toàn bộ ứng dụng và ngắt tiến trình'}
            </span>
          </div>

          {/* Minimize Option */}
          <div
            onClick={handleMinimize}
            style={{
              padding: '16px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              background: 'rgba(139, 92, 246, 0.08)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
            className="hover-card-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontWeight: '700', fontSize: '14px' }}>
              <Minimize2 size={18} />
              <span>{t('closeActionMinimize') || 'Thu nhỏ Tray'}</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
              {t('closeActionMinimizeDesc') || 'Chạy ngầm ở khay hệ thống để tiếp tục tải'}
            </span>
          </div>
        </div>

        {/* Footer: Checkbox & Cancel */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
          <div
            onClick={() => setRememberChoice(!rememberChoice)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              color: 'var(--text-main)',
              userSelect: 'none'
            }}
          >
            {rememberChoice ? (
              <CheckSquare size={16} color="#8b5cf6" />
            ) : (
              <Square size={16} color="var(--text-muted)" />
            )}
            <span>{t('dontAskAgainLabel') || 'Không hỏi lại lần sau'}</span>
          </div>

          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            {t('cancelBtn') || 'Hủy'}
          </button>
        </div>
      </div>
    </div>
  );
}
