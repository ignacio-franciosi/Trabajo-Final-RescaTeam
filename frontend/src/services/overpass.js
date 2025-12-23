// Overpass API service to locate barrios (neighbourhoods) in Córdoba Capital (AR)
// Free and public. Consider proxy+cache for production usage.

const DEV_PROXY = typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost'
  ? '/api/overpass'
  : null;
// Prefer proxy in dev, then fast mirrors. Avoid FR mirror in browser due to CORS.
const OVERPASS_ENDPOINTS = [
  ...(DEV_PROXY ? [DEV_PROXY] : []),
  'https://overpass.kumi.systems/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

// Córdoba city (Argentina) wikidata id to select exact admin area
// https://www.wikidata.org/wiki/Q39256
const CBA_CITY_WIKIDATA = 'Q39256';
const CORDOBA_CENTER = { lat: -31.4167, lon: -64.1833 }; // Plaza San Martín aprox
// Basic caches to reduce repeated requests and mitigate 504 exposure
const CACHE = new Map(); // key -> { value, expiry }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LS_TTL_MS = 24 * 60 * 60 * 1000; // 1 day for localStorage
const NOMINATIM_DEV = typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost' ? '/api/nominatim' : 'https://nominatim.openstreetmap.org/search';

function lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return null;
    if (obj.expiry && obj.expiry > Date.now()) return obj.value;
    return null;
  } catch { return null; }
}
function lsSet(key, value, ttlMs) {
  try {
    const obj = { value, expiry: Date.now() + ttlMs };
    localStorage.setItem(key, JSON.stringify(obj));
  } catch { /* ignore quota errors */ }
}

const norm = (s) => (s || '').toString()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .toLowerCase()
  .trim();

function collectNames(tags = {}) {
  const set = new Set();
  const push = (v) => { if (v) String(v).split(';').forEach(p => set.add(norm(p))); };
  push(tags.name);
  push(tags['name:es']);
  push(tags.alt_name);
  push(tags.short_name);
  push(tags.official_name);
  push(tags['official_name:es']);
  push(tags.old_name);
  return Array.from(set);
}

export async function searchBarrioOverpassPoint(rawName, opts = {}) {
  const cleaned = String(rawName || '').trim()
    .replace(/\bzona\b\s*/i, '')
    .replace(/^\s*b[º°]\s*/i, '')
    .replace(/[.,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const target = norm(cleaned).replace(/^barrio\s+/i, '');
  const cacheKey = `barrio:${target}`;
  const cached = CACHE.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }
  const lsKey = `overpass:barrio:${target}`;
  const cachedLs = lsGet(lsKey);
  if (cachedLs) {
    // hydrate in-memory cache for future calls
    CACHE.set(cacheKey, { value: cachedLs, expiry: Date.now() + CACHE_TTL_MS });
    return cachedLs;
  }
  // Fast-path: if target is 'centro', return safe fallback without network
  if (target === 'centro') {
    const result = {
      name: 'Centro (Córdoba Capital)',
      type: 'city_centre',
      lat: CORDOBA_CENTER.lat,
      lon: CORDOBA_CENTER.lon,
      id: 'fallback/cordoba_centro',
    };
    CACHE.set(cacheKey, { value: result, expiry: Date.now() + CACHE_TTL_MS });
    return result;
  }

  // Build queries: try a name-filtered search first to reduce server load/timeouts; then broader fallbacks
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Allow flexible gaps between words, tolerate hyphens/extra spaces
  const reTarget = escRe(target).replace(/\s+/g, '.{0,10}');
  const qAreaFiltered = `
    [out:json][timeout:20];
    area["wikidata"="${CBA_CITY_WIKIDATA}"]->.city;
    (
      relation[place~"^(neighbourhood|suburb|quarter|city_district|city_centre)$"][~"^(name(:es)?|alt_name|short_name)$"~"${reTarget}",i](area.city);
      way[place~"^(neighbourhood|suburb|quarter|city_district|city_centre)$"][~"^(name(:es)?|alt_name|short_name)$"~"${reTarget}",i](area.city);
      node[place~"^(neighbourhood|suburb|quarter|city_district|city_centre)$"][~"^(name(:es)?|alt_name|short_name)$"~"${reTarget}",i](area.city);
      relation[boundary~"^(administrative|neighbourhood)$"][~"^(name(:es)?|alt_name|short_name|official_name)$"~"${reTarget}",i](area.city);
      way[boundary~"^(administrative|neighbourhood)$"][~"^(name(:es)?|alt_name|short_name|official_name)$"~"${reTarget}",i](area.city);
    );
    out tags center qt;
  `;
  const qArea = `
    [out:json][timeout:25];
    area["wikidata"="${CBA_CITY_WIKIDATA}"]->.city;
    (
      relation[place~"^(neighbourhood|suburb|quarter|city_district|city_centre)$"](area.city);
      way[place~"^(neighbourhood|suburb|quarter|city_district|city_centre)$"](area.city);
      node[place~"^(neighbourhood|suburb|quarter|city_district|city_centre)$"](area.city);
      relation[boundary~"^(administrative|neighbourhood)$"](area.city);
      way[boundary~"^(administrative|neighbourhood)$"](area.city);
    );
    out tags center qt;
  `;
  const CBA_BBOX = [-31.55, -64.40, -31.25, -63.95];

  // Fetch with timeout + retries + mirror rotation to avoid 504s
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pickMirrors = (n = 3) => {
    // If dev proxy exists, keep it first deterministically; then take next fastest mirrors
    if (DEV_PROXY) {
      const rest = OVERPASS_ENDPOINTS.slice(1, n);
      return [OVERPASS_ENDPOINTS[0], ...rest];
    }
    // No proxy: keep defined order (fastest first)
    return OVERPASS_ENDPOINTS.slice(0, n);
  };
  const runOverpass = async (query, { attempts = 1, perAttemptTimeoutMs = 2500, backoffMs = 250, maxMirrors = 3, extSignal = undefined } = {}) => {
    let lastErr;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const mirrors = pickMirrors(maxMirrors);
      const controllers = [];
      const promises = mirrors.map((ep) => {
        const controller = new AbortController();
        controllers.push(controller);
        const onAbort = () => controller.abort();
        if (extSignal) extSignal.addEventListener('abort', onAbort, { once: true });
        const timer = setTimeout(() => controller.abort(), perAttemptTimeoutMs);
        return (async () => {
          if (extSignal?.aborted) throw new DOMException('Aborted', 'AbortError');
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
            body: new URLSearchParams({ data: query }),
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (res.status === 429 || res.status === 504 || res.status >= 500) {
            throw new Error(`Overpass rate/5xx: ${res.status}`);
          }
          if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
          const json = await res.json();
          return json?.elements || [];
        })().finally(() => {
          if (extSignal) extSignal.removeEventListener('abort', onAbort);
        });
      });
      try {
        const elements = await Promise.any(promises);
        // cancel remaining
        controllers.forEach((c) => c.abort());
        return elements;
      } catch (e) {
        lastErr = e;
        // Wait a bit before next attempt
        if (attempt < attempts - 1) await sleep(backoffMs * (attempt + 1));
      } finally {
        // ensure timers aborted
        controllers.forEach((c) => c.abort());
      }
    }
    if (lastErr) throw lastErr;
    return [];
  };

  // Try filtered area first
  let elements = await runOverpass(qAreaFiltered, { extSignal: opts.signal }).catch(() => []);
  if (!elements || elements.length === 0) {
    elements = await runOverpass(qArea, { extSignal: opts.signal }).catch(() => []);
  }

  // Score candidates by name similarity + type weight
  const typeWeight = {
    city_centre: 3,
    neighbourhood: 3,
    suburb: 2,
    quarter: 2,
    city_district: 2,
    boundary: 2,
  };
  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  let scored = elements.map((el) => {
    const names = collectNames(el.tags);
    const exact = names.includes(target) || names.includes(`barrio ${target}`);
    const partial = names.some((n) => n.includes(target));
    // Priorizar MUCHO más los matches exactos (10 puntos vs 1 para parciales)
    const base = exact ? 10 : partial ? 1 : 0;
    const effType = el.tags?.place || (el.tags?.boundary ? 'boundary' : undefined);
    const tw = typeWeight[effType] || 0;
    const lat = el.center?.lat ?? el.lat;
    const lon = el.center?.lon ?? el.lon;
    const dist = (typeof lat === 'number' && typeof lon === 'number') ? haversineKm(lat, lon, CORDOBA_CENTER.lat, CORDOBA_CENTER.lon) : 999;
    // Rechazar completamente si está a más de 25 km del centro (fuera de Córdoba Capital)
    if (dist > 25) return { el, score: -999 };
    // Penalizar más fuertemente la distancia: resta 2 puntos por cada 5 km
    const score = base + tw - (dist / 2.5);
    return { el, score };
  }).filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  let picked = (scored[0] || {}).el;
  // If not found within area and the query is 'centro', try a focused city_centre search inside Córdoba area
  if (!picked && target === 'centro') {
    const qAreaCentro = `
      [out:json][timeout:25];
      area["wikidata"="${CBA_CITY_WIKIDATA}"]->.city;
      node[place=city_centre](area.city);
      out tags center qt;
    `;
  const centroEls = await runOverpass(qAreaCentro, { extSignal: opts.signal }).catch(() => []);
    if (centroEls.length) {
      picked = centroEls[0];
    }
  }
  // If still nothing and not 'centro', try bbox fallback but distance-weighted scoring to prefer Córdoba
  if (!picked && target !== 'centro') {
    const [s2, w2, n2, e2] = CBA_BBOX;
    // Try bbox with name filter first
    const elsBboxFiltered = await runOverpass(`
      [out:json][timeout:18];
      (
        relation[place~"^(neighbourhood|suburb|quarter|city_district|city_centre)$"][~"^(name(:es)?|alt_name|short_name)$"~"${reTarget}",i](${s2},${w2},${n2},${e2});
        way[place~"^(neighbourhood|suburb|quarter|city_district|city_centre)$"][~"^(name(:es)?|alt_name|short_name)$"~"${reTarget}",i](${s2},${w2},${n2},${e2});
        node[place~"^(neighbourhood|suburb|quarter|city_district|city_centre)$"][~"^(name(:es)?|alt_name|short_name)$"~"${reTarget}",i](${s2},${w2},${n2},${e2});
        relation[boundary~"^(administrative|neighbourhood)$"][~"^(name(:es)?|alt_name|short_name|official_name)$"~"${reTarget}",i](${s2},${w2},${n2},${e2});
        way[boundary~"^(administrative|neighbourhood)$"][~"^(name(:es)?|alt_name|short_name|official_name)$"~"${reTarget}",i](${s2},${w2},${n2},${e2});
      );
      out tags center qt;
    `, { extSignal: opts.signal }).catch(() => []);
    let elsBbox = elsBboxFiltered;
    if (!elsBbox || elsBbox.length === 0) {
      elsBbox = await runOverpass(`
      [out:json][timeout:25];
      (
        relation[place~"^(neighbourhood|suburb|quarter|city_district|city_centre)$"](${s2},${w2},${n2},${e2});
        way[place~"^(neighbourhood|suburb|quarter|city_district|city_centre)$"](${s2},${w2},${n2},${e2});
        node[place~"^(neighbourhood|suburb|quarter|city_district|city_centre)$"](${s2},${w2},${n2},${e2});
        relation[boundary~"^(administrative|neighbourhood)$"](${s2},${w2},${n2},${e2});
        way[boundary~"^(administrative|neighbourhood)$"](${s2},${w2},${n2},${e2});
      );
      out tags center qt;
    `, { extSignal: opts.signal }).catch(() => []);
    }
    elements = elsBbox;
    scored = elements.map((el) => {
      const names = collectNames(el.tags);
      const exact = names.includes(target) || names.includes(`barrio ${target}`);
      const partial = names.some((n) => n.includes(target));
      // Priorizar MUCHO más los matches exactos (10 puntos vs 1 para parciales)
      const base = exact ? 10 : partial ? 1 : 0;
      const effType2 = el.tags?.place || (el.tags?.boundary ? 'boundary' : undefined);
      const tw = typeWeight[effType2] || 0;
      const lat = el.center?.lat ?? el.lat;
      const lon = el.center?.lon ?? el.lon;
      const dist = (typeof lat === 'number' && typeof lon === 'number') ? haversineKm(lat, lon, CORDOBA_CENTER.lat, CORDOBA_CENTER.lon) : 999;
      // Rechazar completamente si está a más de 25 km del centro (fuera de Córdoba Capital)
      if (dist > 25) return { el, score: -999 };
      // Penalizar más fuertemente la distancia: resta 2 puntos por cada 5 km
      const score = base + tw - (dist / 2.5);
      return { el, score };
    }).filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);
    picked = (scored[0] || {}).el || null;
  }
  // Last resort for 'centro': use a safe hardcoded coordinate in Córdoba downtown
  if (!picked && target === 'centro') {
    return {
      name: 'Centro (Córdoba Capital)',
      type: 'city_centre',
      lat: CORDOBA_CENTER.lat,
      lon: CORDOBA_CENTER.lon,
      id: 'fallback/cordoba_centro',
    };
  }
  // Fallback: Nominatim bounded to Córdoba Capital
  if (!picked) {
    try {
      const params = new URLSearchParams({
        q: `Barrio ${cleaned}, Córdoba Capital, Argentina`,
        format: 'json',
        addressdetails: '0',
        limit: '1',
        dedupe: '1',
        polygon_geojson: '0',
        countrycodes: 'ar',
        viewbox: '-64.40,-31.55,-63.95,-31.25', // w,s,e,n
        bounded: '1',
      });
      const res = await fetch(`${NOMINATIM_DEV}?${params.toString()}`, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length) {
          const item = arr[0];
          const lat = Number(item.lat);
          const lon = Number(item.lon);
          if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
            const result = {
              name: item.display_name?.split(',')[0] || cleaned,
              type: 'nominatim',
              lat,
              lon,
              id: `nominatim/${item.osm_type || 'node'}/${item.osm_id || '0'}`,
            };
            CACHE.set(cacheKey, { value: result, expiry: Date.now() + CACHE_TTL_MS });
            lsSet(lsKey, result, LS_TTL_MS);
            return result;
          }
        }
      }
    } catch {}
    throw new Error('Barrio no encontrado');
  }

  // Extract a representative point
  const lat = picked.center?.lat ?? picked.lat;
  const lon = picked.center?.lon ?? picked.lon;
  if (typeof lat !== 'number' || typeof lon !== 'number') throw new Error('Sin coordenadas del barrio');

  const result = {
    name: picked.tags?.name || cleaned,
    type: picked.tags?.place,
    lat,
    lon,
    id: `${picked.type}/${picked.id}`,
  };
  // store in cache
  CACHE.set(cacheKey, { value: result, expiry: Date.now() + CACHE_TTL_MS });
  lsSet(lsKey, result, LS_TTL_MS);
  return result;
}
