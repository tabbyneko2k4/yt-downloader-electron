import React from 'react';
import { X, Copy, Terminal, FileText } from 'lucide-react';

export default function LogModal({ title, logs, logFilePath, onClose }) {
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
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
              Nhật ký CLI: {title || 'Tiến trình Tải'}
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
                <span>Mở tệp .log</span>
              </button>
            )}

            <button
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={handleCopy}
            >
              <Copy size={13} />
              <span>{copied ? 'Đã chép!' : 'Sao chép'}</span>
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
          {logs || 'Chưa có dữ liệu log...'}
        </div>
      </div>
    </div>
  );
}
