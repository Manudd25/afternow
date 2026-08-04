import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { City } from '../types';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { FEATURED_CITIES } from '../data/cities';
import { useCitySearch } from '../hooks/useCitySearch';
import { navigateToCity } from '../utils/cityStorage';

function AnimatedEarth() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-surface to-[#0a1628]" />

      {/* Light blue aurora gradients */}
      <div className="absolute -left-1/4 top-0 h-[70%] w-[70%] rounded-full bg-sky-500/15 blur-[120px]" />
      <div className="absolute -right-1/4 top-1/4 h-[60%] w-[60%] rounded-full bg-cyan-400/10 blur-[100px]" />
      <div className="absolute bottom-1/4 left-1/3 h-[40%] w-[50%] rounded-full bg-blue-400/10 blur-[90px]" />

      {/* Stars */}
      {[...Array(60)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-0.5 w-0.5 rounded-full bg-white"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 60}%`,
            opacity: Math.random() * 0.5 + 0.1,
          }}
          animate={{ opacity: [0.1, 0.6, 0.1] }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Earth glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          className="relative"
        >
          <div className="absolute -inset-20 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="absolute -inset-10 rounded-full bg-cyan-300/15 blur-2xl" />

          <div className="relative h-64 w-64 md:h-80 md:w-80 rounded-full overflow-hidden">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `
                  radial-gradient(circle at 35% 35%, rgba(125,211,252,0.45), transparent 55%),
                  radial-gradient(circle at 50% 50%, #1e4a7a 0%, #0f2744 65%, #0a0a0f 100%)
                `,
              }}
            />
            <div
              className="absolute inset-0 rounded-full opacity-40"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cellipse cx='100' cy='80' rx='40' ry='25' fill='%237dd3fc' opacity='0.35'/%3E%3Cellipse cx='70' cy='120' rx='25' ry='30' fill='%2338bdf8' opacity='0.25'/%3E%3Cellipse cx='140' cy='110' rx='20' ry='35' fill='%2360a5fa' opacity='0.3'/%3E%3C/svg%3E")`,
                backgroundSize: 'cover',
              }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow:
                  'inset -20px -10px 40px rgba(0,0,0,0.5), inset 10px 10px 30px rgba(125,211,252,0.2)',
              }}
            />
          </div>

          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="h-96 w-96 md:h-[480px] md:w-[480px] rounded-full border border-sky-400/20"
              style={{ transform: 'rotateX(70deg)' }}
            />
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-surface via-surface/80 to-transparent" />
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { results, search, searching } = useCitySearch();

  const goToCity = (city: City) => {
    const { pathname, search: citySearch } = navigateToCity(city);
    navigate({ pathname, search: citySearch });
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedEarth />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4 text-sm font-semibold uppercase tracking-widest text-sky-300"
          >
            AI-Powered Future City Explorer
          </motion.p>

          <h1 className="mb-4 bg-gradient-to-r from-sky-100 via-sky-300 to-cyan-200 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-7xl">
            AfterNow
          </h1>

          <h2 className="mb-6 text-xl font-light text-sky-100/80 md:text-2xl">
            Explore tomorrow&apos;s world.
          </h2>

          <p className="mx-auto mb-8 max-w-lg text-base leading-relaxed text-text-secondary md:text-lg">
            Discover how cities could evolve over the next decades through science,
            data and artificial intelligence.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mx-auto mb-6 w-full max-w-xl"
          >
            <SearchBar
              variant="hero"
              results={results}
              onSearch={search}
              searching={searching}
              onSelect={goToCity}
              placeholder="Type any city — Paris, Tokyo, São Paulo…"
              className="mx-auto"
            />
            <p className="mt-2 text-xs text-sky-200/50">
              Press Enter or pick a result to explore its climate future
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/explore">
              <Button
                size="lg"
                className="group bg-gradient-to-r from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30 hover:from-sky-400 hover:to-blue-500"
              >
                Browse featured cities
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-12 left-0 right-0 px-6"
        >
          <p className="mb-4 text-xs uppercase tracking-wider text-sky-200/45">Featured cities</p>
          <div className="flex flex-wrap justify-center gap-3">
            {FEATURED_CITIES.slice(0, 5).map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => goToCity(city)}
                className="rounded-full border border-sky-400/25 bg-sky-500/10 px-4 py-1.5 text-sm text-sky-100/90 backdrop-blur-sm transition-all hover:border-sky-300/50 hover:bg-sky-400/20 hover:text-white"
              >
                {city.name}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
