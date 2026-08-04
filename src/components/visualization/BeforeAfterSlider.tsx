import { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '../../utils/formatters';

interface BeforeAfterSliderProps {
  beforeLabel: string;
  afterLabel: string;
  before: React.ReactNode;
  after: React.ReactNode;
  className?: string;
}

export function BeforeAfterSlider({
  beforeLabel,
  afterLabel,
  before,
  after,
  className,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 2));
      if (e.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 2));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative select-none overflow-hidden rounded-xl', className)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* After (full width, bottom layer) */}
      <div className="relative w-full">{after}</div>

      {/* Before (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {before}
      </div>

      {/* Slider handle */}
      <div
        className="absolute inset-y-0 z-20 flex w-10 -translate-x-1/2 cursor-ew-resize items-center justify-center"
        style={{ left: `${position}%` }}
        onPointerDown={onPointerDown}
        role="slider"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Before and after comparison slider"
        tabIndex={0}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black/60 shadow-lg backdrop-blur-sm">
          <GripVertical className="h-4 w-4 text-white" />
        </div>
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
      </div>

      {/* Labels */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {beforeLabel}
      </div>
      <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {afterLabel}
      </div>
    </div>
  );
}
