import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function FooterDisclaimer() {
  return (
    <footer className="footer-disclaimer">
      <AlertCircle size={14} color="#f59e0b" style={{ minWidth: '14px' }} />
      <span>
        <strong>Tuyên bố miễn trừ trách nhiệm:</strong> Ứng dụng chỉ phục vụ mục đích cá nhân và hợp pháp. Người dùng hoàn toàn chịu trách nhiệm về bản quyền đối với các tệp tải về.
      </span>
    </footer>
  );
}
