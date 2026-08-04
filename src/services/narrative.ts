import type { City, ClimateBaseline, TimelineYear } from '../types';
import type { ClimateScenarioDefinition } from '../config/climateScenarios';

export function generateSummary(
  city: City,
  year: TimelineYear,
  baseline: ClimateBaseline,
  rawBaseline: ClimateBaseline,
  climateScenario?: ClimateScenarioDefinition
): string {
  const tempDelta = baseline.avgTemperature - rawBaseline.avgTemperature;
  const rainDelta = baseline.rainfall - rawBaseline.rainfall;
  const heatDelta = baseline.heatwaveDays - rawBaseline.heatwaveDays;
  const yearLabel = year === 2025 ? 'today' : `${year}`;

  const parts: string[] = [];

  if (year === 2025) {
    parts.push(
      `${city.name} currently experiences an average temperature of ${baseline.avgTemperature}°C with about ${Math.round(baseline.rainfall)} mm of annual rainfall.`
    );
    if (baseline.heatwaveDays > 3) {
      parts.push(`The city sees roughly ${Math.round(baseline.heatwaveDays)} heatwave days per year.`);
    }
    parts.push('Explore the timeline to discover how this could change in the decades ahead.');
    return parts.join(' ');
  }

  // Temperature narrative
  if (tempDelta > 2) {
    parts.push(
      `By ${yearLabel}, ${city.name} is projected to experience significantly warmer conditions, with average temperatures rising by approximately ${tempDelta.toFixed(1)}°C.`
    );
  } else if (tempDelta > 0.5) {
    parts.push(
      `By ${yearLabel}, ${city.name} may see moderately warmer seasons, with temperatures about ${tempDelta.toFixed(1)}°C higher than today.`
    );
  } else {
    parts.push(
      `By ${yearLabel}, ${city.name} is expected to maintain relatively stable temperature patterns with modest changes.`
    );
  }

  // Heatwave narrative
  if (heatDelta > 5) {
    parts.push(
      `Heatwaves could become notably more frequent, with an estimated ${Math.round(baseline.heatwaveDays)} days per year exceeding extreme thresholds.`
    );
  } else if (heatDelta > 1) {
    parts.push(`Summer heatwaves may become somewhat more common than they are today.`);
  }

  // Rainfall narrative
  if (rainDelta < -50) {
    parts.push(
      `Rainfall patterns suggest a drier climate, which could increase water management considerations for the region.`
    );
  } else if (rainDelta > 50) {
    parts.push(
      `Increased rainfall is projected, which may raise flood preparedness as an urban planning priority.`
    );
  }

  // Coastal / positive framing
  if (city.coastal) {
    parts.push(
      `As a coastal city, ${city.name} will continue adapting its waterfront infrastructure, with community-led resilience projects offering meaningful pathways forward.`
    );
  } else {
    parts.push(
      `Urban greening initiatives and improved public transit could help ${city.name} adapt gracefully to these evolving conditions.`
    );
  }

  parts.push(
    climateScenario
      ? `These projections explore the "${climateScenario.label}" pathway (${climateScenario.emoji}) — an illustrative scenario, not a precise forecast. Actual outcomes depend on global emission pathways and local action.`
      : 'These projections represent one possible future based on current climate models — actual outcomes depend on global emission pathways and local action.'
  );

  return parts.join(' ');
}

export function generateStory(
  city: City,
  year: TimelineYear,
  baseline: ClimateBaseline,
  climateScenario?: ClimateScenarioDefinition
): string {
  if (year === 2025) {
    return generateTodayStory(city, baseline);
  }

  const season = baseline.avgTemperature > 22 ? 'warm' : baseline.avgTemperature > 12 ? 'mild' : 'cool';
  const timeOfDay = baseline.avgTemperature > 20 ? 'late afternoon' : 'a crisp morning';

  const paragraphs: string[] = [];

  paragraphs.push(
    `Imagine walking through ${city.name} on a ${season} ${timeOfDay} in ${year}. The air feels ${baseline.humidity > 60 ? 'humid and alive' : 'dry but pleasant'}, carrying the familiar rhythm of urban life.`
  );

  paragraphs.push(
    `The streets have evolved — bike lanes weave through neighborhoods where electric buses glide silently past cafés with outdoor seating. ${baseline.avgTemperature > 25 ? 'Many buildings now feature green roofs and reflective surfaces, providing shade during the warmer months.' : 'Tree-lined boulevards offer natural canopy, making walks through the city center comfortable year-round.'}`
  );

  paragraphs.push(
    `In the parks, families gather beneath ${baseline.heatwaveDays > 10 ? 'newly planted native trees that thrive in the warmer climate' : 'mature trees that have been carefully preserved'}. Community gardens dot the landscape, part of a broader movement toward local food production and greener neighborhoods.`
  );

  if (city.coastal) {
    paragraphs.push(
      `Near the waterfront, elevated walkways and restored wetlands create a buffer between the city and the sea. Local fishermen and marine biologists work together on conservation projects, and the harbor buzzes with hybrid ferry services connecting nearby communities.`
    );
  }

  paragraphs.push(
    `Transportation feels different too — ${baseline.avgTemperature > 20 ? 'cooling stations at transit hubs offer relief during peak summer hours, and' : 'Heated shelters at bus stops provide comfort in winter, and'} shared mobility options make getting around effortless. The metro, expanded over the decades, reaches neighborhoods that once felt distant.`
  );

  const scenarioNote = climateScenario
    ? ` In this "${climateScenario.label}" future, ${climateScenario.description.charAt(0).toLowerCase()}${climateScenario.description.slice(1)}`
    : '';

  paragraphs.push(
    `As evening falls, the city glows with energy-efficient lighting. Rooftop bars and cultural venues host conversations about art, technology, and the future.${scenarioNote} ${city.name} in ${year} isn't a dystopia — it's a city that learned, adapted, and grew together with its changing environment.`
  );

  return paragraphs.join('\n\n');
}

function generateTodayStory(city: City, baseline: ClimateBaseline): string {
  return `Today in ${city.name}, life unfolds against a backdrop of ${baseline.avgTemperature}°C average temperatures and ${Math.round(baseline.rainfall)} mm of annual rainfall. Streets hum with activity — commuters, cyclists, and tourists exploring historic neighborhoods and modern districts alike.

Parks provide green respite from urban density, while local markets showcase regional cuisine and culture. The city's character is shaped by its people, architecture, and the daily rhythms of ${city.region} climate.

Use the timeline slider to journey forward and discover how ${city.name} might transform in the decades ahead — not as prophecy, but as an invitation to imagine and shape what comes next.`;
}
