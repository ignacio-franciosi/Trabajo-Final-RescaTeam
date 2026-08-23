import React, { useEffect, useRef, useState } from 'react';
import { CORDOBA_BARRIOS } from '../../data/cordobaBarrios';

/*
  Props:
    value: string
    onChange: (value:string)=>void
    required?: boolean
    label?: string
*/
const ZoneSelect = ({ value, onChange, required, label = 'Zona' }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlight, setHighlight] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const filtered = CORDOBA_BARRIOS.filter(b => b.toLowerCase().includes(query.toLowerCase()));

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!open) {
            setQuery('');
            setHighlight(0);
        }
    }, [open]);

    const commitValue = (val) => {
        onChange(val);
        setOpen(false);
    };

    const handleKey = (e) => {
        if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
            setOpen(true); return;
        }
        if (!open) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight(h => Math.min(filtered.length - 1, h + 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight(h => Math.max(0, h - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[highlight]) commitValue(filtered[highlight]);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <label className="text-sm font-medium block mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
            <div
                className={`flex items-center border rounded-md px-3 py-2 text-sm bg-white cursor-text ${open ? 'ring-2 ring-blue-500' : 'border-gray-300'}`}
                onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 0); }}
                onKeyDown={handleKey}
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <div className="flex-1 min-w-0">
                    {open ? (
                        <input
                            ref={inputRef}
                            className="w-full outline-none text-sm"
                            placeholder="Buscar barrio..."
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
                        />
                    ) : (
                        <span className={`truncate ${!value ? 'text-gray-400' : ''}`}>{value || 'Seleccionar barrio'}</span>
                    )}
                </div>
                {value && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChange(''); }}
                        className="text-gray-400 hover:text-gray-600 text-xs mr-2"
                        aria-label="Limpiar selección"
                    >×</button>
                )}
                <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
            </div>
            {open && (
                <ul
                    ref={listRef}
                    className="absolute z-20 mt-1 max-h-60 w-full overflow-auto bg-white border border-gray-200 rounded-md shadow-md text-sm"
                    role="listbox"
                >
                    {filtered.length === 0 && (
                        <li className="px-3 py-2 text-gray-500">Sin resultados</li>
                    )}
                    {filtered.map((barrio, idx) => (
                        <li
                            key={barrio}
                            role="option"
                            aria-selected={value === barrio}
                            className={`px-3 py-2 cursor-pointer flex justify-between ${idx === highlight ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'} ${value === barrio && idx !== highlight ? 'font-semibold' : ''}`}
                            onMouseEnter={() => setHighlight(idx)}
                            onMouseDown={(e) => { e.preventDefault(); commitValue(barrio); }}
                        >
                            <span className="truncate">{barrio}</span>
                            {value === barrio && <span className="text-xs">✓</span>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ZoneSelect;
