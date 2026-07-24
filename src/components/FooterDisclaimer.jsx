import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function FooterDisclaimer({ onClose }) {
  const { t } = useTranslation();
  return (
    <footer className="footer-disclaimer">
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <AlertCircle size={14} color="#f59e0b" style={{ minWidth: '14px', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <strong>{t('disclaimerTitle')}</strong> {t('disclaimerText')}
        </span>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="disclaimer-ok-btn"
          title="OK"
        >
          <Check size={12} />
          <span>OK</span>
        </button>
      )}
    </footer>
  );
}
