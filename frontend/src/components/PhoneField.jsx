import React, { useState, useRef } from 'react';
import { parsePhoneNumber, getCountries, getCountryCallingCode } from 'react-phone-number-input/input';
import en from 'react-phone-number-input/locale/en.json';

// Emoji flag din codul de țară
const flag = (code) =>
  code
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(0x1f1e6 + ch.charCodeAt(0) - 65));

// Generăm lista de țări cu prefixuri
const COUNTRIES = getCountries().map((code) => ({
  code,
  label: en[code] || code,
  prefix: `+${getCountryCallingCode(code)}`,
  flag: flag(code),
})).sort((a, b) => a.label.localeCompare(b.label));

export default function PhoneField({ value = '', onChange }) {
  const [country, setCountry] = useState('RO');
  const [inputVal, setInputVal] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  const chosen = COUNTRIES.find(c => c.code === country) || COUNTRIES.find(c => c.code === 'RO');

  const handleInput = (e) => {
    let v = e.target.value;
    // Dacă scrie cu 0 la început, șterge automat 0-ul
    if (v.startsWith('0')) v = v.slice(1);
    setInputVal(v);
    const full = v ? `${chosen.prefix}${v}` : '';
    onChange(full);
  };

  const selectCountry = (code) => {
    setCountry(code);
    setOpen(false);
    setSearch('');
    const c = COUNTRIES.find(x => x.code === code);
    const num = inputVal ? `${c.prefix}${inputVal}` : '';
    onChange(num);
    inputRef.current?.focus();
  };

  const filtered = search
    ? COUNTRIES.filter(c =>
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.prefix.includes(search)
      )
    : COUNTRIES;

  return (
    <div style={{ position: 'relative' }}>
      {/* Containerul principal — TOT într-un singur box */}
      <div
        className="sd-phone-box"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selector țară */}
        <button
          type="button"
          className="sd-phone-country"
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
          aria-label="Selectează țara"
        >
          <span className="sd-phone-flag">{chosen.flag}</span>
          <span className="sd-phone-prefix">{chosen.prefix}</span>
          <svg className="sd-phone-arrow" viewBox="0 0 10 6" fill="none">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Separator */}
        <div className="sd-phone-sep" />

        {/* Input număr */}
        <input
          ref={inputRef}
          type="tel"
          className="sd-phone-num"
          value={inputVal}
          onChange={handleInput}
          placeholder="712 345 678"
          autoComplete="tel-national"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="sd-phone-dropdown" ref={dropRef}>
          <div className="sd-phone-search-wrap">
            <input
              autoFocus
              type="text"
              className="sd-phone-search"
              placeholder="Caută țara…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="sd-phone-list">
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                className={`sd-phone-opt${c.code === country ? ' active' : ''}`}
                onClick={() => selectCountry(c.code)}
              >
                <span>{c.flag}</span>
                <span className="sd-phone-opt-label">{c.label}</span>
                <span className="sd-phone-opt-prefix">{c.prefix}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
