import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function FooterDisclaimer() {
  const { t } = useTranslation();
  return (
    <footer className="footer-disclaimer">
      <AlertCircle size={14} color="#f59e0b" style={{ minWidth: '14px' }} />
      <span>
        <strong>{t('disclaimerTitle')}</strong> {t('disclaimerText')}
      </span>
    </footer>
  );
}
