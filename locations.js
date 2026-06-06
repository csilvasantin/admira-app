// OmniPublicity — catálogo por defecto de tiendas (gemelos digitales).
// Orden de carga: worker omnipublicity-api (KV) → localStorage → bundled default.
//
// Schema: { id, name, kind, addr, coords:[lng,lat], surfaces:[
//   { name, desc, status:'live'|'sched'|'idle', impr:Number, cpm:String,
//     surface:'pantalla'|'escaparate'|'mostrador'|'vending'|'pwa',
//     pixerScreens?:[<string>]   // opcional. IDs de screens en pixer-eleven
//                                // que pintan en esta surface (ej: 'xtore-lg8qao').
//                                // Si está, los items que llegan a esos screens
//                                // se inyectan como bids LIVE en el feed.
//   } ],
//   twin?:<string>      // opcional. URL del gemelo de esta tienda; si no, cae a TWIN_BASE+&loc=<id>.
//   // ── Config del Digital Twin (la lee game.html vía ?loc= → window.STORE_CFG) ──
//   employees?:[{ name, role }]  // roster real. role: 'cajero'|'repositor'|'azafata'|
//                                // 'manager'|'dj' (o índice 0-4). El twin usa este roster.
//   music?:<string>     // hilo musical del punto (id de pista; fase 2).
//   cameras?:Boolean     // cámaras/LiveCam on-off del punto (fase 2).
//   segmentation?:{
//     required:Boolean,
//     schedule:{ start:'HH:mm', end:'HH:mm' },
//     typologies:['exterior'|'interior'],
//     genders:['hombre'|'mujer'],
//     ages:['nino'|'joven'|'adulto'|'senior'|'vejez'],
//     timeSlots:['manana'|'mediodia'|'tarde'|'noche'],
//     metadata?:[{ key, label, value, type }] // criterios dados de alta por el exclusivista.
//   }
// }
window.OMNIP_API = 'https://omnipublicity-api.csilvasantin.workers.dev';
window.OMNIP_STORE_KEY = 'omnip-locations';

window.OMNIP_SEGMENTATION_OPTIONS = {
  schedule: { start:'08:00', end:'20:00' },
  typologies: ['exterior','interior'],
  genders: ['hombre','mujer'],
  ages: ['nino','joven','adulto','senior','vejez'],
  timeSlots: ['manana','mediodia','tarde','noche'],
  defaultTimeSlots: ['manana','mediodia','tarde'],
};

function _omnipArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === '') return [];
  return [value];
}

function _omnipCleanSelection(value, allowed, fallback) {
  const allow = new Set(allowed);
  const vals = _omnipArray(value).flatMap(v => {
    if (v === 'ambos' || v === 'both') return allowed;
    return [String(v || '').trim()];
  }).filter(v => allow.has(v));
  const uniq = [...new Set(vals)];
  return uniq.length ? uniq : fallback.slice();
}

function _omnipInferTypologies(loc) {
  const surfaces = Array.isArray(loc && loc.surfaces) ? loc.surfaces : [];
  let exterior = false, interior = false;
  surfaces.forEach(s => {
    const type = String(s && s.surface || '').toLowerCase();
    const text = `${s && s.name || ''} ${s && s.desc || ''}`.toLowerCase();
    if (type === 'escaparate' || text.includes('exterior') || text.includes('fachada') || text.includes('puerta')) exterior = true;
    if (['pantalla','mostrador','vending','pwa'].includes(type) || text.includes('interior') || text.includes('sala')) interior = true;
  });
  if (exterior && interior) return ['exterior','interior'];
  if (exterior) return ['exterior'];
  if (interior) return ['interior'];
  return window.OMNIP_SEGMENTATION_OPTIONS.typologies.slice();
}

function _omnipCleanMetadata(raw) {
  const source = Array.isArray(raw)
    ? raw
    : (raw && typeof raw === 'object' ? Object.entries(raw).map(([key, value]) => ({key, value})) : []);
  return source.map(item => {
    if (!item || typeof item !== 'object') return null;
    const key = String(item.key || item.id || item.label || '').trim();
    const label = String(item.label || item.name || key).trim();
    const value = item.value == null ? '' : String(item.value).trim();
    const type = String(item.type || 'text').trim() || 'text';
    if (!key && !label && !value) return null;
    return { key: key || label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), label: label || key, value, type };
  }).filter(Boolean);
}

window.normalizeOmnipSegmentation = function(loc) {
  const base = loc && typeof loc === 'object' ? loc : {};
  const seg = base.segmentation && typeof base.segmentation === 'object' ? base.segmentation : {};
  const options = window.OMNIP_SEGMENTATION_OPTIONS;
  const schedule = seg.schedule && typeof seg.schedule === 'object' ? seg.schedule : {};
  const normalized = Object.assign({}, base, {
    segmentation: {
      required: true,
      schedule: {
        start: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(schedule.start || '')) ? schedule.start : options.schedule.start,
        end: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(schedule.end || '')) ? schedule.end : options.schedule.end,
      },
      typologies: _omnipCleanSelection(seg.typologies || seg.typology || seg.placements, options.typologies, _omnipInferTypologies(base)),
      genders: _omnipCleanSelection(seg.genders || seg.gender, options.genders, options.genders),
      ages: _omnipCleanSelection(seg.ages || seg.age, options.ages, options.ages),
      timeSlots: _omnipCleanSelection(seg.timeSlots || seg.timeSlot || seg.slots, options.timeSlots, options.defaultTimeSlots),
      metadata: _omnipCleanMetadata(seg.metadata || base.metadata),
    },
  });
  return normalized;
};

window.normalizeOmnipLocations = function(arr) {
  return (Array.isArray(arr) ? arr : []).map(window.normalizeOmnipSegmentation);
};

function desigualSurfaces(type) {
  const outlet = type === 'outlet';
  return [
    { name: outlet ? 'Escaparate outlet' : 'Escaparate flagship', desc: 'Surface exterior para creatividades de moda, rebajas y lanzamientos por zona', status:'live', impr: outlet ? 520 : 720, cpm: outlet ? '€6' : '€9', surface:'escaparate' },
    { name: 'Pantalla interior', desc: 'Digital signage en sala de venta · colecciones, looks y campañas contextuales', status:'live', impr: outlet ? 360 : 460, cpm: outlet ? '€5' : '€7', surface:'pantalla' },
    { name: 'Caja y probadores', desc: 'Impacto de cierre de compra, cross-sell y registro en club', status:'live', impr: outlet ? 140 : 180, cpm: outlet ? '€4' : '€5', surface:'mostrador' },
    { name: 'PWA Desigual Club', desc: 'Push de proximidad para socios, wishlist y promociones por tienda', status:'live', impr: outlet ? 180 : 260, cpm:'€3', surface:'pwa' },
  ];
}

window.OMNIP_LOCATIONS_DEFAULT = [
  {
    id:'xtanco-bcn', name:'Xtanco Barcelona', kind:'Estanco · Retail físico · Gemelo digital',
    addr:'Portal de l\'Àngel 20 · Barcelona 08002', coords:[2.1730, 41.3863],
    employees:[
      { name:'Marta', role:'cajero',    since:'2024-09-02T09:00:00.000Z' },
      { name:'Jordi', role:'repositor', since:'2025-03-15T10:30:00.000Z' },
      { name:'Núria', role:'azafata',   since:'2025-11-20T11:00:00.000Z' },
      { name:'Pau',   role:'manager',   since:'2026-01-10T08:30:00.000Z' },
    ],
    music:'lounge', cameras:true,
    surfaces:[
      { name:'LED Frontal',       desc:'Pantalla principal sobre el mostrador · 1920×1080',  status:'live', impr:680, cpm:'€8', surface:'pantalla' },
      { name:'LED Vertical',      desc:'Display lateral del producto destacado · 1080×1920',  status:'live', impr:410, cpm:'€7', surface:'pantalla' },
      { name:'Escaparate Gràcia', desc:'Visible desde Passeig de Gràcia · alto tráfico',      status:'live', impr:520, cpm:'€9', surface:'escaparate' },
      { name:'Mostrador panel',   desc:'Panel táctil del mostrador · interacción cliente',    status:'live', impr:120, cpm:'€4', surface:'mostrador' },
      { name:'PWA Xtanco Club',   desc:'Notificaciones push a socios cercanos',               status:'live', impr:160, cpm:'€2', surface:'pwa' },
    ],
  },
  {
    id:'xtanco', name:'Xtanco', kind:'Estanco · Retail físico',
    addr:'Calle de Santa Rosa 4 · Madrid', coords:[-3.7283, 40.4036],
    surfaces:[
      { name:'LED Frontal',          desc:'Pantalla principal sobre el mostrador · 1920×1080 · 24h', status:'live',  impr:540, cpm:'€8',  surface:'pantalla', pixerScreens:['xtore-lg8qao','xtore-07313n'] },
      { name:'LED Vertical',         desc:'Display lateral del producto destacado · 1080×1920',      status:'live',  impr:380, cpm:'€6',  surface:'pantalla' },
      { name:'Escaparate exterior',  desc:'LED en la fachada visible desde la calle · noche',        status:'sched', impr:210, cpm:'€5',  surface:'escaparate' },
      { name:'Mostrador panel',      desc:'Panel táctil del mostrador · interacción cliente',        status:'live',  impr:90,  cpm:'€4',  surface:'mostrador' },
      { name:'Vending / cigarreras', desc:'Display digital del vending · loop comercial',            status:'idle',  impr:60,  cpm:'€3',  surface:'vending' },
      { name:'PWA Xtanco Club',      desc:'Notificaciones push y cards en la app del Club',          status:'live',  impr:140, cpm:'€2',  surface:'pwa' },
    ],
  },
  {
    id:'admira-loterias', name:'Admira Loterías', kind:'Loterías · Punto autorizado',
    addr:'Gran Vía 32 · Madrid', coords:[-3.7037, 40.4204],
    surfaces:[
      { name:'LED jackpot',     desc:'Bote del Euromillones en pantalla principal · 1920×1080',   status:'live',  impr:820, cpm:'€9', surface:'pantalla' },
      { name:'Escaparate digital', desc:'Animación del último ganador · visible 24h',              status:'live',  impr:340, cpm:'€6', surface:'escaparate' },
      { name:'Boletos kiosk',   desc:'Kiosko táctil de venta · vertical 1080×1920',                status:'sched', impr:120, cpm:'€4', surface:'mostrador' },
      { name:'PWA Admira Win',  desc:'Notificación push tras décimo comprado',                    status:'live',  impr:200, cpm:'€3', surface:'pwa' },
    ],
  },
  {
    id:'admira-vapeo', name:'Admira Vapeo', kind:'Vapeo · Retail especializado',
    addr:'Calle Fuencarral 88 · Madrid', coords:[-3.6997, 40.4279],
    surfaces:[
      { name:'LED catálogo',           desc:'Carrusel de sabores en pantalla principal',          status:'live',  impr:420, cpm:'€6', surface:'pantalla' },
      { name:'Escaparate animado',     desc:'Loop nocturno con humo + colores',                   status:'sched', impr:160, cpm:'€4', surface:'escaparate' },
      { name:'Vending de e-líquidos',  desc:'8 tubos · cada uno con su panel digital',            status:'live',  impr:75,  cpm:'€3', surface:'vending' },
    ],
  },
  {
    id:'admira-prensa', name:'Admira Prensa', kind:'Quiosco · Retail físico',
    addr:'Plaza de Cibeles · Madrid', coords:[-3.6927, 40.4196],
    surfaces:[
      { name:'LED titulares',     desc:'Resumen prensa diaria · cabeceras rotando · 1920×1080', status:'live',  impr:1200, cpm:'€7', surface:'pantalla' },
      { name:'Mostrador revista', desc:'Panel táctil con portadas + compra rápida',             status:'live',  impr:180,  cpm:'€4', surface:'mostrador' },
      { name:'Escaparate noche',  desc:'LED de la portada del día siguiente desde 22h',         status:'sched', impr:280,  cpm:'€5', surface:'escaparate' },
      { name:'PWA Admira Press',  desc:'Edición digital del día con anuncios contextuales',     status:'live',  impr:90,   cpm:'€3', surface:'pwa' },
    ],
  },
  {
    id:'admira-bcn', name:'Admira BCN', kind:'Estanco · Retail físico',
    addr:'Passeig de Gràcia 45 · Barcelona', coords:[2.1654, 41.3925],
    surfaces:[
      { name:'LED Frontal',       desc:'Pantalla principal · catalán/castellano/inglés',  status:'live',  impr:680, cpm:'€8', surface:'pantalla' },
      { name:'LED Vertical',      desc:'Display lateral · turistas + locales',            status:'live',  impr:410, cpm:'€7', surface:'pantalla' },
      { name:'Escaparate Gràcia', desc:'Visible desde Passeig de Gràcia · alto tráfico',  status:'live',  impr:520, cpm:'€9', surface:'escaparate' },
      { name:'Vending tabaco',    desc:'Panel digital del vending exterior',              status:'idle',  impr:50,  cpm:'€3', surface:'vending' },
      { name:'PWA Admira Club',   desc:'Push contextual a socios cercanos',               status:'live',  impr:160, cpm:'€2', surface:'pwa' },
    ],
  },
  {
    id:'super-santa-rosa', name:'Súper Santa Rosa', kind:'Supermercado · Retail físico',
    addr:'Carrer de Santa Rosa 4 · Barcelona 08012', coords:[2.1583, 41.4061],
    surfaces:[
      { name:'LED cabeceras góndola',         desc:'4 cabeceras digitales en pasillos · 1080×1920 vertical',           status:'live',  impr:920, cpm:'€7', surface:'pantalla' },
      { name:'LED checkout',                  desc:'Pantallas sobre las 6 cajas · cola + impulso de última hora',      status:'live',  impr:780, cpm:'€8', surface:'pantalla' },
      { name:'Estantería ePaper lácteos',     desc:'8 etiquetas digitales con precio dinámico + microspot 3s',         status:'sched', impr:240, cpm:'€4', surface:'mostrador' },
      { name:'Escaparate refrigerado',        desc:'LED transparente sobre puerta de frescos · audiencia atrapada',    status:'live',  impr:360, cpm:'€6', surface:'escaparate' },
      { name:'Carro con tablet',              desc:'30 carros con tablet 10" · contextual por pasillo',                status:'idle',  impr:120, cpm:'€3', surface:'mostrador' },
      { name:'Vending de bebidas',            desc:'Panel digital del vending exterior · cervezas y refrescos',         status:'sched', impr:80,  cpm:'€3', surface:'vending' },
      { name:'PWA Súper Club',                desc:'Push contextual a socios cercanos · ofertas por hora del día',      status:'live',  impr:260, cpm:'€2', surface:'pwa' },
    ],
  },
];

// Seed oficial del nuevo circuito Desigual. La cifra corporativa actual es
// +215 stores y presencia en 107 paises; este bloque solo siembra puntos
// reales del store locator hasta que el importador publique el catálogo
// completo al KV.
window.OMNIP_LOCATIONS_EXTRA = [
  {
    id:'desigual-r509', name:'Desigual Barcelona Plaza Catalunya', kind:'Desigual · Tienda oficial',
    addr:'Plaça Catalunya, 9 · Barcelona · 08002 · Barcelona · Spain', coords:[2.168902, 41.3877],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R509', type:'official', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('official'),
  },
  {
    id:'desigual-r016', name:'Desigual Born', kind:'Desigual · Tienda oficial',
    addr:'Calle Argenteria, 65 · Barcelona · 08003 · Barcelona · Spain', coords:[2.181271, 41.383613],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R016', type:'official', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('official'),
  },
  {
    id:'desigual-r380', name:'Desigual Barceloneta Beach', kind:'Desigual · Tienda oficial',
    addr:'Passeig Mare Nostrum, 15 · Barcelona · 08039 · Barcelona · Spain', coords:[2.189, 41.369],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R380', type:'official', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('official'),
  },
  {
    id:'desigual-r033', name:'Desigual CC Maremagnum II', kind:'Desigual · Tienda oficial',
    addr:'CC Maremagnum, Loc 104 · Barcelona · 08039 · Barcelona · Spain', coords:[2.182866, 41.375195],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R033', type:'official', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('official'),
  },
  {
    id:'desigual-r135', name:'Desigual CC Las Arenas', kind:'Desigual · Tienda oficial',
    addr:'CC Las Arenas, Plaza de España S/N, Loc P14 · Barcelona · 08014 · Barcelona · Spain', coords:[2.149315, 41.376057],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R135', type:'official', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('official'),
  },
  {
    id:'desigual-r747', name:'Desigual CC La Maquinista', kind:'Desigual · Tienda oficial',
    addr:'CC La Maquinista, Paseo de Potosi 2, Loc B-037 · Barcelona · 08030 · Barcelona · Spain', coords:[2.198741, 41.441097],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R747', type:'official', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('official'),
  },
  {
    id:'desigual-r133', name:'Desigual Aeropuerto El Prat T1', kind:'Desigual · Tienda oficial',
    addr:'Aeropuerto El Prat, Terminal 1, Loc 67-68 · El Aeroport del Prat · 08820 · Barcelona · Spain', coords:[2.074927, 41.289802],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R133', type:'official', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('official'),
  },
  {
    id:'desigual-r420', name:'Desigual CC Tarragona Parc Central', kind:'Desigual · Tienda oficial',
    addr:'CC Tarragona Parc Central, Avenida Vidal i Barraquer, 15-17 · Tarragona · 43005 · Tarragona · Spain', coords:[1.239, 41.117],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R420', type:'official', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('official'),
  },
  {
    id:'desigual-r064', name:'Desigual Preciados', kind:'Desigual · Outlet',
    addr:'Calle Preciados, 25 · Madrid · 28013 · Madrid · Spain', coords:[-3.70574, 40.419481],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R064', type:'outlet', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('outlet'),
  },
  {
    id:'desigual-r019', name:'Desigual Fuencarral', kind:'Desigual · Tienda oficial',
    addr:'Calle Fuencarral, 36-38 · Madrid · 28004 · Madrid · Spain', coords:[-3.700674, 40.422684],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R019', type:'official', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('official'),
  },
  {
    id:'desigual-r751', name:'Desigual Aeropuerto Madrid-Barajas T4', kind:'Desigual · Tienda oficial',
    addr:'Aeropuerto Adolfo Suarez Madrid-Barajas T4, Loc T4001DE41 · Madrid · 28042 · Madrid · Spain', coords:[-3.5909464194832768, 40.4911822780647],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R751', type:'official', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('official'),
  },
  {
    id:'desigual-r018', name:'Desigual Outlet Factory Getafe', kind:'Desigual · Outlet',
    addr:'CC Factory Getafe, Av. Río Guadalquivir 15, Loc 13 Bis · Getafe · 28906 · Madrid · Spain', coords:[-3.694165, 40.272652],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R018', type:'outlet', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('outlet'),
  },
  {
    id:'desigual-r132', name:'Desigual Outlet CC Factory SSRR', kind:'Desigual · Outlet',
    addr:'CC Factory San Sebastian de los Reyes, Salvador de Madariaga SN · San Sebastián de los Reyes · 28700 · Madrid · Spain', coords:[-3.608584, 40.567128],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R132', type:'outlet', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('outlet'),
  },
  {
    id:'desigual-r136', name:'Desigual Outlet Factory Las Rozas', kind:'Desigual · Outlet',
    addr:'CC Factory Las Rozas, Calle Pablo Neruda SN · Las Rozas de Madrid · 28232 · Madrid · Spain', coords:[-3.889741, 40.517467],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R136', type:'outlet', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('outlet'),
  },
  {
    id:'desigual-r732', name:'Desigual Madrid Oasiz', kind:'Desigual · Outlet',
    addr:'CC Madrid Oasiz, Avenida Premios Nobel, 3 · Torrejón de Ardoz · 28850 · Madrid · Spain', coords:[-3.44378471, 40.47230189],
    music:'fashion', cameras:true, external:{brand:'Desigual', storeId:'R732', type:'outlet', source:'desigual-store-locator'},
    surfaces:desigualSurfaces('outlet'),
  },
];

window.mergeOmnipLocations = function(base, extra) {
  const out = window.normalizeOmnipLocations(base);
  const seen = new Set(out.map(l => l && l.id).filter(Boolean));
  const addon = window.normalizeOmnipLocations(Array.isArray(extra) ? extra : window.OMNIP_LOCATIONS_EXTRA);
  (addon || []).forEach(loc => {
    if (!loc || !loc.id || seen.has(loc.id)) return;
    out.push(loc);
    seen.add(loc.id);
  });
  return out;
};

// Sync: localStorage → bundled default. Sin red. Para arranque inmediato.
window.loadOmnipLocations = function() {
  try {
    const raw = localStorage.getItem(window.OMNIP_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return window.mergeOmnipLocations(parsed);
    }
  } catch (e) {}
  return window.mergeOmnipLocations(window.OMNIP_LOCATIONS_DEFAULT);
};

// Async: worker KV → cachea en localStorage → fallback a sync. Devuelve
// también un flag `source` para que la UI pueda mostrar de dónde viene.
window.loadOmnipLocationsAsync = async function(timeoutMs = 4000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(window.OMNIP_API + '/locations', {signal: ctrl.signal, cache: 'no-store'});
    clearTimeout(t);
    if (!r.ok) throw new Error('http ' + r.status);
    const d = await r.json();
    if (d && Array.isArray(d.locations) && d.locations.length) {
      const merged = window.mergeOmnipLocations(d.locations);
      try { localStorage.setItem(window.OMNIP_STORE_KEY, JSON.stringify(merged)); } catch {}
      return { locations: merged, source: d.source || 'kv', updatedAt: d.updatedAt || null };
    }
  } catch (e) { /* offline / worker dormido / timeout */ }
  return { locations: window.loadOmnipLocations(), source: 'local', updatedAt: null };
};

// Guarda en localStorage (cache local del backoffice). NO publica.
window.saveOmnipLocations = function(arr) {
  try {
    localStorage.setItem(window.OMNIP_STORE_KEY, JSON.stringify(window.normalizeOmnipLocations(arr)));
    return true;
  } catch (e) { return false; }
};

// Publica al worker (PUT /locations con Bearer token). Lanza si falla.
window.publishOmnipLocations = async function(arr, token) {
  const normalized = window.normalizeOmnipLocations(arr);
  if (!Array.isArray(normalized) || !normalized.length) throw new Error('empty_array');
  if (!token) throw new Error('missing_token');
  const r = await fetch(window.OMNIP_API + '/locations', {
    method: 'PUT',
    headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ locations: normalized }),
  });
  let d = null; try { d = await r.json(); } catch {}
  if (!r.ok) throw new Error((d && d.error) || ('http ' + r.status));
  return d;
};
