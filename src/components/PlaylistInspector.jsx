import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, CheckSquare, Square, Music, Clock, Sparkles } from 'lucide-react';

export default function PlaylistInspector({ entries, selectedIndexes, setSelectedIndexes }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'name-asc' | 'name-desc' | 'duration-desc' | 'duration-asc'

  // Annotate entries with 1-based original index
  const indexedEntries = useMemo(() => {
    return entries.map((entry, idx) => ({
      ...entry,
      originalIndex: idx + 1
    }));
  }, [entries]);

  // Filter & Sort
  const processedEntries = useMemo(() => {
    let result = [...indexedEntries];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(term)) ||
          (item.uploader && item.uploader.toLowerCase().includes(term)) ||
          item.originalIndex.toString() === term
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'name-desc') {
        return (b.title || '').localeCompare(a.title || '');
      } else if (sortBy === 'duration-desc') {
        return (b.duration || 0) - (a.duration || 0);
      } else if (sortBy === 'duration-asc') {
        return (a.duration || 0) - (b.duration || 0);
      }
      return a.originalIndex - b.originalIndex;
    });

    return result;
  }, [indexedEntries, searchTerm, sortBy]);

  // Handlers for selection
  const handleToggleItem = (originalIdx) => {
    if (selectedIndexes.includes(originalIdx)) {
      setSelectedIndexes(selectedIndexes.filter((i) => i !== originalIdx));
    } else {
      setSelectedIndexes([...selectedIndexes, originalIdx].sort((a, b) => a - b));
    }
  };

  const handleSelectAll = () => {
    const allIndexes = indexedEntries.map((item) => item.originalIndex);
    setSelectedIndexes(allIndexes);
  };

  const handleDeselectAll = () => {
    setSelectedIndexes([]);
  };

  const handleSelectFiltered = () => {
    const filteredIndexes = processedEntries.map((item) => item.originalIndex);
    const combined = Array.from(new Set([...selectedIndexes, ...filteredIndexes])).sort((a, b) => a - b);
    setSelectedIndexes(combined);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ marginTop: '16px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
      {/* Top Header & Selection Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Music size={18} color="#c084fc" />
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>
            Chi tiết Playlist ({entries.length} mục)
          </h4>
          <span style={{ background: 'rgba(139, 92, 246, 0.25)', color: '#e9d5ff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
            Đã chọn: {selectedIndexes.length} / {entries.length}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px' }}
            onClick={handleSelectAll}
          >
            Chọn tất cả
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px' }}
            onClick={handleDeselectAll}
          >
            Bỏ chọn
          </button>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="text-input"
            style={{ paddingLeft: '30px', padding: '6px 10px 6px 30px', fontSize: '12px' }}
            placeholder="Tìm bài trong playlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowUpDown size={14} color="#94a3b8" />
          <select
            className="text-input"
            style={{ padding: '6px 10px', fontSize: '12px', width: '150px' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Thứ tự mặc định</option>
            <option value="name-asc">Tên A ➔ Z</option>
            <option value="name-desc">Tên Z ➔ A</option>
            <option value="duration-desc">Thời lượng dài</option>
            <option value="duration-asc">Thời lượng ngắn</option>
          </select>
        </div>
      </div>

      {/* Scrollable Track Items Table */}
      <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#090d16' }}>
        {processedEntries.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
            Không tìm thấy bài hát phù hợp trong playlist
          </div>
        ) : (
          processedEntries.map((item) => {
            const isSelected = selectedIndexes.includes(item.originalIndex);
            return (
              <div
                key={item.originalIndex}
                onClick={() => handleToggleItem(item.originalIndex)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px 40px 1fr 70px',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                  transition: 'background 0.15s ease'
                }}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  style={{ width: '16px', height: '16px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                  checked={isSelected}
                  onChange={() => {}} // handled by parent div onClick
                />

                {/* Index / Thumb */}
                <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>#{item.originalIndex}</span>
                  )}
                </div>

                {/* Title & Uploader */}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: isSelected ? '#f8fafc' : '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    #{item.originalIndex}. {item.title || 'Bài hát không tên'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.uploader || 'Nguồn web'}
                  </div>
                </div>

                {/* Duration */}
                <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right', fontFamily: 'monospace' }}>
                  {formatDuration(item.duration)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
