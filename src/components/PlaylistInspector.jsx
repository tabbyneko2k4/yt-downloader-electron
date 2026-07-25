import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, CheckSquare, Square, Music, Clock, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import Listbox from './Listbox';

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
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-4 animate-fade-in-up">
      {/* Top Header & Selection Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Music size={18} className="text-purple-500 shrink-0" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
            {t('playlistDetails', { total: entries.length })}
          </h4>
          <span className="bg-purple-500/15 border border-purple-400/30 text-purple-600 dark:text-purple-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
            {t('selectedCount', { selected: selectedIndexes.length, total: entries.length })}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer text-center"
            onClick={handleSelectAll}
          >
            {t('selectAll')}
          </button>
          <button
            type="button"
            className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer text-center"
            onClick={handleDeselectAll}
          >
            {t('deselectAll')}
          </button>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-pink-500"
            placeholder={t('searchPlaylistPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ArrowUpDown size={14} className="text-slate-400" />
          <Listbox
            className="w-36 sm:w-40"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">{t('sortDefault')}</option>
            <option value="name-asc">{t('sortNameAsc')}</option>
            <option value="name-desc">{t('sortNameDesc')}</option>
            <option value="duration-desc">{t('sortDurationDesc')}</option>
            <option value="duration-asc">{t('sortDurationAsc')}</option>
          </Listbox>
        </div>
      </div>

      {/* Scrollable Track Items Table */}
      <div className="max-h-64 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {processedEntries.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs italic">
            {t('noPlaylistMatch')}
          </div>
        ) : (
          processedEntries.map((item) => {
            const isSelected = selectedIndexes.includes(item.originalIndex);
            return (
              <div
                key={item.originalIndex}
                className={`flex items-center gap-2.5 p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-500/15 border border-purple-400/50 text-purple-600 dark:text-purple-200 font-bold scale-[1.01]'
                    : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
                onClick={() => handleToggleItem(item.originalIndex)}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-pink-500 rounded cursor-pointer shrink-0"
                  checked={isSelected}
                  onChange={() => {}}
                />

                {/* Index / Thumb */}
                <div className="w-9 h-6 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-slate-400">#{item.originalIndex}</span>
                  )}
                </div>

                {/* Title & Uploader */}
                <div className="overflow-hidden flex-1 min-w-0">
                  <div className={`text-xs truncate ${isSelected ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                    #{item.originalIndex}. {item.title || 'Track'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {item.uploader || 'Web'}
                  </div>
                </div>

                {/* Duration */}
                <div className="text-[11px] text-slate-400 font-mono text-right shrink-0">
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
