import { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { City, MapRiskZone } from '../../types';
import { zoneColor } from '../../utils/formatters';
import { GlassPanel } from '../ui/GlassPanel';

// Fix default marker icon issue in bundlers
const markerIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 16px; height: 16px;
    background: #60a5fa;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(96,165,250,0.6);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function MapController({ city }: { city: City }) {
  const map = useMap();

  useEffect(() => {
    map.setView([city.lat, city.lng], 11, { animate: true });
  }, [city, map]);

  return null;
}

interface CityMapProps {
  city: City;
  riskZones: MapRiskZone[];
  className?: string;
}

const ZONE_LABELS: Record<MapRiskZone['type'], string> = {
  flood: 'Flood Risk',
  wildfire: 'Wildfire Risk',
  heat: 'Heat Risk',
  drought: 'Drought Risk',
};

export function CityMap({ city, riskZones, className }: CityMapProps) {
  return (
    <GlassPanel className={`overflow-hidden ${className ?? ''}`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
        <h3 className="text-sm font-medium">Risk Map</h3>
        <div className="flex gap-3">
          {(['flood', 'wildfire', 'heat', 'drought'] as const).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: zoneColor(type) }}
              />
              <span className="text-[10px] text-text-muted capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[400px] w-full">
        <MapContainer
          center={[city.lat, city.lng]}
          zoom={11}
          scrollWheelZoom={true}
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController city={city} />
          <Marker position={[city.lat, city.lng]} icon={markerIcon}>
            <Popup>
              <strong>{city.name}</strong>
              <br />
              {city.country}
            </Popup>
          </Marker>

          {riskZones.map((zone) => (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={zone.radius}
              pathOptions={{
                color: zoneColor(zone.type),
                fillColor: zoneColor(zone.type),
                fillOpacity: zone.intensity * 0.25,
                weight: 1.5,
                opacity: 0.6,
              }}
            >
              <Popup>
                <strong>{ZONE_LABELS[zone.type]}</strong>
                <br />
                {zone.label}
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>
    </GlassPanel>
  );
}
