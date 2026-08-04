export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function riskColor(level?: string): string {
  switch (level) {
    case 'low':
      return 'text-emerald-300';
    case 'moderate':
      return 'text-amber-300';
    case 'high':
      return 'text-orange-300';
    case 'very-high':
      return 'text-red-300';
    default:
      return 'text-slate-300';
  }
}

export function riskBgColor(level?: string): string {
  switch (level) {
    case 'low':
      return 'bg-emerald-500/15 border-emerald-400/40';
    case 'moderate':
      return 'bg-amber-500/15 border-amber-400/40';
    case 'high':
      return 'bg-orange-500/15 border-orange-400/40';
    case 'very-high':
      return 'bg-red-500/15 border-red-400/40';
    default:
      return 'bg-white/5 border-white/15';
  }
}

export function riskBarColor(level?: string): string {
  switch (level) {
    case 'low':
      return 'bg-gradient-to-r from-emerald-400 to-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
    case 'moderate':
      return 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.5)]';
    case 'high':
      return 'bg-gradient-to-r from-orange-400 to-orange-300 shadow-[0_0_8px_rgba(251,146,60,0.5)]';
    case 'very-high':
      return 'bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_8px_rgba(248,113,113,0.55)]';
    default:
      return 'bg-gradient-to-r from-accent to-sky-300 shadow-[0_0_8px_rgba(96,165,250,0.45)]';
  }
}

export function confidenceLabel(level: string): string {
  switch (level) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Lower confidence';
    default:
      return level;
  }
}

export function trendIcon(trend: string): string {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    default:
      return '→';
  }
}

export function zoneColor(type: string): string {
  switch (type) {
    case 'flood':
      return '#3b82f6';
    case 'wildfire':
      return '#f97316';
    case 'heat':
      return '#ef4444';
    case 'drought':
      return '#eab308';
    default:
      return '#60a5fa';
  }
}
