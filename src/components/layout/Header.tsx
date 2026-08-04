import { Link, useLocation } from 'react-router-dom';
import { Globe, BarChart3 } from 'lucide-react';
import { cn } from '../../utils/formatters';

export function Header() {
  const location = useLocation();

  const links = [
    { to: '/explore', label: 'Explore', icon: Globe },
    { to: '/compare', label: 'Compare', icon: BarChart3 },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
            <Globe className="h-4 w-4 text-accent" />
          </div>
          <span className="text-lg font-semibold tracking-tight">AfterNow</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                location.pathname.startsWith(to)
                  ? 'bg-white/8 text-white'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
