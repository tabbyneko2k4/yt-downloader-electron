import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronsUpDown, Check, Layers, Square, CheckSquare } from 'lucide-react';

/**
 * Normalizes options prop or JSX children (<option>, <optgroup>) into a unified structure:
 * Array of items:
 * - Option item: { value, label, disabled, description, icon }
 * - Group item: { group, options: [...] }
 */
function parseOptions(optionsProp, children) {
  if (optionsProp && Array.isArray(optionsProp)) {
    return optionsProp;
  }

  const parsed = [];

  const processChild = (child) => {
    if (!child) return;

    if (Array.isArray(child)) {
      child.forEach(processChild);
      return;
    }

    if (
      child.type === React.Fragment ||
      (child.props && child.props.children && typeof child.type === 'symbol')
    ) {
      React.Children.forEach(child.props.children, processChild);
      return;
    }

    if (child.type === 'option') {
      const val = child.props.value !== undefined ? child.props.value : child.props.children;
      parsed.push({
        value: val,
        label: child.props.children,
        disabled: child.props.disabled,
      });
    } else if (child.type === 'optgroup') {
      const groupOptions = [];
      React.Children.forEach(child.props.children, (optChild) => {
        if (optChild && optChild.type === 'option') {
          const val = optChild.props.value !== undefined ? optChild.props.value : optChild.props.children;
          groupOptions.push({
            value: val,
            label: optChild.props.children,
            disabled: optChild.props.disabled,
          });
        }
      });
      parsed.push({
        group: child.props.label,
        options: groupOptions,
      });
    }
  };

  React.Children.forEach(children, processChild);

  return parsed;
}

/**
 * Catalyst Tailwind UI Style Listbox Component with React Portal & Fixed Positioning
 * Supports both Single Select and Multi-Select (multiple={true})
 */
export default function Listbox({
  value,
  onChange,
  options: optionsProp,
  children,
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
  name = '',
  id,
  size = 'md', // 'sm' | 'md'
  multiple = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState({});
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const listboxId = useId();

  const optionsList = parseOptions(optionsProp, children);

  // Flatten options for easy index calculation & keyboard navigation
  const flatOptions = useMemo(() => {
    const list = [];
    optionsList.forEach((item) => {
      if (item.group && Array.isArray(item.options)) {
        item.options.forEach((opt) => list.push({ ...opt, group: item.group }));
      } else {
        list.push(item);
      }
    });
    return list;
  }, [optionsList]);

  // Handle Multi-select values (array or comma-separated string)
  const selectedValues = useMemo(() => {
    if (!multiple) return [];
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [value, multiple]);

  // Find currently selected option item for single select
  const selectedOption = useMemo(() => {
    if (multiple) return null;
    return flatOptions.find((opt) => String(opt.value) === String(value));
  }, [flatOptions, value, multiple]);

  // Update fixed portal positioning
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuMaxHeight = 250;
      const openUpward = spaceBelow < menuMaxHeight && rect.top > menuMaxHeight;

      const style = {
        position: 'fixed',
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 99999,
      };

      if (openUpward) {
        style.bottom = `${window.innerHeight - rect.top + 6}px`;
        style.transformOrigin = 'bottom left';
      } else {
        style.top = `${rect.bottom + 6}px`;
        style.transformOrigin = 'top left';
      }

      setMenuStyle(style);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => {
        updatePosition();
      };
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      if (!multiple) {
        const idx = flatOptions.findIndex((opt) => String(opt.value) === String(value));
        setActiveIndex(idx >= 0 ? idx : 0);
      } else {
        setActiveIndex(0);
      }
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue, isOptDisabled) => {
    if (isOptDisabled) return;

    if (!multiple) {
      setIsOpen(false);
      if (onChange) {
        const syntheticEvent = {
          target: { value: optionValue, name: name || '' },
          preventDefault: () => {},
          stopPropagation: () => {},
        };
        onChange(syntheticEvent, optionValue);
      }
    } else {
      const strVal = String(optionValue);
      let newValues;
      if (selectedValues.includes(strVal)) {
        newValues = selectedValues.filter((v) => v !== strVal);
      } else {
        newValues = [...selectedValues, strVal];
      }
      const joinedStr = newValues.join(',');
      if (onChange) {
        const syntheticEvent = {
          target: { value: joinedStr, name: name || '', values: newValues },
          preventDefault: () => {},
          stopPropagation: () => {},
        };
        onChange(syntheticEvent, newValues, joinedStr);
      }
    }
  };

  // Keyboard navigation support
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        updatePosition();
        setActiveIndex(0);
      } else {
        setActiveIndex((prev) => (prev + 1) % flatOptions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        updatePosition();
        setActiveIndex(flatOptions.length - 1);
      } else {
        setActiveIndex((prev) => (prev - 1 + flatOptions.length) % flatOptions.length);
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && activeIndex >= 0 && activeIndex < flatOptions.length) {
        const opt = flatOptions[activeIndex];
        handleSelect(opt.value, opt.disabled);
      } else {
        setIsOpen(true);
        updatePosition();
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  // Render button contents for Multi-Select mode
  const renderMultiLabel = () => {
    if (selectedValues.length === 0) {
      return <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>;
    }

    if (selectedValues.length <= 2) {
      return (
        <div className="flex items-center gap-1.5 overflow-hidden">
          {selectedValues.map((v) => {
            const found = flatOptions.find((opt) => String(opt.value) === String(v));
            const labelText = found ? found.label : v;
            return (
              <span
                key={v}
                className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-pink-500/15 text-pink-600 dark:text-pink-300 border border-pink-400/30 shrink-0 truncate max-w-[120px]"
              >
                {labelText}
              </span>
            );
          })}
        </div>
      );
    }

    const matchedNames = selectedValues.map((v) => {
      const found = flatOptions.find((opt) => String(opt.value) === String(v));
      return found ? found.label.replace(/^[\p{Emoji}\S]+\s*/u, '') : v;
    });

    return (
      <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
        <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-pink-500 text-white shrink-0">
          {selectedValues.length}
        </span>
        <span className="truncate">{matchedNames.join(', ')}</span>
      </span>
    );
  };

  // Size variations
  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-[11px] rounded-lg'
      : 'px-3 py-2 text-xs rounded-xl';

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left font-sans select-none ${className}`}
    >
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        id={id || listboxId}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 font-medium tracking-tight text-slate-800 dark:text-slate-100 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-pink-500/50 dark:hover:border-pink-500/50 shadow-xs hover:shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 active:scale-[0.99] transition-all duration-200 cursor-pointer ${
          isOpen ? 'ring-2 ring-pink-500/40 border-pink-500 shadow-md bg-white dark:bg-slate-900' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-white dark:hover:bg-slate-900' : ''} ${sizeClasses} ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate flex items-center gap-1.5 flex-1 min-w-0">
          {multiple ? (
            renderMultiLabel()
          ) : selectedOption ? (
            <>
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span>{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}
        </span>
        <ChevronsUpDown
          size={14}
          className={`shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-pink-500 dark:text-pink-400' : ''
          }`}
        />
      </button>

      {/* Floating Options Menu rendered via Portal */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={menuStyle}
            className={`max-h-64 overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-1.5 shadow-2xl shadow-slate-950/40 ring-1 ring-black/5 dark:ring-white/10 focus:outline-none custom-scrollbar transition-all duration-150 animate-in fade-in-80 zoom-in-95 ${menuClassName}`}
          >
            {/* Quick multi-select control bar */}
            {multiple && flatOptions.length > 0 && (
              <div className="flex items-center justify-between px-2 py-1 mb-1 pb-1.5 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span>Đã chọn: <strong className="text-pink-500 font-bold">{selectedValues.length}</strong></span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    className="text-pink-500 dark:text-pink-400 hover:underline cursor-pointer font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      const allVals = flatOptions.map((f) => String(f.value));
                      const joinedStr = allVals.join(',');
                      if (onChange) {
                        onChange({ target: { value: joinedStr, name: name || '', values: allVals } }, allVals, joinedStr);
                      }
                    }}
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-200 hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onChange) {
                        onChange({ target: { value: '', name: name || '', values: [] } }, [], '');
                      }
                    }}
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}

            {optionsList.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
                No options available
              </div>
            ) : (
              optionsList.map((item, groupIdx) => {
                if (item.group && Array.isArray(item.options)) {
                  return (
                    <div key={`group-${groupIdx}`} className="space-y-0.5">
                      <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/30 rounded-lg my-1 flex items-center gap-1">
                        <Layers size={10} className="text-purple-500" />
                        <span>{item.group}</span>
                      </div>
                      {item.options.map((opt) => {
                        const isSelected = multiple
                          ? selectedValues.includes(String(opt.value))
                          : String(opt.value) === String(value);
                        const optFlatIndex = flatOptions.findIndex(
                          (f) => String(f.value) === String(opt.value) && f.group === item.group
                        );
                        const isActive = optFlatIndex === activeIndex;

                        return (
                          <div
                            key={String(opt.value)}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleSelect(opt.value, opt.disabled)}
                            onMouseEnter={() => setActiveIndex(optFlatIndex)}
                            className={`group relative flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 select-none ${
                              isSelected
                                ? 'bg-pink-50 dark:bg-pink-500/15 text-pink-600 dark:text-pink-300 font-bold'
                                : isActive
                                ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                            } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <span className="truncate flex items-center gap-1.5">
                              {multiple && (
                                <span className="shrink-0 text-pink-500">
                                  {isSelected ? <CheckSquare size={14} /> : <Square size={14} className="opacity-40" />}
                                </span>
                              )}
                              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                              <span>{opt.label}</span>
                            </span>
                            {!multiple && isSelected && (
                              <Check
                                size={14}
                                className="text-pink-500 dark:text-pink-400 shrink-0 ml-2 stroke-[2.5]"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Standard Option
                const isSelected = multiple
                  ? selectedValues.includes(String(item.value))
                  : String(item.value) === String(value);
                const optFlatIndex = flatOptions.findIndex((f) => String(f.value) === String(item.value));
                const isActive = optFlatIndex === activeIndex;

                return (
                  <div
                    key={String(item.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item.value, item.disabled)}
                    onMouseEnter={() => setActiveIndex(optFlatIndex)}
                    className={`group relative flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 select-none ${
                      isSelected
                        ? 'bg-pink-50 dark:bg-pink-500/15 text-pink-600 dark:text-pink-300 font-bold'
                        : isActive
                        ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      {multiple && (
                        <span className="shrink-0 text-pink-500">
                          {isSelected ? <CheckSquare size={14} /> : <Square size={14} className="opacity-40" />}
                        </span>
                      )}
                      {item.icon && <span className="shrink-0">{item.icon}</span>}
                      <span>{item.label}</span>
                    </span>
                    {!multiple && isSelected && (
                      <Check
                        size={14}
                        className="text-pink-500 dark:text-pink-400 shrink-0 ml-2 stroke-[2.5]"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

