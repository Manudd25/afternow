import type { DataSource } from '../../types';

interface SourceBadgeProps {
  source: DataSource;
}

const SOURCE_COLORS: Record<DataSource, string> = {
  'Open-Meteo': 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/35',
  NASA: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/35',
  Copernicus: 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/35',
  IPCC: 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-400/35',
  CMIP6: 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/35',
};

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${SOURCE_COLORS[source]}`}
    >
      {source}
    </span>
  );
}
