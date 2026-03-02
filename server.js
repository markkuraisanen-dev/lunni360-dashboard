/**
 * Lunni360 KPI Dashboard — Multi-tenant Server
 * Versio 3.0 — Cache-järjestelmä
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const LUNNI_BASE = 'apiv3.lunni.io';
const DB_FILE = path.join(__dirname, 'db.json');
const CACHE_DIR = path.join(__dirname, 'cache');
const RATE_LIMIT_MS = 15 * 60 * 1000; // 15 minuuttia

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// ─── TIETOKANTA ───────────────────────────────────────────────────────────────

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const db = {
      superAdmins: {
        'markku.raisanen@lunni.fi': {
          email: 'markku.raisanen@lunni.fi',
          name: 'Markku Räisänen',
          password: hashPassword('M007Code2026!')
        }
      },
      organizations: {},
      sessions: {}
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return db;
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function hashPassword(p) { return crypto.createHash('sha256').update(p + 'lunni-salt-2026').digest('hex'); }
function generateId() { return crypto.randomBytes(8).toString('hex'); }

function createSession(identity, type) {
  const db = loadDB();
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions[token] = { identity, type, created: Date.now(), expires: Date.now() + 7*24*60*60*1000 };
  saveDB(db);
  return token;
}

function validateSession(token) {
  if (!token) return null;
  const db = loadDB();
  const session = db.sessions[token];
  if (!session || Date.now() > session.expires) {
    if (session) { delete db.sessions[token]; saveDB(db); }
    return null;
  }
  if (session.type === 'superadmin') {
    const admin = db.superAdmins[session.identity];
    return admin ? { ...admin, role: 'superadmin' } : null;
  }
  if (session.type === 'user') {
    const [orgId, email] = session.identity.split('::');
    const org = db.organizations[orgId];
    if (!org) return null;
    const user = org.users[email];
    return user ? { ...user, role: user.role, orgId, org } : null;
  }
  return null;
}

function deleteSession(token) { const db = loadDB(); delete db.sessions[token]; saveDB(db); }
function getSessionToken(req) { const m = (req.headers.cookie||'').match(/session=([a-f0-9]+)/); return m ? m[1] : null; }

function parseBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(new URLSearchParams(body)); } catch { resolve(new URLSearchParams()); } });
  });
}

function sendHTML(res, html, theme) {
  // Inject theme CSS at end so it overrides inline styles
  theme = theme || 'light';
  const themeFile = theme === 'dark' ? 'theme-dark.css' : 'theme-light.css';
  const themeTag = '<link rel="stylesheet" href="/' + themeFile + '">';
  if (html.includes('</body>')) {
    html = html.replace('</body>', themeTag + '</body>');
  } else if (html.includes('</html>')) {
    html = html.replace('</html>', themeTag + '</html>');
  } else {
    html += themeTag;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html);
}

// Serve HTML file with theme injection
function serveHTMLFile(res, filePath, theme) {
  if (!fs.existsSync(filePath)) { res.writeHead(404); return res.end('Ei löydy'); }
  let html = fs.readFileSync(filePath, 'utf-8');
  theme = theme || 'light';
  const themeFile = theme === 'dark' ? 'theme-dark.css' : 'theme-light.css';
  const themeTag = '<link rel="stylesheet" href="/' + themeFile + '">';
  if (html.includes('</body>')) {
    html = html.replace('</body>', themeTag + '</body>');
  } else if (html.includes('</html>')) {
    html = html.replace('</html>', themeTag + '</html>');
  } else {
    html += themeTag;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// Serve HTML file for iframe embed (no session required, allows framing)
function serveHTMLFileForEmbed(res, filePath, theme) {
  if (!fs.existsSync(filePath)) { res.writeHead(404); return res.end('Ei löydy'); }
  let html = fs.readFileSync(filePath, 'utf-8');
  theme = (theme === 'dark') ? 'dark' : 'light';
  const themeFile = theme === 'dark' ? 'theme-dark.css' : 'theme-light.css';
  const themeTag = '<link rel="stylesheet" href="/' + themeFile + '">';
  if (html.includes('</body>')) {
    html = html.replace('</body>', themeTag + '</body>');
  } else if (html.includes('</html>')) {
    html = html.replace('</html>', themeTag + '</html>');
  } else {
    html += themeTag;
  }
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Frame-Options': 'ALLOWALL',
    'Content-Security-Policy': 'frame-ancestors *;'
  });
  res.end(html);
}

function sendJSON(res, data, status) { res.writeHead(status||200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(data)); }
function redirect(res, location, cookie) {
  const headers = { 'Location': location };
  if (cookie) headers['Set-Cookie'] = cookie;
  res.writeHead(302, headers); res.end();
}

// ─── CACHE-JÄRJESTELMÄ ────────────────────────────────────────────────────────

// Kaikki objektit joita cachetetaan — lisää tähän uusia moduuleja tarpeen mukaan
const CACHE_OBJECTS = [
  { name: 'workorders',       fields: 'id,status,classification,begins,ends,is_completed,target_month,target_year,priority,device_id,account_id,name,latitude,longitude,location_id' },
  { name: 'serviceschedules', fields: 'id,device_id,is_active,classification,location_id,name,serviceprogram_id' },
  { name: 'opportunities',    fields: 'id,stage,totalamount,responsibility,closedate,custom_miksihvittiin,created' },
  { name: 'accounts',         fields: 'id,name,created,updated' },
];

function getOrgCacheDir(orgId) {
  const dir = path.join(CACHE_DIR, orgId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getCacheMeta(orgId) {
  const f = path.join(getOrgCacheDir(orgId), 'meta.json');
  if (!fs.existsSync(f)) return { updated: null, refreshing: false, lastRefreshAttempt: 0 };
  try { return JSON.parse(fs.readFileSync(f)); } catch { return { updated: null, refreshing: false, lastRefreshAttempt: 0 }; }
}

function saveCacheMeta(orgId, meta) {
  fs.writeFileSync(path.join(getOrgCacheDir(orgId), 'meta.json'), JSON.stringify(meta, null, 2));
}

function getCacheData(orgId, objectName) {
  const f = path.join(getOrgCacheDir(orgId), objectName + '.json');
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f)); } catch { return null; }
}

function saveCacheData(orgId, objectName, data) {
  fs.writeFileSync(path.join(getOrgCacheDir(orgId), objectName + '.json'), JSON.stringify(data));
}

// Hae kaikki sivut yhdestä Lunni-objektista
async function fetchAllPages(token, objectName, fields) {
  const all = [];
  let page = 0;
  while (true) {
    const qs = new URLSearchParams({ limit: 1000, page, fields }).toString();
    const data = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: LUNNI_BASE,
        path: '/' + objectName + '?' + qs,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
      }, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve([]); } });
      });
      req.on('error', reject);
      req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
      req.end();
    });
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  return all;
}

// Päivitä yhden organisaation kaikki data
async function refreshOrgCache(orgId, token) {
  console.log('[Cache] Päivitetään org ' + orgId + '...');
  const meta = getCacheMeta(orgId);
  meta.refreshing = true;
  saveCacheMeta(orgId, meta);
  try {
    for (const obj of CACHE_OBJECTS) {
      try {
        const data = await fetchAllPages(token, obj.name, obj.fields);
        saveCacheData(orgId, obj.name, data);
        console.log('[Cache]   ' + obj.name + ': ' + data.length + ' riviä');
      } catch (err) {
        console.error('[Cache]   VIRHE ' + obj.name + ': ' + err.message);
      }
    }
    meta.updated = new Date().toISOString();
    meta.refreshing = false;
    saveCacheMeta(orgId, meta);
    console.log('[Cache] Valmis: ' + meta.updated);
    return { success: true, updated: meta.updated };
  } catch (err) {
    meta.refreshing = false;
    saveCacheMeta(orgId, meta);
    return { success: false, error: err.message };
  }
}

// Päivitä kaikki organisaatiot (yöcron)
async function refreshAllOrgs() {
  const db = loadDB();
  console.log('[Cron] Yöpäivitys alkaa: ' + new Date().toISOString());
  for (const [orgId, org] of Object.entries(db.organizations)) {
    if (org.lunnToken) await refreshOrgCache(orgId, org.lunnToken);
  }
  console.log('[Cron] Yöpäivitys valmis: ' + new Date().toISOString());
}

// ─── CRON klo 02:00 ──────────────────────────────────────────────────────────

function scheduleCron() {
  function msUntil2am() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(2, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next - now;
  }
  function scheduleNext() {
    const ms = msUntil2am();
    console.log('[Cron] Seuraava päivitys ' + Math.round(ms/3600000) + 'h päästä (klo 02:00)');
    setTimeout(async () => { await refreshAllOrgs(); scheduleNext(); }, ms);
  }
  scheduleNext();
}

scheduleCron();

// ─── TYYLIT ───────────────────────────────────────────────────────────────────

const BASE_STYLES = `
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root { --bg:#f7f6f3; --surface:#fff; --surface2:#fafaf8; --border:#e8e4dd; --accent:#4f9cf9; --accent-text:#fff; --text:#1a1814; --muted:#8a8478; --green:#34d399; --orange:#fb923c; --red:#ef4444; --pink:#f472b6; --blue:#4f9cf9; --purple:#a78bfa; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; -webkit-font-smoothing: antialiased; }
  body::before { display: none; }
  .container { max-width: 1000px; margin: 0 auto; padding: 40px 24px; position: relative; z-index: 1; }
  nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
  nav h1 { font-family: 'DM Sans', sans-serif; font-size: 1.8rem; font-weight: 700; }
  nav h1 span { color: var(--accent); font-style: italic; }
  .nav-right { display: flex; gap: 12px; align-items: center; }
  .nav-user { font-size: 0.7rem; color: var(--muted); }
  a.nav-link { color: var(--muted); text-decoration: none; font-size: 0.72rem; letter-spacing: 0.08em; padding: 6px 14px; border: 1px solid var(--border); border-radius: 8px; transition: all 0.2s; }
  a.nav-link:hover { color: var(--accent); border-color: var(--accent); }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 28px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .card-title { font-size: 0.65rem; color: var(--muted); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 20px; }
  .card-title span { color: var(--accent); margin-right: 8px; }
  label { display: block; font-size: 0.65rem; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; font-weight: 500; }
  input, select { width: 100%; background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 10px 14px; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; border-radius: 8px; transition: border-color 0.2s, box-shadow 0.2s; }
  input:focus, select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,156,249,0.08); }
  .btn { background: var(--text); color: var(--surface); border: none; padding: 10px 20px; font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; border-radius: 8px; cursor: pointer; transition: opacity 0.15s; }
  .btn:hover { opacity: 0.85; }
  .btn-sm { padding: 6px 14px; font-size: 0.7rem; }
  .btn-danger { background: rgba(239,68,68,0.06); color: var(--red); border: 1px solid rgba(239,68,68,0.15); }
  .btn-danger:hover { background: rgba(239,68,68,0.12); opacity: 1; }
  .btn-ghost { background: var(--surface); color: var(--muted); border: 1px solid var(--border); }
  .btn-ghost:hover { color: var(--text); border-color: var(--text); opacity: 1; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 0.65rem; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 12px; text-align: left; border-bottom: 2px solid var(--border); font-weight: 600; }
  td { padding: 12px; font-size: 0.8rem; border-bottom: 1px solid #f0ece6; vertical-align: middle; color: var(--text); }
  tr:hover td { background: #fafaf8; }
  .badge { padding: 3px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 500; }
  .badge-green { background: rgba(52,211,153,0.08); color: var(--green); }
  .badge-blue { background: rgba(79,156,249,0.08); color: var(--blue); }
  .badge-pink { background: rgba(244,114,182,0.08); color: var(--pink); }
  .badge-orange { background: rgba(251,146,60,0.08); color: var(--orange); }
  .msg-success { background: rgba(52,211,153,0.06); border: 1px solid rgba(52,211,153,0.15); color: #059669; padding: 10px 14px; border-radius: 10px; font-size: 0.75rem; margin-bottom: 20px; }
  .msg-error { background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15); color: var(--red); padding: 10px 14px; border-radius: 10px; font-size: 0.75rem; margin-bottom: 20px; }
  .form-row { display: grid; gap: 12px; }
  .form-row-2 { grid-template-columns: 1fr 1fr; }
  .form-row-3 { grid-template-columns: 1fr 1fr 1fr; }
  .form-row-4 { grid-template-columns: 1fr 1fr 1fr auto; }
  .form-actions { margin-top: 16px; }
  .modules-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
  .module-check { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; padding: 8px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; }
  .module-check input[type=checkbox] { width: auto; margin: 0; }
</style>`;

const ALL_MODULES = ['CRM','EAM','FSM','CMMS','ECM','ESM','WMS','IoT'];

// ─── SIVUT ────────────────────────────────────────────────────────────────────

function loginPage(error) {
  return `<!DOCTYPE html><html lang="fi"><head><meta charset="UTF-8"><title>Lunni360 KPI</title>${BASE_STYLES}
<style>.wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;z-index:1}.box{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:48px;width:420px;position:relative;box-shadow:0 8px 24px rgba(0,0,0,0.08)}.box::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--accent);border-radius:14px 14px 0 0}h1{font-family:'DM Sans',sans-serif;font-size:2.2rem;font-weight:700;margin-bottom:4px}h1 span{color:var(--accent);font-style:italic}.sub{font-size:0.68rem;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:32px}.field{margin-bottom:20px}.btn-full{width:100%;margin-top:8px;padding:12px}</style></head><body>
<div class="wrap"><div class="box"><h1>Lunni <span>KPI</span></h1><div class="sub">Kirjaudu sisään</div>
${error ? '<div class="msg-error">'+error+'</div>' : ''}
<form method="POST" action="/login">
<div class="field"><label>Sähköposti</label><input type="email" name="email" required autofocus /></div>
<div class="field"><label>Salasana</label><input type="password" name="password" required /></div>
<button type="submit" class="btn btn-full">Kirjaudu →</button>
</form></div></div></body></html>`;
}

function superAdminPage(user, db, msg) {
  const orgs = Object.values(db.organizations);
  const rows = orgs.map(org => {
    const meta = getCacheMeta(org.id);
    const cacheInfo = meta.updated
      ? '<span class="badge badge-green">' + new Date(meta.updated).toLocaleDateString('fi-FI') + '</span>'
      : '<span class="badge badge-pink">Ei cachea</span>';
    const mods = (org.modules||[]).map(m => '<span class="badge badge-blue" style="margin-right:2px">'+m+'</span>').join('');
    return '<tr><td><strong>'+org.name+'</strong></td><td>'+(mods||'—')+'</td>'
      +'<td>'+(Object.keys(org.users||{}).length)+'</td>'
      +'<td>'+(org.lunnToken?'<span class="badge badge-green">✓</span>':'<span class="badge badge-pink">Puuttuu</span>')+'</td>'
      +'<td>'+cacheInfo+(meta.refreshing?' <span style="color:#f0a860;font-size:0.65rem">Päivitetään...</span>':'')+'</td>'
      +'<td><a href="/superadmin/org/'+org.id+'" class="btn btn-sm btn-ghost" style="margin-right:4px">Hallitse</a>'
      +'<form method="POST" action="/superadmin/org/'+org.id+'/cache/refresh" style="display:inline">'
      +'<button class="btn btn-sm" style="background:rgba(79,156,249,0.08);color:var(--accent);border:1px solid rgba(79,156,249,0.2)">⟳ Cache</button>'
      +'</form></td></tr>';
  }).join('');
  return `<!DOCTYPE html><html lang="fi"><head><meta charset="UTF-8"><title>Super Admin</title>${BASE_STYLES}</head><body>
<div class="container">
<nav><h1>Lunni <span>Super Admin</span></h1><div class="nav-right"><span class="nav-user">${user.name}</span><a href="/logout" class="nav-link">Ulos</a></div></nav>
${msg ? '<div class="'+(msg.startsWith('Virhe')?'msg-error':'msg-success')+'">'+msg+'</div>' : ''}
<div class="card"><div class="card-title"><span>◆</span>Luo uusi organisaatio</div>
<form method="POST" action="/superadmin/org/create">
<div class="form-row form-row-2"><div><label>Nimi</label><input type="text" name="name" required /></div><div><label>Lunni API Token</label><input type="password" name="lunnToken" /></div></div>
<div style="margin-top:16px"><label>Moduulit</label><div class="modules-grid">${ALL_MODULES.map(m=>'<label class="module-check"><input type="checkbox" name="modules" value="'+m+'" />'+m+'</label>').join('')}</div></div>
<div class="form-actions"><button type="submit" class="btn">+ Luo</button></div>
</form></div>
<div class="card"><div class="card-title"><span>◆</span>Organisaatiot (${orgs.length})</div>
${orgs.length===0?'<p style="color:var(--muted);font-size:0.8rem">Ei organisaatioita.</p>':
'<table><thead><tr><th>Nimi</th><th>Moduulit</th><th>Käyttäjät</th><th>Token</th><th>Cache</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'}
</div></div></body></html>`;
}

function orgPage(user, org, msg) {
  const users = Object.values(org.users||{});
  const meta = getCacheMeta(org.id);
  const rows = users.map(u =>
    '<tr><td>'+u.name+'</td><td>'+u.email+'</td>'
    +'<td><span class="badge '+(u.role==='admin'?'badge-green':u.role==='manager'?'badge-orange':'badge-blue')+'">'+u.role+'</span></td>'
    +'<td style="font-size:0.75rem;color:var(--muted)">'+(u.lunniUserName||'—')+'</td>'
    +'<td style="display:flex;gap:6px">'
    +'<button class="btn btn-sm btn-ghost" onclick="openEdit(\''+u.email+'\',\''+u.name.replace(/'/g,"\\'")+'\',\''+u.role+'\',\''+(u.lunniUserName||'').replace(/'/g,"\\'")+'\')">Muokkaa</button>'
    +'<form method="POST" action="/superadmin/org/'+org.id+'/user/delete" style="display:inline">'
    +'<input type="hidden" name="email" value="'+u.email+'">'
    +'<button class="btn btn-sm btn-danger">Poista</button></form></td></tr>'
  ).join('');

  const cacheRows = CACHE_OBJECTS.map(obj => {
    const data = getCacheData(org.id, obj.name);
    const count = data ? data.length : 0;
    return '<div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">'
      +'<div style="font-size:0.58rem;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px">'+obj.name+'</div>'
      +'<div style="font-family:\'DM Serif Display\',serif;font-size:1.4rem;color:'+(count>0?'var(--accent)':'var(--muted)')+'">'+count+'</div>'
      +'<div style="font-size:0.58rem;color:var(--muted)">riviä</div></div>';
  }).join('');

  const themeCards = [
    {id:'light',name:'Vaalea',bg:'#f7f6f3',accent:'#4f9cf9',surface:'#ffffff',text:'#1a1814',desc:'Moderni & ilmava'},
    {id:'dark',name:'Tumma',bg:'#0d0f14',accent:'#c8f060',surface:'#13161e',text:'#e8eaf2',desc:'Klassinen dashboard'}
  ].map(function(t) {
    var sel = (org.theme||'light') === t.id;
    return '<div id="tc-'+t.id+'" onclick="selTheme(\''+t.id+'\')" data-accent="'+t.accent+'" style="cursor:pointer;border:2px solid '+(sel?t.accent:'var(--border)')+';border-radius:12px;overflow:hidden;transition:border-color 0.2s">'
      +'<input type="radio" name="theme" value="'+t.id+'" '+(sel?'checked':'')+' id="tr-'+t.id+'" style="display:none">'
      +'<div style="background:'+t.bg+';padding:12px 14px"><div style="display:flex;gap:5px;margin-bottom:6px">'
      +'<div style="width:8px;height:8px;border-radius:50%;background:'+t.accent+'"></div>'
      +'<div style="width:8px;height:8px;border-radius:50%;background:'+t.accent+';opacity:0.4"></div></div>'
      +'<div style="background:'+t.surface+';border-radius:6px;padding:8px">'
      +'<div style="width:60%;height:5px;background:'+t.accent+';border-radius:2px;margin-bottom:4px"></div>'
      +'<div style="width:40%;height:3px;background:'+t.text+';opacity:0.15;border-radius:2px"></div></div></div>'
      +'<div style="background:'+t.surface+';padding:8px 14px;border-top:1px solid '+(t.id==='dark'?'#252936':'#e8e4dd')+'">'
      +'<div style="font-size:0.7rem;color:'+t.text+';font-weight:600">'+t.name+'</div>'
      +'<div style="font-size:0.6rem;color:'+t.text+';opacity:0.5">'+t.desc+'</div></div></div>';
  }).join('');

  return `<!DOCTYPE html><html lang="fi"><head><meta charset="UTF-8"><title>${org.name}</title>${BASE_STYLES}</head><body>
<div class="container">
<nav><h1>Lunni <span>${org.name}</span></h1>
<div class="nav-right"><span class="nav-user">${user.name}</span><a href="/superadmin" class="nav-link">← Kaikki</a><a href="/logout" class="nav-link">Ulos</a></div></nav>
${msg ? '<div class="'+(msg.startsWith('Virhe')?'msg-error':'msg-success')+'">'+msg+'</div>' : ''}

<div class="card">
<div class="card-title"><span>◆</span>Data-cache</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px">${cacheRows}</div>
<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
<span style="font-size:0.7rem;color:var(--muted,#8a8478)">${meta.updated ? 'Päivitetty: <strong style="color:var(--text,#1a1814)">'+new Date(meta.updated).toLocaleString('fi-FI')+'</strong>' : 'Ei cachea vielä'}${meta.refreshing?' — <span style="color:var(--orange,#fb923c)">Päivitetään...</span>':''}</span>
<form method="POST" action="/superadmin/org/${org.id}/cache/refresh" style="display:inline">
<button class="btn btn-sm">⟳ Päivitä nyt</button></form>
</div></div>

<div class="card"><div class="card-title"><span>◆</span>Asetukset</div>
<form method="POST" action="/superadmin/org/${org.id}/settings">
<div class="form-row form-row-2" style="margin-bottom:16px">
<div><label>Nimi</label><input type="text" name="name" value="${org.name}" required /></div>
<div><label>Lunni API Token</label><input type="password" name="lunnToken" placeholder="${org.lunnToken?'(asetettu)':'Ei asetettu...'}" /></div>
</div>
<label>Moduulit</label>
<div class="modules-grid">${ALL_MODULES.map(m=>'<label class="module-check"><input type="checkbox" name="modules" value="'+m+'" '+((org.modules||[]).includes(m)?'checked':'')+' />'+m+'</label>').join('')}</div>
<div style="margin-top:20px"><label>Teema</label>
<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:8px">${themeCards}</div>
<script>function selTheme(id){['light','dark'].forEach(function(tid){var c=document.getElementById('tc-'+tid),r=document.getElementById('tr-'+tid);if(c)c.style.borderColor=tid===id?c.getAttribute('data-accent'):'var(--border)';if(r)r.checked=tid===id;})}</script>
</div>
<div style="margin-top:16px;display:flex;gap:10px">
<button type="submit" class="btn">Tallenna</button>
<a href="/preview?org=${org.id}" target="_blank" class="btn btn-ghost btn-sm" style="text-decoration:none">👁 Esikatselu</a>
</div></form></div>

<div class="card"><div class="card-title"><span>◆</span>Lisää käyttäjä</div>
<form method="POST" action="/superadmin/org/${org.id}/user/add">
<div class="form-row form-row-4">
<div><label>Nimi</label><input type="text" name="name" required /></div>
<div><label>Sähköposti</label><input type="email" name="email" required /></div>
<div><label>Salasana</label><input type="text" name="password" required /></div>
<div><label>Rooli</label><select name="role"><option value="user">Käyttäjä</option><option value="manager">Esimies</option><option value="admin">Admin</option></select></div>
</div>
<div class="form-row form-row-2" style="margin-top:10px">
<div><label>Lunni-käyttäjänimi <span style="color:#6b7080;font-weight:400;text-transform:none;letter-spacing:0">(pakollinen esimiehille ja käyttäjille)</span></label><input type="text" name="lunniUserName" placeholder="esim. Matti Virtanen" /></div>
</div>
<div class="form-actions"><button type="submit" class="btn">+ Lisää</button></div>
</form></div>

<div class="card"><div class="card-title"><span>◆</span>Käyttäjät (${users.length})</div>
${users.length===0?'<p style="color:var(--muted);font-size:0.8rem">Ei käyttäjiä.</p>':
'<table><thead><tr><th>Nimi</th><th>Sähköposti</th><th>Rooli</th><th>Lunni-nimi</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'}
</div>

<!-- Muokkaus-modal -->
<div id="editModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center">
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;width:480px;max-width:90vw;box-shadow:0 8px 24px rgba(0,0,0,0.12)">
    <div style="font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:20px">◆ Muokkaa käyttäjää</div>
    <form method="POST" action="/superadmin/org/${org.id}/user/edit">
      <input type="hidden" name="originalEmail" id="editOriginalEmail">
      <div class="form-row form-row-2" style="margin-bottom:12px">
        <div><label>Nimi</label><input type="text" name="name" id="editName" required /></div>
        <div><label>Sähköposti</label><input type="email" name="email" id="editEmail" required /></div>
      </div>
      <div class="form-row form-row-2" style="margin-bottom:12px">
        <div><label>Uusi salasana <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">(jätä tyhjäksi = ei muutu)</span></label><input type="text" name="password" id="editPassword" placeholder="Jätä tyhjäksi..." /></div>
        <div><label>Rooli</label><select name="role" id="editRole"><option value="user">Käyttäjä</option><option value="manager">Esimies</option><option value="admin">Admin</option></select></div>
      </div>
      <div style="margin-bottom:20px"><label>Lunni-käyttäjänimi</label><input type="text" name="lunniUserName" id="editLunniUserName" placeholder="esim. Matti Virtanen" /></div>
      <div style="display:flex;gap:10px">
        <button type="submit" class="btn">Tallenna</button>
        <button type="button" class="btn btn-ghost" onclick="closeEdit()">Peruuta</button>
      </div>
    </form>
  </div>
</div>
<script>
function openEdit(email, name, role, lunniUserName) {
  document.getElementById('editOriginalEmail').value = email;
  document.getElementById('editEmail').value = email;
  document.getElementById('editName').value = name;
  document.getElementById('editRole').value = role;
  document.getElementById('editLunniUserName').value = lunniUserName;
  document.getElementById('editPassword').value = '';
  const m = document.getElementById('editModal');
  m.style.display = 'flex';
}
function closeEdit() {
  document.getElementById('editModal').style.display = 'none';
}
document.getElementById('editModal').addEventListener('click', function(e) {
  if (e.target === this) closeEdit();
});
</script>

</div></body></html>`;
}

// ─── PALVELIN ─────────────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════
// WIDGET & LAYOUT API
// ═══════════════════════════════════════════════════════════════════

function loadWidgets() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'widgets.json'), 'utf8')); } catch { return {}; }
}
function saveWidgets(data) {
  fs.writeFileSync(path.join(__dirname, 'widgets.json'), JSON.stringify(data, null, 2));
}
function loadLayouts() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'layouts.json'), 'utf8')); } catch { return {}; }
}
function saveLayouts(data) {
  fs.writeFileSync(path.join(__dirname, 'layouts.json'), JSON.stringify(data, null, 2));
}

// Seedataan vakiomittarit jos ei ole
function seedDefaultWidgets() {
  const widgets = loadWidgets();
  if (Object.keys(widgets).length > 0) return;
  const defaults = {
    'builtin-fsm-kpi': { id:'builtin-fsm-kpi', name:'FSM KPI-kortit', type:'builtin', module:'fsm', component:'fsm_kpi', visibleTo:['all'], description:'Huoltosopimukset, myöhässä, työkuorma', size:'L' },
    'builtin-crm-kpi': { id:'builtin-crm-kpi', name:'CRM KPI-kortit', type:'builtin', module:'crm', component:'crm_kpi', visibleTo:['all'], description:'Myyntiputki, win rate, lidit', size:'L' },
    'builtin-fsm-map': { id:'builtin-fsm-map', name:'Kenttäkartta', type:'builtin', module:'fsm', component:'map', visibleTo:['all'], description:'Töiden sijainnit kartalla', size:'L' },
  };
  saveWidgets(defaults);
}



const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = req.url.split('?')[0];

  // ── Static: theme CSS ──
  if (url === '/theme-light.css' || url === '/theme-dark.css') {
    const cssPath = path.join(__dirname, url.substring(1));
    if (fs.existsSync(cssPath)) {
      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=300' });
      return fs.createReadStream(cssPath).pipe(res);
    }
    res.writeHead(404); return res.end('');
  }

  const sessionToken = getSessionToken(req);
  const currentUser = validateSession(sessionToken);

  // ── Kirjautuminen ──
  if (url === '/login' && req.method === 'GET') {
    if (currentUser) return redirect(res, '/');
    return sendHTML(res, loginPage());
  }
  if (url === '/login' && req.method === 'POST') {
    const params = await parseBody(req);
    const email = params.get('email'), password = params.get('password');
    const db = loadDB();
    const sa = db.superAdmins[email];
    if (sa && sa.password === hashPassword(password)) {
      const t = createSession(email, 'superadmin');
      return redirect(res, '/superadmin', 'session='+t+'; HttpOnly; Path=/; Max-Age='+(7*24*3600));
    }
    for (const [orgId, org] of Object.entries(db.organizations)) {
      const u = org.users && org.users[email];
      if (u && u.password === hashPassword(password)) {
        const t = createSession(orgId+'::'+email, 'user');
        return redirect(res, '/', 'session='+t+'; HttpOnly; Path=/; Max-Age='+(7*24*3600));
      }
    }
    return sendHTML(res, loginPage('Väärä sähköposti tai salasana.'));
  }
  if (url === '/logout') {
    if (sessionToken) deleteSession(sessionToken);
    return redirect(res, '/login', 'session=; HttpOnly; Path=/; Max-Age=0');
  }

  if (!currentUser) {
    // ── Scorecard Embed (iframe, EI vaadi sessiota) ──
    // Lunni360 kutsuu: /scorecard-embed?token=BEARER_TOKEN&person=Nimi&theme=light
    if (url === '/scorecard-embed') {
      const embedParams = new URLSearchParams(req.url.split('?')[1] || '');
      const theme = embedParams.get('theme') || 'light';
      const p = path.join(__dirname, 'scorecard_embed.html');
      return serveHTMLFileForEmbed(res, p, theme);
    }

    // ── Embed API: Scorecard data (token URL-parametrissa) ──
    if (url === '/api/embed/scorecard' && req.method === 'GET') {
      const embedScParams = new URLSearchParams(req.url.split('?')[1] || '');
      const token = embedScParams.get('token');
      const personParam = embedScParams.get('person');
      const startParam = embedScParams.get('start');
      const endParam = embedScParams.get('end');

      if (!token) return sendJSON(res, { error: 'Token puuttuu' }, 401);

      try {
        async function fetchLunniEmbed(apiPath) {
          return new Promise((resolve, reject) => {
            const req2 = https.request({
              hostname: LUNNI_BASE,
              path: apiPath,
              method: 'GET',
              headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
            }, r2 => {
              let body = '';
              r2.on('data', c => body += c);
              r2.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve([]); } });
            });
            req2.on('error', reject);
            req2.setTimeout(30000, () => { req2.destroy(); reject(new Error('Timeout')); });
            req2.end();
          });
        }

        function statusContains(status, keyword) {
          return (status || '').toLowerCase().includes(keyword);
        }

        // Date range (calculate FIRST for server-side filtering)
        const now2 = new Date();
        let monthStart, monthEnd;
        if (startParam && endParam) {
          const [sy,sm,sd] = startParam.split('-').map(Number);
          const [ey,em,ed] = endParam.split('-').map(Number);
          monthStart = new Date(sy, sm-1, sd, 0, 0, 0, 0);
          monthEnd = new Date(ey, em-1, ed, 23, 59, 59, 999);
        } else {
          monthStart = new Date(now2.getFullYear(), now2.getMonth(), 1);
          monthEnd = new Date(now2.getFullYear(), now2.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        // Resolve person to ID if given
        let personIds = null;
        if (personParam) {
          const usersResult = await fetchLunniEmbed('/users?name=' + encodeURIComponent(personParam) + '&fields=id,name&limit=100');
          const target = Array.isArray(usersResult) ? usersResult.find(u => u.name === personParam) : null;
          if (target) personIds = [target.id];
          else return sendJSON(res, { error: 'Käyttäjää "' + personParam + '" ei löydy.' }, 404);
        }

        // Fetch ALL activities (Lunni API ei tue päivämäärärajausta) and filter server-side
        let allActivities = [];
        if (personIds) {
          for (const pid of personIds) {
            allActivities = await fetchAllPages(token, 'activities', 'id,activity_type,status,begins,updated,person_id,name');
            allActivities = allActivities.filter(a => String(a.person_id) === String(pid));
          }
        } else {
          allActivities = await fetchAllPages(token, 'activities', 'id,activity_type,status,begins,updated,person_id,name');
        }

        function isInRange(dateStr) {
          if (!dateStr) return false;
          const d = new Date(dateStr);
          return d >= monthStart && d <= monthEnd;
        }

        // Count activities — subject (name-kenttä) erottaa puhelut/tehtävät/sähköpostit
        const counts = { task: 0, call: 0, email: 0, event: 0 };
        const daily = {};

        for (const act of allActivities) {
          const actType = (act.activity_type || '').toLowerCase();
          const subject = (act.name || '').toLowerCase();
          const status = (act.status || '').toLowerCase();
          let match = false;
          let category = actType; // oletus

          // Erottele task-tyyppiset subject-kentän perusteella
          if (actType === 'task') {
            if (subject.includes('subject_call')) {
              category = 'call';
            } else if (subject.includes('subject_email')) {
              category = 'email';
            } else {
              category = 'task'; // subject_task tai tuntematon → tehtävä
            }
          }

          if (category === 'task' || category === 'call') {
            match = statusContains(status, 'ready') && (isInRange(act.updated) || isInRange(act.begins));
          } else if (category === 'email') {
            match = statusContains(status, 'sent') && (isInRange(act.updated) || isInRange(act.begins));
          } else if (category === 'event') {
            match = isInRange(act.begins);
          }

          if (match && counts.hasOwnProperty(category)) {
            counts[category]++;
            const dateKey = (act.begins || act.updated || '').substring(0, 10);
            if (dateKey) {
              if (!daily[dateKey]) daily[dateKey] = {};
              daily[dateKey][category] = (daily[dateKey][category] || 0) + 1;
            }
          }
        }

        counts.total = counts.task + counts.call + counts.email + counts.event;

        return sendJSON(res, {
          counts,
          daily,
          total: counts.total,
          start: monthStart.toISOString().split('T')[0],
          end: monthEnd.toISOString().split('T')[0]
        });

      } catch (err) {
        console.error('[Embed Scorecard] Virhe:', err.message);
        return sendJSON(res, { error: 'Haku epäonnistui: ' + err.message }, 500);
      }
    }

    return redirect(res, '/login');
  }

  // ── Apufunktiot org-tiedoille ──
  function getOrgId() {
    if (currentUser.role === 'superadmin') {
      const orgs = Object.values(loadDB().organizations);
      return orgs.length > 0 ? orgs[0].id : null;
    }
    return currentUser.orgId;
  }
  function getOrgToken() {
    if (currentUser.role === 'superadmin') {
      const orgs = Object.values(loadDB().organizations);
      return orgs.length > 0 ? orgs[0].lunnToken : null;
    }
    return currentUser.org ? currentUser.org.lunnToken : null;
  }
  function getOrgTheme() {
    const db2 = loadDB();
    if (currentUser.role === 'superadmin') {
      const orgs = Object.values(db2.organizations);
      return orgs.length > 0 ? (orgs[0].theme || 'light') : 'light';
    }
    const orgId = currentUser.orgId;
    if (orgId && db2.organizations[orgId]) return db2.organizations[orgId].theme || 'light';
    return 'light';
  }

  // ── Super Admin ──
  if (url === '/superadmin' && req.method === 'GET') {
    if (currentUser.role !== 'superadmin') return redirect(res, '/');
    return sendHTML(res, superAdminPage(currentUser, loadDB()));
  }
  if (url === '/superadmin/org/create' && req.method === 'POST') {
    if (currentUser.role !== 'superadmin') return redirect(res, '/');
    const params = await parseBody(req);
    const db = loadDB(), id = generateId();
    db.organizations[id] = { id, name: params.get('name'), lunnToken: params.get('lunnToken')||'', modules: params.getAll('modules'), theme: 'light', users: {}, created: new Date().toISOString() };
    saveDB(db);
    return sendHTML(res, superAdminPage(currentUser, db, 'Organisaatio "'+params.get('name')+'" luotu!'));
  }

  const orgMatch = url.match(/^\/superadmin\/org\/([a-f0-9]+)$/);
  if (orgMatch && req.method === 'GET') {
    if (currentUser.role !== 'superadmin') return redirect(res, '/');
    const db = loadDB(), org = db.organizations[orgMatch[1]];
    if (!org) { res.writeHead(404); return res.end('Ei löydy'); }
    return sendHTML(res, orgPage(currentUser, org));
  }

  const settingsMatch = url.match(/^\/superadmin\/org\/([a-f0-9]+)\/settings$/);
  if (settingsMatch && req.method === 'POST') {
    if (currentUser.role !== 'superadmin') return redirect(res, '/');
    const params = await parseBody(req);
    const db = loadDB(), org = db.organizations[settingsMatch[1]];
    if (!org) { res.writeHead(404); return res.end('Ei löydy'); }
    org.name = params.get('name') || org.name;
    if (params.get('lunnToken')) org.lunnToken = params.get('lunnToken');
    org.modules = params.getAll('modules');
    if (params.get('theme')) org.theme = params.get('theme');
    saveDB(db);
    return sendHTML(res, orgPage(currentUser, org, 'Tallennettu!'));
  }

  // ── Cache refresh super admin ──
  const cacheRefreshAdminMatch = url.match(/^\/superadmin\/org\/([a-f0-9]+)\/cache\/refresh$/);
  if (cacheRefreshAdminMatch && req.method === 'POST') {
    if (currentUser.role !== 'superadmin') return redirect(res, '/');
    const db = loadDB(), org = db.organizations[cacheRefreshAdminMatch[1]];
    if (!org) { res.writeHead(404); return res.end('Ei löydy'); }
    refreshOrgCache(org.id, org.lunnToken).catch(console.error);
    return sendHTML(res, orgPage(currentUser, org, 'Cache-päivitys käynnistetty organisaatiolle "'+org.name+'". Kestää noin minuutin.'));
  }

  const addUserMatch = url.match(/^\/superadmin\/org\/([a-f0-9]+)\/user\/add$/);
  if (addUserMatch && req.method === 'POST') {
    if (currentUser.role !== 'superadmin') return redirect(res, '/');
    const params = await parseBody(req);
    const db = loadDB(), org = db.organizations[addUserMatch[1]];
    if (!org) { res.writeHead(404); return res.end('Ei löydy'); }
    const email = params.get('email');
    if (org.users[email]) return sendHTML(res, orgPage(currentUser, org, 'Virhe: Käyttäjä on jo olemassa.'));
    org.users[email] = { email, name: params.get('name'), password: hashPassword(params.get('password')), role: params.get('role')||'user', lunniUserName: params.get('lunniUserName')||'', created: new Date().toISOString() };
    saveDB(db);
    return sendHTML(res, orgPage(currentUser, org, params.get('name')+' lisätty!'));
  }

  const editUserMatch = url.match(/^\/superadmin\/org\/([a-f0-9]+)\/user\/edit$/);
  if (editUserMatch && req.method === 'POST') {
    if (currentUser.role !== 'superadmin') return redirect(res, '/');
    const params = await parseBody(req);
    const db = loadDB(), org = db.organizations[editUserMatch[1]];
    if (!org) { res.writeHead(404); return res.end('Ei löydy'); }
    const originalEmail = params.get('originalEmail');
    const newEmail = params.get('email');
    const existing = org.users[originalEmail];
    if (!existing) return sendHTML(res, orgPage(currentUser, org, 'Virhe: Käyttäjää ei löydy.'));
    const updated = {
      ...existing,
      name: params.get('name') || existing.name,
      email: newEmail,
      role: params.get('role') || existing.role,
      lunniUserName: params.get('lunniUserName') || existing.lunniUserName || ''
    };
    if (params.get('password')) updated.password = hashPassword(params.get('password'));
    if (originalEmail !== newEmail) delete org.users[originalEmail];
    org.users[newEmail] = updated;
    saveDB(db);
    return sendHTML(res, orgPage(currentUser, org, updated.name + ' päivitetty!'));
  }

  const delUserMatch = url.match(/^\/superadmin\/org\/([a-f0-9]+)\/user\/delete$/);
  if (delUserMatch && req.method === 'POST') {
    if (currentUser.role !== 'superadmin') return redirect(res, '/');
    const params = await parseBody(req);
    const db = loadDB(), org = db.organizations[delUserMatch[1]];
    delete org.users[params.get('email')];
    saveDB(db);
    return sendHTML(res, orgPage(currentUser, org, 'Poistettu.'));
  }

  // ── API: token ──
  if (url === '/api/token') {
    if (currentUser.role === 'superadmin') {
      const orgs = Object.values(loadDB().organizations);
      if (orgs.length > 0) return sendJSON(res, { token: orgs[0].lunnToken||'', modules: orgs[0].modules||[], theme: orgs[0].theme||'light' });
      return sendJSON(res, {}, 403);
    }
    return sendJSON(res, { token: currentUser.org.lunnToken||'', modules: currentUser.org.modules||[], theme: currentUser.org.theme||'light' });
  }

  // ── API: Current user info ──
  if (url === '/api/me') {
    return sendJSON(res, {
      email: currentUser.email,
      name: currentUser.name || currentUser.email,
      role: currentUser.role,
      lunniUserName: currentUser.lunniUserName || null
    });
  }

  // ── API: Cache status ──
  if (url === '/api/cache/status') {
    const orgId = getOrgId();
    if (!orgId) return sendJSON(res, { error: 'Ei org' }, 403);
    const meta = getCacheMeta(orgId);
    const now = Date.now();
    const nextAllowed = (meta.lastRefreshAttempt||0) + RATE_LIMIT_MS;
    return sendJSON(res, {
      updated: meta.updated,
      refreshing: meta.refreshing||false,
      canRefresh: now >= nextAllowed,
      secondsUntilRefresh: Math.max(0, Math.ceil((nextAllowed - now) / 1000))
    });
  }

  // ── API: Cache manuaalinen päivitys ──
  if (url === '/api/cache/refresh' && req.method === 'POST') {
    const orgId = getOrgId();
    const token = getOrgToken();
    if (!orgId || !token) return sendJSON(res, { error: 'Ei organisaatiota tai tokenia' }, 403);
    const meta = getCacheMeta(orgId);
    const now = Date.now();
    const nextAllowed = (meta.lastRefreshAttempt||0) + RATE_LIMIT_MS;
    if (now < nextAllowed) {
      const secs = Math.ceil((nextAllowed - now) / 1000);
      return sendJSON(res, { error: 'rate_limited', secondsRemaining: secs }, 429);
    }
    if (meta.refreshing) return sendJSON(res, { error: 'Päivitys jo käynnissä' }, 409);
    meta.lastRefreshAttempt = now;
    saveCacheMeta(orgId, meta);
    refreshOrgCache(orgId, token).catch(console.error);
    return sendJSON(res, { success: true, message: 'Päivitys käynnistetty' });
  }

  // ── API: Cache data ──
  if (url.startsWith('/api/cache/')) {
    const objectName = url.replace('/api/cache/', '').split('?')[0];
    if (CACHE_OBJECTS.find(o => o.name === objectName)) {
      const orgId = getOrgId();
      if (!orgId) return sendJSON(res, [], 403);
      const data = getCacheData(orgId, objectName);
      return sendJSON(res, data || []);
    }
  }

  // ── API: Scorecard config ──
  const SCORECARD_CONFIG_FILE = path.join(__dirname, 'scorecard_config.json');

  function loadScorecardConfig(orgId) {
    try {
      const all = JSON.parse(fs.readFileSync(SCORECARD_CONFIG_FILE, 'utf8'));
      return all[orgId] || null;
    } catch { return null; }
  }

  function saveScorecardConfig(orgId, config) {
    let all = {};
    try { all = JSON.parse(fs.readFileSync(SCORECARD_CONFIG_FILE, 'utf8')); } catch {}
    all[orgId] = config;
    fs.writeFileSync(SCORECARD_CONFIG_FILE, JSON.stringify(all, null, 2));
  }

  function getDefaultScorecardConfig() {
    return {
      workdays: {
        org_defaults: {},
        user_overrides: {}
      },
      trackables: [
        { key: 'task',  label: 'Puhelut',     model: 'volume',     daily_target: 10, dot: '#4f9cf9' },
        { key: 'call',  label: 'Tehtävät',    model: 'volume',     daily_target: 5,  dot: '#a78bfa' },
        { key: 'email', label: 'Sähköpostit', model: 'volume',     daily_target: 10, dot: '#34d399' },
        { key: 'event', label: 'Tapahtumat',  model: 'binary',     daily_target: 1,  dot: '#fb923c' },
        { key: 'deals', label: 'Kaupat',      model: 'cumulative', monthly_target: 4, dot: '#f472b6' }
      ],
      defaults: {
        task:  { daily_target: 10, model: 'volume' },
        call:  { daily_target: 5,  model: 'volume' },
        email: { daily_target: 10, model: 'volume' },
        event: { daily_target: 1,  model: 'binary' },
        deals: { monthly_target: 4, model: 'cumulative' }
      },
      users: {}
    };
  }

  if (url === '/api/scorecard/config' && req.method === 'GET') {
    const orgId = getOrgId();
    if (!orgId) return sendJSON(res, { error: 'Ei organisaatiota' }, 403);
    const config = loadScorecardConfig(orgId) || getDefaultScorecardConfig();
    return sendJSON(res, config);
  }

  if (url === '/api/scorecard/config' && req.method === 'POST') {
    const orgId = getOrgId();
    if (!orgId) return sendJSON(res, { error: 'Ei organisaatiota' }, 403);
    // Vain manager ja admin voivat muokata
    if (currentUser.role !== 'manager' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      return sendJSON(res, { error: 'Ei oikeuksia' }, 403);
    }
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const config = JSON.parse(body);
        saveScorecardConfig(orgId, config);
        return sendJSON(res, { success: true });
      } catch(e) { return sendJSON(res, { error: e.message }, 400); }
    });
    return;
  }

  // ── API: Scorecard users list (for manager target form) ──
  if (url === '/api/scorecard/users' && req.method === 'GET') {
    const orgId = getOrgId();
    if (!orgId) return sendJSON(res, { error: 'Ei organisaatiota' }, 403);
    const db2 = loadDB();
    const org = db2.organizations[orgId];
    if (!org) return sendJSON(res, { error: 'Organisaatiota ei löydy' }, 404);
    const users = Object.values(org.users || {}).map(u => ({
      email: u.email,
      name: u.name,
      role: u.role,
      lunniUserName: u.lunniUserName || ''
    }));
    return sendJSON(res, { users });
  }

  // ── Scorecard help page ──
  if (url === '/scorecard/help') {
    const p = path.join(__dirname, 'scorecard_help.html');
    if (fs.existsSync(p)) return serveHTMLFile(res, p, getOrgTheme());
    res.writeHead(404); return res.end('Ei löydy');
  }

  // ── Scorecard targets page ──
  if (url === '/scorecard/targets') {
    if (currentUser.role !== 'manager' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      return redirect(res, '/scorecard');
    }
    const p = path.join(__dirname, 'scorecard_targets.html');
    if (fs.existsSync(p)) return serveHTMLFile(res, p, getOrgTheme());
    res.writeHead(404); return res.end('Ei löydy');
  }

  // ── API: Scorecard data ──
  if (url === '/api/scorecard/data' && req.method === 'GET') {
    const orgId = getOrgId();
    const token = getOrgToken();
    if (!orgId || !token) return sendJSON(res, { error: 'Ei organisaatiota tai tokenia' }, 403);

    const lunniUserName = currentUser.lunniUserName;
    const userRole = currentUser.role;

    const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
    const personParam = urlParams.get('person'); // lunniUserName to view specific person
    const monthParam = urlParams.get('month');
    const startParam = urlParams.get('start'); // YYYY-MM-DD
    const endParam = urlParams.get('end');     // YYYY-MM-DD
    const debug = urlParams.get('debug') === '1';

    // If person param given, only manager/admin can use it
    let viewAsLunniName = lunniUserName;
    let viewAsSelf = true;
    if (personParam && (userRole === 'manager' || userRole === 'admin' || userRole === 'superadmin')) {
      viewAsLunniName = personParam;
      viewAsSelf = false;
    }

    if (!viewAsLunniName && userRole !== 'superadmin' && userRole !== 'admin') {
      return sendJSON(res, { error: 'Lunni-käyttäjänimi puuttuu. Pyydä adminia asettamaan se.' }, 400);
    }

    const now2 = new Date();
    let year, month, monthStart, monthEnd, rangeLabel;

    if (startParam && endParam && /^\d{4}-\d{2}-\d{2}$/.test(startParam) && /^\d{4}-\d{2}-\d{2}$/.test(endParam)) {
      // Custom date range
      const [sy,sm,sd] = startParam.split('-').map(Number);
      const [ey,em,ed] = endParam.split('-').map(Number);
      monthStart = new Date(sy, sm-1, sd, 0, 0, 0, 0);
      monthEnd = new Date(ey, em-1, ed, 23, 59, 59, 999);
      year = sy; month = sm;
      rangeLabel = startParam + ' – ' + endParam;
    } else if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      [year, month] = monthParam.split('-').map(Number);
      monthStart = new Date(year, month - 1, 1);
      monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
      rangeLabel = monthParam;
    } else {
      year = now2.getFullYear();
      month = now2.getMonth() + 1;
      monthStart = new Date(year, month - 1, 1);
      monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
      rangeLabel = year + '-' + String(month).padStart(2, '0');
    }

    try {
      async function fetchLunniJSON(apiPath) {
        return new Promise((resolve, reject) => {
          const req2 = https.request({
            hostname: LUNNI_BASE,
            path: apiPath,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
          }, r2 => {
            let body = '';
            r2.on('data', c => body += c);
            r2.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve([]); } });
          });
          req2.on('error', reject);
          req2.setTimeout(30000, () => { req2.destroy(); reject(new Error('Timeout')); });
          req2.end();
        });
      }

      function statusContains(status, keyword) {
        return (status || '').toLowerCase().includes(keyword);
      }

      let personIds = [];
      let teamMembers = [];

      if (personParam && !viewAsSelf) {
        // Viewing specific person — find their Lunni ID
        if (viewAsLunniName) {
          const usersResult = await fetchLunniJSON('/users?name=' + encodeURIComponent(viewAsLunniName) + '&fields=id,name&limit=100');
          const target = Array.isArray(usersResult) ? usersResult.find(u => u.name === viewAsLunniName) : null;
          if (!target) return sendJSON(res, { error: 'Lunni-käyttäjää "' + viewAsLunniName + '" ei löydy.' }, 404);
          personIds = [target.id];
        } else {
          // No lunniUserName for target — return empty
          personIds = [];
        }
      } else if (userRole === 'admin' || userRole === 'superadmin') {
        personIds = null;
      } else {
        const usersResult = await fetchLunniJSON('/users?name=' + encodeURIComponent(lunniUserName) + '&fields=id,name&limit=100');
        const me = Array.isArray(usersResult) ? usersResult.find(u => u.name === lunniUserName) : null;
        if (!me) return sendJSON(res, { error: 'Lunni-käyttäjää "' + lunniUserName + '" ei löydy.' }, 404);

        if (userRole === 'manager') {
          const groups = await fetchLunniJSON('/usergroups?supervisor_id=' + me.id + '&fields=id,name,members&limit=100');
          const memberIds = new Set();
          memberIds.add(me.id);
          teamMembers.push({ id: me.id, name: me.name });
          if (Array.isArray(groups)) {
            for (const group of groups) {
              if (Array.isArray(group.members)) {
                for (const member of group.members) {
                  const mid = typeof member === 'object' ? (member.user_id || member.id) : member;
                  if (mid && !memberIds.has(mid)) {
                    memberIds.add(mid);
                    teamMembers.push({ id: mid, name: member.name || ('Käyttäjä ' + mid) });
                  }
                }
              }
            }
          }
          personIds = Array.from(memberIds);
        } else {
          personIds = [me.id];
        }
      }

      let allActivities = [];
      if (personIds === null) {
        allActivities = await fetchAllPages(token, 'activities', 'id,activity_type,status,begins,updated,person_id,name');
      } else {
        for (const pid of personIds) {
          const acts = await fetchLunniJSON('/activities?person_id=' + pid + '&fields=id,activity_type,status,begins,updated,name&limit=1000');
          if (Array.isArray(acts)) allActivities.push(...acts);
        }
      }

      let debugInfo = undefined;
      if (debug) {
        const types = {}, statuses = {}, sampleByType = {};
        for (const act of allActivities) {
          const t = act.activity_type || '(tyhjä)';
          const s = act.status || '(tyhjä)';
          types[t] = (types[t] || 0) + 1;
          statuses[s] = (statuses[s] || 0) + 1;
          if (!sampleByType[t]) sampleByType[t] = [];
          if (sampleByType[t].length < 3) sampleByType[t].push({ activity_type: act.activity_type, status: act.status, begins: act.begins, updated: act.updated, person_id: act.person_id });
        }
        debugInfo = { monthRange: { start: monthStart.toISOString(), end: monthEnd.toISOString() }, uniqueTypes: types, uniqueStatuses: statuses, samplesByType: sampleByType };
      }

      function isInMonth(dateStr) {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= monthStart && d <= monthEnd;
      }

      const counts = { task: 0, call: 0, email: 0, event: 0 };
      const perPerson = {};

      for (const act of allActivities) {
        const actType = (act.activity_type || '').toLowerCase();
        const subject = (act.name || '').toLowerCase();
        const status = (act.status || '').toLowerCase();
        let match = false;
        let category = actType; // oletus

        // Erottele task-tyyppiset subject-kentän perusteella
        if (actType === 'task') {
          if (subject.includes('subject_call')) {
            category = 'call';
          } else if (subject.includes('subject_email')) {
            category = 'email';
          } else {
            category = 'task'; // subject_task tai tuntematon → tehtävä
          }
        }

        if (category === 'task' || category === 'call') {
          match = statusContains(status, 'ready') && (isInMonth(act.updated) || isInMonth(act.begins));
        } else if (category === 'email') {
          match = statusContains(status, 'sent') && (isInMonth(act.updated) || isInMonth(act.begins));
        } else if (category === 'event') {
          match = isInMonth(act.begins);
        }

        if (match && counts.hasOwnProperty(category)) {
          counts[category]++;
          const pid = act.person_id || 'unknown';
          if (!perPerson[pid]) perPerson[pid] = { task: 0, call: 0, email: 0, event: 0 };
          perPerson[pid][category]++;
        }
      }

      counts.total = counts.task + counts.call + counts.email + counts.event;

      const response = {
        month: year + '-' + String(month).padStart(2, '0'),
        range: rangeLabel,
        start: monthStart.toISOString().split('T')[0],
        end: monthEnd.toISOString().split('T')[0],
        role: userRole,
        viewingPerson: personParam || null,
        counts,
        totalActivitiesFetched: allActivities.length
      };

      if (userRole === 'manager' && teamMembers.length > 0) {
        response.team = teamMembers.map(m => ({
          id: m.id, name: m.name,
          counts: perPerson[m.id] || { task: 0, call: 0, email: 0, event: 0 },
          total: Object.values(perPerson[m.id] || {}).reduce((a, b) => a + b, 0)
        }));
      }
      if ((userRole === 'admin' || userRole === 'superadmin') && Object.keys(perPerson).length > 0) {
        response.perPerson = perPerson;
      }
      if (debug) response.debug = debugInfo;

      return sendJSON(res, response);

    } catch (err) {
      console.error('[Scorecard] Virhe:', err.message);
      return sendJSON(res, { error: 'Scorecard-haku epäonnistui: ' + err.message }, 500);
    }
  }

  // ── API: Suora Lunni proxy (fallback) ──
  if (url.startsWith('/api/')) {
    const lunniPath = url.replace('/api/', '/');
    let authToken = req.headers['authorization'];
    if (!authToken) { const t = getOrgToken(); if (t) authToken = 'Bearer '+t; }
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = authToken;
    const proxyReq = https.request({ hostname: LUNNI_BASE, path: lunniPath, method: req.method, headers }, proxyRes => {
      res.writeHead(proxyRes.statusCode, { 'Content-Type': proxyRes.headers['content-type']||'application/json', 'Access-Control-Allow-Origin': '*' });
      proxyRes.pipe(res);
    });
    proxyReq.on('error', err => { res.writeHead(502); res.end(JSON.stringify({ error: err.message })); });
    req.pipe(proxyReq);
    return;
  }

  // ── Sivut ──
  if (url === '/') {
    if (currentUser.role === 'superadmin') return redirect(res, '/superadmin');
    const p = path.join(__dirname, 'dashboard.html');
    if (fs.existsSync(p)) return serveHTMLFile(res, p, getOrgTheme());
    res.writeHead(404); return res.end('dashboard.html ei löydy');
  }
  if (url === '/scorecard') {
    const p = path.join(__dirname, 'scorecard.html');
    if (fs.existsSync(p)) return serveHTMLFile(res, p, getOrgTheme());
    res.writeHead(404); return res.end('Ei löydy');
  }
  if (url === '/crm') {
    const p = path.join(__dirname, 'crm_dashboard.html');
    if (fs.existsSync(p)) return serveHTMLFile(res, p, getOrgTheme());
    res.writeHead(404); return res.end('Ei löydy');
  }
  if (url === '/map') {
    const p = path.join(__dirname, 'map_dashboard.html');
    if (fs.existsSync(p)) return serveHTMLFile(res, p, getOrgTheme());
    res.writeHead(404); return res.end('Ei löydy');
  }
  if (url === '/fsm') {
    const p = path.join(__dirname, 'fsm_dashboard.html');
    if (fs.existsSync(p)) return serveHTMLFile(res, p, getOrgTheme());
    res.writeHead(404); return res.end('Ei löydy');
  }
  if (url === '/preview') {
    const orgId = req.url.split('?org=')[1];
    const db = loadDB(), org = orgId && db.organizations[orgId];
    const theme = (org && org.theme) || 'light';
    const themes = {
      light: { fonts: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap', bg:'#f7f6f3', accent:'#4f9cf9', text:'#1a1814', fd:"'DM Sans',sans-serif", fm:"'DM Sans',sans-serif" },
      dark:  { fonts: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap', bg:'#0d0f14', accent:'#c8f060', text:'#e8eaf2', fd:"'DM Serif Display',serif", fm:"'DM Mono',monospace" }
    };
    const t = themes[theme]||themes.light;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="'+t.fonts+'" rel="stylesheet"><style>body{background:'+t.bg+';color:'+t.text+';font-family:'+t.fm+';display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}h1{font-family:'+t.fd+';font-size:3rem}span{color:'+t.accent+';font-style:italic}</style></head><body><h1>Lunni <span>'+(org?org.name:'360')+'</span></h1></body></html>');
  }

  // ── Karttaruutu proxy — 4 tyyliä ──
  const tileMatch = url.match(/^\/tiles\/(dark|night|satellite|light)\/(\d+)\/(\d+)\/(\d+)\.png$/);
  if (tileMatch) {
    const [, style, z, x, y] = tileMatch;
    const tileUrls = {
      dark:      `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`,
      night:     `https://a.basemaps.cartocdn.com/dark_nolabels/${z}/${x}/${y}.png`,
      satellite: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
      light:     `https://a.basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`,
    };
    const tileUrl = tileUrls[style] || tileUrls.dark;
    const tileReq = https.request(tileUrl, { headers: { 'User-Agent': 'Lunni360/1.0' } }, tileRes => {
      res.writeHead(tileRes.statusCode, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      });
      tileRes.pipe(res);
    });
    tileReq.on('error', () => { res.writeHead(502); res.end(); });
    tileReq.end();
    return;
  }


  // ── Widget Dashboard ──
  if (url === '/widgets' || url === '/dashboard2') {
    const p = path.join(__dirname, 'widget_dashboard.html');
    if (fs.existsSync(p)) return serveHTMLFile(res, p, getOrgTheme());
    res.writeHead(404); return res.end('Ei löydy');
  }

  // ── Widget Wizard ──
  if (url === '/wizard') {
    const p = path.join(__dirname, 'widget_wizard.html');
    if (fs.existsSync(p)) return serveHTMLFile(res, p, getOrgTheme());
    res.writeHead(404); return res.end('Ei löydy');
  }

  // ── GET /api/widgets ──
  if (url === '/api/widgets' && req.method === 'GET') {
    seedDefaultWidgets();
    const widgets = loadWidgets();
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify({ widgets }));
  }

  // ── POST /api/widgets ──
  if (url === '/api/widgets' && req.method === 'POST') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const widget = JSON.parse(body);
        const widgets = loadWidgets();
        const id = 'custom-' + Date.now();
        widget.id = id;
        widget.createdBy = currentUser.id;
        widgets[id] = widget;
        saveWidgets(widgets);
        // Lisää layout hidden-listaan kaikille orgeille joille näytetään
        const layouts = loadLayouts();
        const db2 = loadDB();
        Object.keys(db2.organizations).forEach(orgId => {
          const visTo = widget.visibleTo || ['all'];
          if (visTo.includes('all') || visTo.includes(orgId)) {
            if (!layouts[orgId]) layouts[orgId] = {};
            const mod = widget.module || 'crm';
            if (!layouts[orgId][mod]) layouts[orgId][mod] = { visible:[], hidden:[] };
            if (!layouts[orgId][mod].hidden.includes(id)) layouts[orgId][mod].hidden.push(id);
          }
        });
        saveLayouts(layouts);
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ success:true, id }));
      } catch(e) { res.writeHead(400); res.end(JSON.stringify({ error:e.message })); }
    });
    return;
  }

  // ── GET /api/layout/:module ──
  if (url.startsWith('/api/layout/') && req.method === 'GET') {
    const mod = url.replace('/api/layout/', '').split('?')[0];
    const orgId = getOrgId();
    if (!orgId) return sendJSON(res, { visible:[], hidden:[] });
    const layouts = loadLayouts();
    const layout = (layouts[orgId] && layouts[orgId][mod]) || { visible:[], hidden:[] };
    // Jos ei layoutia, init vakiomittareista
    if (!layout.visible.length && !layout.hidden.length) {
      seedDefaultWidgets();
      const widgets = loadWidgets();
      const defaultVisible = Object.values(widgets).filter(w => (w.visibleTo||['all']).includes('all') && (w.module === mod || !w.module));
      layout.visible = defaultVisible.map(w => ({ widgetId:w.id, size: w.size || 'M' }));
    }
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify(layout));
  }

  // ── POST /api/layout/:module ──
  if (url.startsWith('/api/layout/') && req.method === 'POST') {
    const mod = url.replace('/api/layout/', '').split('?')[0];
    const orgId = getOrgId();
    if (!orgId) return sendJSON(res, { error: 'Ei organisaatiota' }, 403);
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const newLayout = JSON.parse(body);
        const layouts = loadLayouts();
        if (!layouts[orgId]) layouts[orgId] = {};
        layouts[orgId][mod] = newLayout;
        saveLayouts(layouts);
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ success:true }));
      } catch(e) { res.writeHead(400); res.end(JSON.stringify({ error:e.message })); }
    });
    return;
  }

  // ── GET /api/organizations ──
  if (url === '/api/organizations' && req.method === 'GET') {
    const db2 = loadDB();
    const orgs = Object.values(db2.organizations).map(o => ({ id:o.id, name:o.name }));
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify({ organizations: orgs }));
  }

  // ── POST /api/ai/generate-widget ──
  if (url === '/api/ai/generate-widget' && req.method === 'POST') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', async () => {
      try {
        const { system, messages } = JSON.parse(body);
        const apiKey = process.env.ANTHROPIC_API_KEY || '';
        if (!apiKey) {
          res.writeHead(500);
          return res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY ympäristömuuttuja puuttuu. Aseta se ennen käynnistystä: export ANTHROPIC_API_KEY=sk-ant-...' }));
        }
        const aiRes = await new Promise((resolve, reject) => {
          const payload = JSON.stringify({
            model: 'claude-sonnet-4-5-20250514',
            max_tokens: 4000,
            system,
            messages
          });
          const options = {
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01'
            }
          };
          const req2 = https.request(options, r2 => {
            let data = '';
            r2.on('data', c => data += c);
            r2.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) reject(new Error(parsed.error.message || 'API-virhe'));
                else resolve(parsed);
              } catch(e) { reject(new Error('Vastauksen parsinta epäonnistui: ' + data.substring(0, 200))); }
            });
          });
          req2.on('error', reject);
          req2.setTimeout(60000, () => { req2.destroy(); reject(new Error('AI-pyyntö aikakatkaistiin (60s)')); });
          req2.write(payload);
          req2.end();
        });

        const text = aiRes.content?.[0]?.text || '[]';
        const clean = text.replace(/```json\s?|```/g, '').trim();
        let variants;
        try { variants = JSON.parse(clean); }
        catch {
          // Jos JSON-parsinta epäonnistuu, yritetään löytää JSON taulukko tekstistä
          const jsonMatch = clean.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try { variants = JSON.parse(jsonMatch[0]); } catch {}
          }
          if (!variants) {
            variants = [{ label:'Generoitu widget', html: '<div style="padding:20px;text-align:center;color:var(--accent,#4f9cf9)">Widget generoitu — mutta AI:n vastaus ei ollut kelvollinen JSON. Yritä uudelleen.</div>' }];
          }
        }

        // Varmista että variants on taulukko
        if (!Array.isArray(variants)) variants = [variants];

        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ variants }));
      } catch(e) {
        console.error('[AI Generate] Virhe:', e.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }


  res.writeHead(404); res.end('Ei löydy');
});

server.listen(PORT, () => {
  console.log('\n✓ Lunni360 KPI v3.0 → http://localhost:' + PORT);
  console.log('  Cache: ' + CACHE_DIR);
  console.log('  Cron:  klo 02:00 joka yö\n');
});
