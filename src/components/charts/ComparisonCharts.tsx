import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { CityProjection } from '../../types';
import { GlassPanel } from '../ui/GlassPanel';

interface ComparisonChartsProps {
  cityA: CityProjection;
  cityB: CityProjection;
}

export function ComparisonCharts({ cityA, cityB }: ComparisonChartsProps) {
  const barData = [
    {
      metric: 'Temperature',
      [cityA.city.name]: cityA.baseline.avgTemperature,
      [cityB.city.name]: cityB.baseline.avgTemperature,
    },
    {
      metric: 'Rainfall',
      [cityA.city.name]: cityA.baseline.rainfall,
      [cityB.city.name]: cityB.baseline.rainfall,
    },
    {
      metric: 'Heatwaves',
      [cityA.city.name]: cityA.baseline.heatwaveDays,
      [cityB.city.name]: cityB.baseline.heatwaveDays,
    },
    {
      metric: 'Air Quality',
      [cityA.city.name]: cityA.baseline.airQualityIndex,
      [cityB.city.name]: cityB.baseline.airQualityIndex,
    },
  ];

  const getRisk = (projection: CityProjection, id: string) => {
    const m = projection.metrics.find((m) => m.id === id);
    return m ? Number(m.value) : 0;
  };

  const radarData = [
    { subject: 'Flood', A: getRisk(cityA, 'flood'), B: getRisk(cityB, 'flood') },
    { subject: 'Wildfire', A: getRisk(cityA, 'wildfire'), B: getRisk(cityB, 'wildfire') },
    { subject: 'Water', A: getRisk(cityA, 'water-stress'), B: getRisk(cityB, 'water-stress') },
    { subject: 'Heat', A: getRisk(cityA, 'heatwaves'), B: getRisk(cityB, 'heatwaves') },
    { subject: 'Air', A: cityA.baseline.airQualityIndex, B: cityB.baseline.airQualityIndex },
  ];

  const tooltipStyle = {
    backgroundColor: 'rgba(18, 18, 26, 0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    fontSize: '12px',
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassPanel className="p-5">
        <h3 className="text-sm font-medium mb-4">Climate Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey={cityA.city.name} fill="#60a5fa" radius={[4, 4, 0, 0]} />
            <Bar dataKey={cityB.city.name} fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassPanel>

      <GlassPanel className="p-5">
        <h3 className="text-sm font-medium mb-4">Risk Profile</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
            <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
            <Radar
              name={cityA.city.name}
              dataKey="A"
              stroke="#60a5fa"
              fill="#60a5fa"
              fillOpacity={0.15}
            />
            <Radar
              name={cityB.city.name}
              dataKey="B"
              stroke="#a78bfa"
              fill="#a78bfa"
              fillOpacity={0.15}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Tooltip contentStyle={tooltipStyle} />
          </RadarChart>
        </ResponsiveContainer>
      </GlassPanel>
    </div>
  );
}
