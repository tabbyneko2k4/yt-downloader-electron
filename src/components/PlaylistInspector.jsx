import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, CheckSquare, Square, Music, Clock, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function PlaylistInspector({ entries, selectedIndexes, setSelectedIndexes }) {
  const { t } = useTranslation();
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

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="playlist-inspector-container">
      {/* Top Header & Selection Controls */}
      <div className="playlist-inspector-header">
        <div className="playlist-header-left">
          <Music size={18} color="#c084fc" />
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
            {t('playlistDetails', { total: entries.length })}
          </h4>
          <span style={{ background: 'rgba(139, 92, 246, 0.25)', color: '#e9d5ff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
            {t('selectedCount', { selected: selectedIndexes.length, total: entries.length })}
          </span>
        </div>

        <div className="playlist-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}
            onClick={handleSelectAll}
          >
            {t('selectAll')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}
            onClick={handleDeselectAll}
          >
            {t('deselectAll')}
          </button>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="playlist-filter-row">
        <div className="playlist-search-box">
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="text-input"
            style={{ paddingLeft: '30px', padding: '6px 10px 6px 30px', fontSize: '12px', width: '100%' }}
            placeholder={t('searchPlaylistPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="playlist-sort-box">
          <ArrowUpDown size={14} color="#94a3b8" />
          <select
            className="custom-select playlist-sort-select"
            style={{ fontSize: '12px' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">{t('sortDefault')}</option>
            <option value="name-asc">{t('sortNameAsc')}</option>
            <option value="name-desc">{t('sortNameDesc')}</option>
            <option value="duration-desc">{t('sortDurationDesc')}</option>
            <option value="duration-asc">{t('sortDurationAsc')}</option>
          </select>
        </div>
      </div>

      {/* Scrollable Track Items Table */}
      <div className="playlist-tracks-scrollable">
        {processedEntries.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            {t('noPlaylistMatch')}
          </div>
        ) : (
          processedEntries.map((item) => {
            const isSelected = selectedIndexes.includes(item.originalIndex);
            return (
              <div
                key={item.originalIndex}
                className={`playlist-track-row ${isSelected ? 'selected' : ''}`}
                onClick={() => handleToggleItem(item.originalIndex)}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                  checked={isSelected}
                  onChange={() => {}}
                />

                {/* Index / Thumb */}
                <div className="playlist-track-thumb">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>#{item.originalIndex}</span>
                  )}
                </div>

                {/* Title & Uploader */}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: isSelected ? 'var(--text-main)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    #{item.originalIndex}. {item.title || 'Track'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.uploader || 'Web'}
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
