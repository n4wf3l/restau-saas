import topo from 'world-atlas/countries-50m.json' with { type: 'json' };
import { feature } from 'topojson-client';

const countries = feature(topo, topo.objects.countries).features;
const morocco = countries.find(c => c.properties.name === 'Morocco');
const ring = morocco.geometry.coordinates[0];

// Equirectangular projection with cos(midLat) x-correction for a natural shape.
let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
for (const [lng, lat] of ring) {
  if (lng < minLng) minLng = lng;
  if (lng > maxLng) maxLng = lng;
  if (lat < minLat) minLat = lat;
  if (lat > maxLat) maxLat = lat;
}
const midLat = (minLat + maxLat) / 2;
const kx = Math.cos((midLat * Math.PI) / 180);

// Scale so the larger axis ≈ 100 units, keep proper aspect
const spanX = (maxLng - minLng) * kx;
const spanY = maxLat - minLat;
const scale = 100 / Math.max(spanX, spanY);

const project = ([lng, lat]) => {
  const x = (lng - minLng) * kx * scale;
  const y = (maxLat - lat) * scale;
  return [x, y];
};

// Build path with M + L commands, round to 2 decimals for compactness
const pts = ring.map(project);
const d = pts
  .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`)
  .join('') + 'Z';

const width = (spanX * scale).toFixed(2);
const height = (spanY * scale).toFixed(2);

console.log(`viewBox: "0 0 ${width} ${height}"`);
console.log(`path d="${d}"`);
console.log(`length: ${d.length} chars`);
