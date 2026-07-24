import React, { useState, useEffect } from 'react';
import { Terminal, Subtitles, Clock, Cookie, Zap, Code, FileCode, CheckCircle, RotateCcw, Bookmark, Plus, Trash2, Sparkles, Copy, Eye } from 'lucide-react';

export default function AdvancedTab({ advancedOptions, setAdvancedOptions }) {
  const [customPresets, setCustomPresets] = useState(() => {
    const saved = localStorage.getItem('media_downloader_custom_presets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Save custom presets to localStorage
  useEffect(() => {
    localStorage.setItem('media_downloader_custom_presets', JSON.stringify(customPresets));
  }, [customPresets]);

  // Built-in Presets
  const builtinPresets = [
    {
      id: 'speed-boost',
      name: '🚀 Tối ưu Tốc độ Tải',
      desc: 'Giới hạn 10MB/s, bỏ qua thời gian sửa đổi',
      options: {
        writeSubs: false,
        embedSubs: false,
        subLangs: 'vi,en',
        downloadSections: '',
        cookiesFromBrowser: 'none',
        rateLimit: '10M',
        customFormat: '',
        customArgs: '--no-mtime --concurrent-fragments 5'
      }
    },
    {
      id: 'subtitles-vi-en',
      name: '💬 Tải Kèm Phụ Đề (Việt + Anh)',
      desc: 'Tải và nhúng phụ đề tiếng Việt & Anh vào video',
      options: {
        writeSubs: true,
        embedSubs: true,
        subLangs: 'vi,en',
        downloadSections: '',
        cookiesFromBrowser: 'none',
        rateLimit: '',
        customFormat: '',
        customArgs: ''
      }
    },
    {
      id: 'geo-cookies-bypass',
      name: '🔐 Vượt Giới Hạn & Cookie Chrome',
      desc: 'Lấy cookie Chrome và vượt chặn địa lý',
      options: {
        writeSubs: false,
        embedSubs: false,
        subLangs: 'vi,en',
        downloadSections: '',
        cookiesFromBrowser: 'chrome',
        rateLimit: '',
        customFormat: '',
        customArgs: '--geo-bypass'
      }
    },
    {
      id: 'cut-first-min',
      name: '✂️ Cắt 1 Phút Đầu Video',
      desc: 'Chỉ tải khoảng thời gian từ 00:00:00 đến 00:01:00',
      options: {
        writeSubs: false,
        embedSubs: false,
        subLangs: 'vi,en',
        downloadSections: '*00:00:00-00:01:00',
        cookiesFromBrowser: 'none',
        rateLimit: '',
        customFormat: '',
        customArgs: ''
      }
    }
  ];

  const handleChange = (field, value) => {
    setAdvancedOptions((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyPreset = (presetOptions) => {
    setAdvancedOptions((prev) => ({
      ...prev,
      ...presetOptions
    }));
  };

  const handleSaveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset = {
      id: Date.now().toString(),
      name: `⭐ ${newPresetName.trim()}`,
      desc: 'Preset cá nhân tự lưu',
      options: { ...advancedOptions }
    };
    setCustomPresets((prev) => [newPreset, ...prev]);
    setNewPresetName('');
    setShowSaveModal(false);
  };

  const handleDeleteCustomPreset = (id, e) => {
    e.stopPropagation();
    setCustomPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const handleReset = () => {
    setAdvancedOptions({
      writeSubs: false,
      writeThumbnail: false,
      writeDescription: false,
      embedSubs: false,
      subLangs: 'vi,en',
      downloadSections: '',
      cookiesFromBrowser: 'none',
      rateLimit: '',
      customFormat: '',
      customArgs: ''
    });
  };

  // Generate Live Command Line String for preview
  const generateCmdPreview = () => {
    const parts = ['yt-dlp'];
    if (advancedOptions.writeSubs) parts.push('--write-subs');
    if (advancedOptions.writeThumbnail) parts.push('--write-thumbnail');
    if (advancedOptions.writeDescription) parts.push('--write-description');
    if (advancedOptions.embedSubs) parts.push('--embed-subs');
    if (advancedOptions.writeSubs && advancedOptions.subLangs) parts.push(`--sub-langs "${advancedOptions.subLangs}"`);
    if (advancedOptions.downloadSections) parts.push(`--download-sections "${advancedOptions.downloadSections}"`);
    if (advancedOptions.cookiesFromBrowser && advancedOptions.cookiesFromBrowser !== 'none') parts.push(`--cookies-from-browser ${advancedOptions.cookiesFromBrowser}`);
    if (advancedOptions.rateLimit) parts.push(`--rate-limit ${advancedOptions.rateLimit}`);
    if (advancedOptions.customFormat) parts.push(`-f "${advancedOptions.customFormat}"`);
    if (advancedOptions.customArgs) parts.push(advancedOptions.customArgs);
    parts.push('[URL_MEDIA]');
    return parts.join(' ');
  };

  const copyCmdPreview = () => {
    navigator.clipboard.writeText(generateCmdPreview());
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      {/* Top Banner & Live CLI Command Preview Box */}
      <section className="card" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))', padding: '18px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={20} color="#c084fc" />
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#f8fafc' }}>
              Trung tâm Tùy chỉnh Nâng cao (CLI & Presets)
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowSaveModal(true)}
              style={{ padding: '6px 12px', fontSize: '12px', color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.3)' }}
            >
              <Plus size={14} />
              <span>Lưu cấu hình làm Preset</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleReset}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <RotateCcw size={14} />
              <span>Đặt lại</span>
            </button>
          </div>
        </div>

        {/* Live Command Terminal Box */}
        <div style={{ background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 16px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={12} color="#10b981" />
              <span>Xem trước lệnh yt-dlp thực thi thực tế:</span>
            </span>
            <button
              onClick={copyCmdPreview}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Copy size={12} />
              <span>{copiedCmd ? 'Đã chép!' : 'Sao chép lệnh'}</span>
            </button>
          </div>
          <code style={{ fontFamily: 'Consolas, monospace', fontSize: '12px', color: '#a7f3d0', wordBreak: 'break-all' }}>
            {generateCmdPreview()}
          </code>
        </div>
      </section>

      {/* Preset Selector Grid */}
      <section className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bookmark size={16} color="#f59e0b" />
          <span>Bảng chọn Tập cấu hình Mẫu (Presets 1-Click)</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {/* Built-in Presets */}
          {builtinPresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleApplyPreset(preset.options)}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              className="preset-card-item"
            >
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', marginBottom: '4px' }}>
                {preset.name}
              </h4>
              <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                {preset.desc}
              </p>
            </div>
          ))}

          {/* Saved Custom Presets */}
          {customPresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleApplyPreset(preset.options)}
              style={{
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              className="preset-card-item"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#c084fc', marginBottom: '4px' }}>
                  {preset.name}
                </h4>
                <button
                  onClick={(e) => handleDeleteCustomPreset(preset.id, e)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                  title="Xóa preset này"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                {preset.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Categorized Visual Configuration Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
        {/* Subtitles Visual Controls */}
        <section className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Subtitles size={18} color="#ec4899" />
            <span>Phụ đề & Ngôn ngữ</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '13px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                checked={advancedOptions.writeSubs}
                onChange={(e) => handleChange('writeSubs', e.target.checked)}
              />
              Tải tệp phụ đề (.vtt / .srt) (--write-subs)
            </label>

            <label style={{ fontSize: '13px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                checked={advancedOptions.embedSubs}
                onChange={(e) => handleChange('embedSubs', e.target.checked)}
              />
              Nhúng phụ đề cứng vào Video (--embed-subs)
            </label>

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Chọn nhanh ngôn ngữ phụ đề:
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {[
                  { label: 'Tiếng Việt (vi)', code: 'vi' },
                  { label: 'Tiếng Anh (en)', code: 'en' },
                  { label: 'Việt + Anh (vi,en)', code: 'vi,en' },
                  { label: 'Tất cả (all)', code: 'all' }
                ].map((chip) => (
                  <button
                    key={chip.code}
                    type="button"
                    onClick={() => handleChange('subLangs', chip.code)}
                    style={{
                      background: advancedOptions.subLangs === chip.code ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: advancedOptions.subLangs === chip.code ? '1px solid #ec4899' : '1px solid var(--border-color)',
                      color: advancedOptions.subLangs === chip.code ? '#fff' : '#94a3b8',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="text-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                placeholder="Mã ngôn ngữ (VD: vi,en)"
                value={advancedOptions.subLangs}
                onChange={(e) => handleChange('subLangs', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Time Cut Section Visual Controls */}
        <section className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={18} color="#3b82f6" />
            <span>Cắt phân đoạn Video (--download-sections)</span>
          </h3>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Chọn nhanh khoảng thời gian:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {[
                { label: '1 phút đầu', val: '*00:00:00-00:01:00' },
                { label: '3 phút đầu', val: '*00:00:00-00:03:00' },
                { label: '5 phút đầu', val: '*00:00:00-00:05:00' },
                { label: 'Xóa cắt', val: '' }
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChange('downloadSections', chip.val)}
                  style={{
                    background: advancedOptions.downloadSections === chip.val && chip.val !== '' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: advancedOptions.downloadSections === chip.val && chip.val !== '' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                    color: '#94a3b8',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              className="text-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
              placeholder='VD: "*00:01:00-00:03:30"'
              value={advancedOptions.downloadSections}
              onChange={(e) => handleChange('downloadSections', e.target.value)}
            />
            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Cú pháp: "*hh:mm:ss-hh:mm:ss"
            </span>
          </div>
        </section>

        {/* Cookies & Geo-bypass */}
        <section className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cookie size={18} color="#f59e0b" />
            <span>Cookie & Xác thực Trình duyệt</span>
          </h3>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Trình duyệt trích xuất Cookie:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
              {[
                { name: 'Không dùng', id: 'none' },
                { name: 'Chrome', id: 'chrome' },
                { name: 'Edge', id: 'edge' },
                { name: 'Firefox', id: 'firefox' },
                { name: 'Brave', id: 'brave' }
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleChange('cookiesFromBrowser', b.id)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: advancedOptions.cookiesFromBrowser === b.id ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                    background: advancedOptions.cookiesFromBrowser === b.id ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                    color: advancedOptions.cookiesFromBrowser === b.id ? '#fff' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Speed Limit & Rate */}
        <section className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={18} color="#10b981" />
            <span>Giới hạn Tốc độ (--rate-limit)</span>
          </h3>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Chọn nhanh tốc độ tối đa:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {[
                { label: '2 MB/s', val: '2M' },
                { label: '5 MB/s', val: '5M' },
                { label: '10 MB/s', val: '10M' },
                { label: 'Không giới hạn', val: '' }
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChange('rateLimit', chip.val)}
                  style={{
                    background: advancedOptions.rateLimit === chip.val && chip.val !== '' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: advancedOptions.rateLimit === chip.val && chip.val !== '' ? '1px solid #10b981' : '1px solid var(--border-color)',
                    color: '#94a3b8',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              className="text-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
              placeholder="VD: 5M hoặc 500K"
              value={advancedOptions.rateLimit}
              onChange={(e) => handleChange('rateLimit', e.target.value)}
            />
          </div>
        </section>

        {/* Custom Format Box */}
        <section className="card" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code size={18} color="#8b5cf6" />
            <span>Mã Format tùy chỉnh (-f)</span>
          </h3>

          <input
            type="text"
            className="text-input"
            style={{ width: '100%', padding: '8px 12px', fontSize: '12px' }}
            placeholder="VD: bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best"
            value={advancedOptions.customFormat}
            onChange={(e) => handleChange('customFormat', e.target.value)}
          />
        </section>

        {/* Extra CLI Flags */}
        <section className="card" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCode size={18} color="#06b6d4" />
            <span>Tham số Cờ lệnh CLI bổ sung (yt-dlp extra flags)</span>
          </h3>

          <input
            type="text"
            className="text-input"
            style={{ width: '100%', padding: '8px 12px', fontSize: '12px' }}
            placeholder="VD: --geo-bypass --no-mtime --sponsorblock-remove all"
            value={advancedOptions.customArgs}
            onChange={(e) => handleChange('customArgs', e.target.value)}
          />
        </section>
      </div>

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="modal-backdrop" onClick={() => setShowSaveModal(false)}>
          <div className="modal-window" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
                Lưu Cấu hình Hiện tại thành Preset
              </h3>
            </div>
            <div style={{ padding: '20px' }}>
              <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                Tên Tập Cấu hình (Preset Name):
              </label>
              <input
                type="text"
                className="text-input"
                style={{ width: '100%', padding: '10px', fontSize: '14px', marginBottom: '16px' }}
                placeholder="VD: Tải Phụ Đề + Fast 10M"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>
                  Hủy
                </button>
                <button className="btn btn-primary" onClick={handleSaveCurrentAsPreset} disabled={!newPresetName.trim()}>
                  Lưu Preset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
