import React from 'react';
import { ListMusic, Film, X } from 'lucide-react';
import { stripPlaylistParam } from './utils/formatDetector';

export default function PlaylistChoiceModal({ rawUrl, onChoose, onClose }) {
  if (!rawUrl) return null;
  const singleVideoUrl = stripPlaylistParam(rawUrl);

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 animate-scale-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 shrink-0">
              <ListMusic size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Phát hiện Playlist & Video
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Đường dẫn vừa có Video đơn vừa có Playlist. Bạn muốn tải loại nào?
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2.5 pt-1">
          {/* Option 1: Single Video */}
          <button
            type="button"
            onClick={() => onChoose('single')}
            className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-pink-50/80 dark:bg-slate-800/60 dark:hover:bg-pink-500/15 border border-slate-200 dark:border-slate-700/80 hover:border-pink-500/50 transition-all duration-200 group cursor-pointer flex items-center justify-between shadow-xs hover:shadow-md"
          >
            <div className="min-w-0 pr-2 space-y-0.5">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-pink-600 dark:group-hover:text-pink-300 flex items-center gap-1.5">
                <Film size={15} className="text-pink-500 shrink-0" />
                <span>Chỉ tải 1 Video này</span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate font-mono">
                {singleVideoUrl}
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-pink-500/15 text-pink-600 dark:text-pink-300 shrink-0 border border-pink-500/30">
              Khuyên dùng
            </span>
          </button>

          {/* Option 2: Full Playlist */}
          <button
            type="button"
            onClick={() => onChoose('playlist')}
            className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-purple-50/80 dark:bg-slate-800/60 dark:hover:bg-purple-500/15 border border-slate-200 dark:border-slate-700/80 hover:border-purple-500/50 transition-all duration-200 group cursor-pointer flex items-center justify-between shadow-xs hover:shadow-md"
          >
            <div className="min-w-0 pr-2 space-y-0.5">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-300 flex items-center gap-1.5">
                <ListMusic size={15} className="text-purple-500 shrink-0" />
                <span>Tải toàn bộ Playlist</span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate font-mono">
                {rawUrl}
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onChoose('single')}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Mặc định: Chỉ 1 Video
          </button>
        </div>
      </div>
    </div>
  );
}
