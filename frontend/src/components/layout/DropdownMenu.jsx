import React, { useEffect, useRef, useState } from 'react';

const DropdownMenu = ({ options, onSelect, label = 'Perfil', compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const handleSelect = (action) => {
    onSelect(action);
    setIsOpen(false);
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 rounded-full ${compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'} bg-neutral-700 text-white hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="truncate max-w-[12rem]">{label}</span>
        <svg className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.4a.75.75 0 01-1.08 0l-4.24-4.4a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-neutral-800 text-white ring-1 ring-white/10 shadow-xl overflow-hidden z-50">
          <div className="py-1">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelect(option.action)}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-700/80"
              >
                {/* option.label puede ser string o ReactNode */}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
