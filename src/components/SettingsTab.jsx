import React, { useState } from 'react';
import { Folder, Cookie, Shield, HardDrive, Sparkles, Check, Move } from 'lucide-react';

export default function SettingsTab({ settings, updateSettings }) {
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSelectDirectory = async () => {
    if (window.api && window.api.selectDirectory) {
      const selected = await window.api.selectDirectory();
      if (selected) {
        updateSettings({ defaultPath: selected });
      }
    }
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <section className="card fade-in-up">
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive size={20} color="#8b5cf6" />
          <span>Cài đặt ứng dụng & Lưu trữ</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. Default Directory Selection */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
              Thư mục lưu trữ mặc định
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="text-input"
                style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                value={settings.defaultPath || ''}
                placeholder="Chọn thư mục tải xuống..."
                readOnly
              />
              <button
                className="btn btn-secondary"
                onClick={handleSelectDirectory}
                style={{ padding: '8px 14px', fontSize: '13px' }}
              >
                <Folder size={15} />
                <span>Thay đổi</span>
              </button>
            </div>
          </div>

          {/* 2. Drag & Drop Mode Settings for Playlists */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Move size={15} color="#3b82f6" />
              <span>Chế độ Kéo Thả (Drag & Drop) cho Playlist ra ngoài ứng dụng</span>
            </label>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
              Tùy chỉnh hành vi khi bạn kéo thả một thẻ Playlist từ ứng dụng ra Explorer hoặc ứng dụng khác:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                onClick={() => updateSettings({ playlistDragMode: 'folder' })}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: (settings.playlistDragMode || 'folder') === 'folder' ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
                  background: (settings.playlistDragMode || 'folder') === 'folder' ? 'rgba(139, 92, 246, 0.18)' : 'rgba(15, 23, 42, 0.5)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', marginBottom: '4px' }}>
                  📁 Kéo thả Thư Mục (Folder)
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Kéo thả thư mục chứa toàn bộ bài hát trong Playlist.
                </div>
              </div>

              <div
                onClick={() => updateSettings({ playlistDragMode: 'files' })}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: settings.playlistDragMode === 'files' ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
                  background: settings.playlistDragMode === 'files' ? 'rgba(139, 92, 246, 0.18)' : 'rgba(15, 23, 42, 0.5)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', marginBottom: '4px' }}>
                  🎵 Kéo thả Hàng loạt Tệp (Multiple Files)
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Kéo trực tiếp danh sách tất cả các file bài hát ra ứng dụng khác.
                </div>
              </div>
            </div>
          </div>

          {/* 3. Concurrent Downloads Limit */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
              Số lượng tiến trình tải song song tối đa (Max Concurrent Downloads)
            </label>
            <select
              className="text-input"
              style={{ width: '200px', padding: '8px 12px', fontSize: '13px' }}
              value={settings.maxConcurrentDownloads || 2}
              onChange={(e) => updateSettings({ maxConcurrentDownloads: parseInt(e.target.value, 10) })}
            >
              <option value="1">1 tiến trình (Tiết kiệm băng thông)</option>
              <option value="2">2 tiến trình (Cân bằng khuyên dùng)</option>
              <option value="3">3 tiến trình (Nhanh)</option>
              <option value="5">5 tiến trình (Tốc độ tối đa)</option>
            </select>
          </div>

          {/* 4. Default Metadata & Thumbnail Checkboxes */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
              Tùy chọn Metadata mặc định
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={settings.embedMetadata}
                onChange={(e) => updateSettings({ embedMetadata: e.target.checked })}
              />
              <span>Tự động nhúng Metadata (ID3 Tag, Tên ca sĩ, Album) vào file</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={settings.embedThumbnail}
                onChange={(e) => updateSettings({ embedThumbnail: e.target.checked })}
              />
              <span>Tự động nhúng Cover Artwork (Ảnh bìa) vào file MP3/MP4</span>
            </label>
          </div>

          {/* Save Button */}
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              style={{ padding: '10px 20px', fontSize: '13px' }}
            >
              <Check size={16} />
              <span>Lưu Cài đặt</span>
            </button>

            {savedSuccess && (
              <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '600' }} className="fade-in-up">
                ✓ Đã lưu cài đặt thành công!
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
