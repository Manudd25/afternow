import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h4 className="text-sm font-semibold mb-3">AfterNow</h4>
            <p className="text-sm text-text-muted leading-relaxed">
              Explore possible future scenarios of cities through science, data, and AI-generated insights.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Data Sources</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>NASA Climate Change Research</li>
              <li>Copernicus Climate Data Store</li>
              <li>IPCC Assessment Reports</li>
              <li>Open-Meteo Climate API</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/explore" className="text-text-muted hover:text-white transition-colors">
                  City Explorer
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-text-muted hover:text-white transition-colors">
                  Compare Cities
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            Projections represent possible futures, not certainties. Built for exploration and education.
          </p>
          <p className="text-xs text-text-muted">© 2026 AfterNow</p>
        </div>
      </div>
    </footer>
  );
}
