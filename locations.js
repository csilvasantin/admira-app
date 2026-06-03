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
//   }
// ] }
window.OMNIP_API = 'https://omnipublicity-api.csilvasantin.workers.dev';
window.OMNIP_STORE_KEY = 'omnip-locations';

window.OMNIP_LOCATIONS_DEFAULT = [
  {
    id:'xtanco-bcn', name:'Xtanco Barcelona', kind:'Estanco · Retail físico · Gemelo digital',
    addr:'Portal de l\'Àngel 20 · Barcelona 08002', coords:[2.1730, 41.3863],
    twin:'https://macmini.tail48b61c.ts.net/yarig/game.html?loc=barcelona',
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

// Sync: localStorage → bundled default. Sin red. Para arranque inmediato.
window.loadOmnipLocations = function() {
  try {
    const raw = localStorage.getItem(window.OMNIP_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) {}
  return window.OMNIP_LOCATIONS_DEFAULT;
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
      try { localStorage.setItem(window.OMNIP_STORE_KEY, JSON.stringify(d.locations)); } catch {}
      return { locations: d.locations, source: d.source || 'kv', updatedAt: d.updatedAt || null };
    }
  } catch (e) { /* offline / worker dormido / timeout */ }
  return { locations: window.loadOmnipLocations(), source: 'local', updatedAt: null };
};

// Guarda en localStorage (cache local del backoffice). NO publica.
window.saveOmnipLocations = function(arr) {
  try {
    localStorage.setItem(window.OMNIP_STORE_KEY, JSON.stringify(arr));
    return true;
  } catch (e) { return false; }
};

// Publica al worker (PUT /locations con Bearer token). Lanza si falla.
window.publishOmnipLocations = async function(arr, token) {
  if (!Array.isArray(arr) || !arr.length) throw new Error('empty_array');
  if (!token) throw new Error('missing_token');
  const r = await fetch(window.OMNIP_API + '/locations', {
    method: 'PUT',
    headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ locations: arr }),
  });
  let d = null; try { d = await r.json(); } catch {}
  if (!r.ok) throw new Error((d && d.error) || ('http ' + r.status));
  return d;
};
