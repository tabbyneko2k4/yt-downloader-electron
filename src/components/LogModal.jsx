import React from 'react';
import { X, Copy, Terminal, FileText } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function LogModal({ title, logs, logFilePath, onClose }) {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="#c084fc" />
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
              {t('logModalTitle', { title: title || 'Download Process' })}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {logFilePath && (
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '12px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                onClick={handleOpenFileLog}
              >
                <FileText size={13} />
                <span>{t('openLogFile')}</span>
              </button>
            )}

            <button
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={handleCopy}
            >
              <Copy size={13} />
              <span>{copied ? t('copied') : t('copy')}</span>
            </button>

            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {logs || t('noLogData')}
        </div>
      </div>
    </div>
  );
}
