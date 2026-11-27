import fs from 'node:fs';

// The committed provenance file pins downloads for reproducible regeneration.
const sources = JSON.parse(fs.readFileSync('public/images/nigeria-boundary-sources.json', 'utf8'));
fs.mkdirSync('.preview', { recursive: true });
for (const source of sources) {
  const path = `.preview/nigeria-${source.level}.geojson`;
  if (!fs.existsSync(path)) {
    const response = await fetch(source.download, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Boundary download unavailable (${response.status})`);
    fs.writeFileSync(path, await response.text());
  }
}

const distance = (point, a, b) => {
  let x = a[0], y = a[1], dx = b[0] - x, dy = b[1] - y;
  if (dx || dy) { const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy); if (t > 1) { x = b[0]; y = b[1]; } else if (t > 0) { x += dx * t; y += dy * t; } }
  return (point[0] - x) ** 2 + (point[1] - y) ** 2;
};
function simplify(points) {
  if (points.length < 4) return points;
  let max = .36, index = -1;
  for (let i = 1; i < points.length - 1; i++) { const d = distance(points[i], points[0], points.at(-1)); if (d > max) { max = d; index = i; } }
  return index < 0 ? [points[0], points.at(-1)] : [...simplify(points.slice(0, index + 1)).slice(0, -1), ...simplify(points.slice(index))];
}
function silhouette(feature) {
  const rings = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates : feature.geometry.coordinates.flat();
  const points = rings.flat();
  const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]));
  const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));
  const correction = Math.cos((minY + maxY) / 2 * Math.PI / 180);
  const scale = 86 / Math.max((maxX - minX) * correction, maxY - minY);
  const project = p => [(p[0] - (minX + maxX) / 2) * correction * scale + 50, ((minY + maxY) / 2 - p[1]) * scale + 50];
  return rings.map(ring => simplify(ring.map(project))).filter(ring => ring.length > 3).map(ring => ring.map((p, i) => `${i ? 'L' : 'M'}${p.map(n => Number(n.toFixed(2))).join(',')}`).join('') + 'Z').join('');
}
const country = JSON.parse(fs.readFileSync('.preview/nigeria-ADM0.geojson', 'utf8'));
const states = JSON.parse(fs.readFileSync('.preview/nigeria-ADM1.geojson', 'utf8'));
if (states.features.length !== 37) throw new Error('Expected all 36 states and the FCT');
const name = feature => /federal|abuja|\bfct\b/i.test(feature.properties.shapeName) ? 'FCT' : feature.properties.shapeName.replace(/\s+state$/i, '');
const features = states.features.map(feature => ({ name: name(feature), path: silhouette(feature) })).sort((a, b) => a.name.localeCompare(b.name));
const preferred = ['Lagos', 'Kano', 'Rivers', 'Oyo', 'FCT'];
const ordered = [...preferred.map(value => features.find(feature => feature.name === value)).filter(Boolean), ...features.filter(feature => !preferred.includes(feature.name))];
const maps = [{ name: 'Nigeria', path: silhouette(country.features[0]) }, ...ordered];
if (maps.some(map => !map.path)) throw new Error('Empty map geometry');
fs.writeFileSync('src/data/nigeriaMaps.ts', '// Generated from geoBoundaries/GRID3 CC BY 4.0 data. See THIRD_PARTY_NOTICES.md.\n// Local decorative silhouettes; never used for geocoding or address verification.\nexport const nigeriaMaps = ' + JSON.stringify(maps) + ' as const;\n');
fs.writeFileSync('public/images/nigeria-boundary-sources.json', JSON.stringify(sources.map(({ licenseDetail: _detail, ...source }) => source), null, 2) + '\n');
console.log(`Generated ${maps.length} map silhouettes (${fs.statSync('src/data/nigeriaMaps.ts').size} bytes).`);
