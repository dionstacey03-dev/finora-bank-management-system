import React, { useMemo, useState } from 'react';
import { Hash, Plus, X } from 'lucide-react';
import { normalizeTag, PRESET_TRANSACTION_TAGS } from '../../utils/tags';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (nextTags: string[]) => void;
  label?: string;
  helperText?: string;
  compact?: boolean;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onChange,
  label = 'Transaction Tags (Optional)',
  helperText,
  compact = false,
}) => {
  const [customInput, setCustomInput] = useState('');

  const allOptions = useMemo(() => {
    const seen = new Set(PRESET_TRANSACTION_TAGS.map((t) => t.toLowerCase()));
    const extras = selectedTags.filter((t) => !seen.has(t.toLowerCase()));
    return [...PRESET_TRANSACTION_TAGS, ...extras];
  }, [selectedTags]);

  const toggleTag = (tag: string) => {
    const exists = selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (exists) {
      onChange(selectedTags.filter((t) => t.toLowerCase() !== tag.toLowerCase()));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const handleAddCustom = () => {
    const normalized = normalizeTag(customInput);
    if (!normalized) return;
    if (!selectedTags.some((t) => t.toLowerCase() === normalized.toLowerCase())) {
      onChange([...selectedTags, normalized]);
    }
    setCustomInput('');
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-300" />
          <span>{label}</span>
        </label>
        {selectedTags.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
          >
            Clear ({selectedTags.length})
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {allOptions.map((tag) => {
          const isActive = selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase());
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1 ${
                compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
              } rounded-lg font-medium border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-cyan-50 border-cyan-700 text-cyan-900 dark:bg-cyan-400/15 dark:border-cyan-400/45 dark:text-cyan-200'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-950 hover:border-slate-400 dark:bg-[#071122] dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-700'
              }`}
            >
              <span>{tag}</span>
              {isActive && <X className="w-3 h-3 text-cyan-800 dark:text-cyan-300" />}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          placeholder="Add custom tag (e.g. ClientA, Bonus)"
          maxLength={25}
          className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
        />
        <button
          type="button"
          onClick={handleAddCustom}
          disabled={!normalizeTag(customInput)}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-cyan-700 disabled:opacity-45 text-xs font-medium text-cyan-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/50 dark:text-cyan-300 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-600 dark:text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
