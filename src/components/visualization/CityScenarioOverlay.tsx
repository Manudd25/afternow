import type { VisualEffects } from '../../types/visualization';
import { cn } from '../../utils/formatters';

interface CityScenarioOverlayProps {
  effects: VisualEffects;
  className?: string;
}

/**
 * CSS-based overlay layers that simulate future environmental changes
 * on top of a base city photograph.
 */
export function CityScenarioOverlay({ effects, className }: CityScenarioOverlayProps) {
  const {
    heatIntensity,
    droughtDryness,
    wildfireHaze,
    waterLevel,
    vegetationDensity,
    urbanGreenery,
    floodInfrastructure,
    reflectiveRoofs,
    shadedPedestrianAreas,
    coastalAdaptation,
    yearProgress,
  } = effects;

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {/* Heat warm tint */}
      {heatIntensity > 0.05 && (
        <div
          className="absolute inset-0 mix-blend-overlay transition-opacity duration-700"
          style={{
            opacity: heatIntensity * 0.7,
            background: `linear-gradient(180deg, rgba(255,180,80,0.35) 0%, rgba(255,120,50,0.15) 60%, transparent 100%)`,
          }}
        />
      )}

      {/* Drought desaturation / dryness */}
      {droughtDryness > 0.05 && (
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: droughtDryness * 0.55,
            background: `linear-gradient(180deg, rgba(180,150,90,0.2) 0%, rgba(140,110,60,0.25) 100%)`,
            mixBlendMode: 'soft-light',
          }}
        />
      )}

      {/* Wildfire haze */}
      {wildfireHaze > 0.05 && (
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: wildfireHaze * 0.6,
            background: `linear-gradient(180deg, rgba(200,120,60,0.25) 0%, rgba(160,90,40,0.15) 50%, transparent 100%)`,
          }}
        />
      )}

      {/* Vegetation / greenery boost in lower portion */}
      {(vegetationDensity > 0.2 || urbanGreenery > 0.15) && (
        <div
          className="absolute inset-x-0 bottom-0 h-2/5 transition-opacity duration-700"
          style={{
            opacity: (vegetationDensity * 0.35 + urbanGreenery * 0.4),
            background: `linear-gradient(0deg, rgba(40,120,60,0.35) 0%, rgba(60,140,80,0.15) 50%, transparent 100%)`,
            mixBlendMode: 'multiply',
          }}
        />
      )}

      {/* Urban greenery dots (trees along streets) */}
      {urbanGreenery > 0.2 && (
        <div
          className="absolute inset-x-0 bottom-[15%] h-8 transition-opacity duration-700"
          style={{
            opacity: urbanGreenery * 0.5,
            backgroundImage: `radial-gradient(circle, rgba(50,140,70,0.6) 2px, transparent 2px)`,
            backgroundSize: '24px 12px',
          }}
        />
      )}

      {/* Water level / flood */}
      {waterLevel > 0.05 && (
        <div
          className="absolute inset-x-0 bottom-0 transition-all duration-700"
          style={{
            height: `${8 + waterLevel * 22}%`,
            background: `linear-gradient(0deg, rgba(30,80,140,0.55) 0%, rgba(50,120,180,0.25) 60%, transparent 100%)`,
          }}
        />
      )}

      {/* Flood infrastructure hint — elevated walkway line */}
      {floodInfrastructure > 0.15 && (
        <div
          className="absolute inset-x-[10%] bottom-[18%] h-0.5 transition-opacity duration-700"
          style={{
            opacity: floodInfrastructure * 0.6,
            background: 'linear-gradient(90deg, transparent, rgba(200,210,220,0.7), transparent)',
            boxShadow: '0 -2px 8px rgba(100,150,200,0.3)',
          }}
        />
      )}

      {/* Reflective roofs — subtle highlights on upper buildings */}
      {reflectiveRoofs > 0.1 && (
        <div
          className="absolute inset-x-0 top-0 h-1/3 transition-opacity duration-700"
          style={{
            opacity: reflectiveRoofs * 0.35,
            background: `linear-gradient(180deg, rgba(200,220,240,0.2) 0%, transparent 100%)`,
          }}
        />
      )}

      {/* Shaded pedestrian areas */}
      {shadedPedestrianAreas > 0.15 && (
        <div
          className="absolute inset-x-[5%] bottom-[8%] h-[12%] transition-opacity duration-700 rounded-sm"
          style={{
            opacity: shadedPedestrianAreas * 0.4,
            background: `repeating-linear-gradient(90deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 8px, transparent 8px, transparent 20px)`,
          }}
        />
      )}

      {/* Coastal adaptation — horizon barrier */}
      {coastalAdaptation > 0.15 && (
        <div
          className="absolute inset-x-0 bottom-[12%] h-1 transition-opacity duration-700"
          style={{
            opacity: coastalAdaptation * 0.7,
            background: 'rgba(180,190,200,0.6)',
            boxShadow: '0 0 12px rgba(100,150,200,0.4)',
          }}
        />
      )}

      {/* Future-era subtle cool adaptation tone for later years */}
      {yearProgress > 0.3 && (
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: yearProgress * 0.08,
            background: 'linear-gradient(135deg, rgba(80,160,120,0.1) 0%, transparent 50%)',
          }}
        />
      )}
    </div>
  );
}
