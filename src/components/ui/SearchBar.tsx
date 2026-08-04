import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Loader2 } from 'lucide-react';
import type { City } from '../../types';
import { cn } from '../../utils/formatters';

interface SearchBarProps {
  onSelect: (city: City) => void;
  results: City[];
  onSearch: (query: string) => void;
  searching?: boolean;
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'hero';
}

export function SearchBar({
  onSelect,
  results,
  onSearch,
  searching = false,
  placeholder = 'Search any city...',
  className,
  variant = 'default',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value);
    setOpen(true);
  };

  const handleSelect = (city: City) => {
    setQuery(city.name);
    setOpen(false);
    onSelect(city);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (results.length > 0) {
      handleSelect(results[0]);
    }
  };

  const isHero = variant === 'hero';

  return (
    <div ref={containerRef} className={cn('relative w-full', isHero ? 'max-w-xl' : 'max-w-md', className)}>
      {isHero && (
        <div
          className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-sky-400/40 via-cyan-300/30 to-blue-500/40 blur-md"
          aria-hidden
        />
      )}

      <div className="relative">
        <Search
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-sky-300/80',
            isHero ? 'left-5 h-5 w-5' : 'left-4 h-4 w-4 text-text-muted'
          )}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-xl border text-white placeholder:text-text-muted backdrop-blur-xl transition-all focus:outline-none',
            isHero
              ? 'border-sky-400/35 bg-sky-950/40 py-4 pl-14 pr-12 text-base shadow-[0_0_30px_-8px_rgba(56,189,248,0.45)] focus:border-sky-300/60 focus:bg-sky-950/55 focus:ring-2 focus:ring-sky-400/25'
              : 'border-white/10 bg-white/5 py-3 pl-11 pr-10 text-sm focus:border-accent/50 focus:bg-white/8 focus:ring-2 focus:ring-accent/20'
          )}
        />
        {searching && (
          <Loader2
            className={cn(
              'absolute top-1/2 -translate-y-1/2 animate-spin text-sky-300',
              isHero ? 'right-5 h-5 w-5' : 'right-4 h-4 w-4 text-text-muted'
            )}
          />
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-2 w-full overflow-hidden rounded-xl border backdrop-blur-xl shadow-2xl',
              isHero
                ? 'border-sky-400/25 bg-sky-950/90'
                : 'border-white/10 bg-surface-elevated/95'
            )}
          >
            <ul className="max-h-64 overflow-y-auto py-1">
              {results.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(city)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-sky-400/10"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-sky-300" />
                    <div>
                      <span className="font-medium text-white">{city.name}</span>
                      <span className="ml-2 text-text-muted">{city.country}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
