import { useState } from "react";

const PHASES = [
  {
    id: 1, title: "Cache-laajennus & API-pohja", sprint: "Sprint 1",
    color: "#0ea5e9", icon: "\u{1F5C4}\uFE0F", status: "next",
    tasks: [
      { id: "1.1", name: "Laajenna CACHE_OBJECTS: opportunities + amount, margin, BU, owner, account_id" },
      { id: "1.2", name: "Laajenna CACHE_OBJECTS: accounts + owner_id, classification, potential" },
      { id: "1.3", name: "Lis\u00e4\u00e4 users CACHE_OBJECTS:iin (id, name, email, role)" },
      { id: "1.4", name: "Tutki API: liiketoiminta-alueet \u2014 miten haetaan?" },
      { id: "1.5", name: "Tutki API: activities cache vs. live haku (performance)" },
      { id: "1.6", name: "Luo sales_config.json + lataus/tallennus server.js:n" },
      { id: "1.7", name: "Luo snapshot-mekanismi (cron klo 02:00)" },
    ],
  },
  {
    id: 2, title: "\u20AC Tavoitemittaristo \u2014 server + API", sprint: "Sprint 2",
    color: "#8b5cf6", icon: "\u{1F4CA}", status: "planned",
    tasks: [
      { id: "2.1", name: "GET /api/sales/summary \u2014 KPI:t periodilla" },
      { id: "2.2", name: "GET /api/sales/monthly \u2014 kuukausittainen myynti vs. tavoite" },
      { id: "2.3", name: "GET /api/sales/by-bu \u2014 myynti liiketoiminta-alueittain" },
      { id: "2.4", name: "GET /api/sales/by-person \u2014 myyjitt\u00e4in (roolipohjainen)" },
      { id: "2.5", name: "GET /api/sales/by-account \u2014 asiakkaittain + vuosivertailu" },
      { id: "2.6", name: "GET /api/sales/pipeline \u2014 tarjouskanta vaiheittain" },
      { id: "2.7", name: "Roolipohjainen datasuodatus: admin/johtaja/BU/myyj\u00e4" },
    ],
  },
  {
    id: 3, title: "\u20AC Mittaristo \u2014 UI (sales_dashboard.html)", sprint: "Sprint 3",
    color: "#f59e0b", icon: "\u{1F4C8}", status: "planned",
    tasks: [
      { id: "3.1", name: "Perussivupohja: nav, period-bar, teemamuuttujat (CRM-pattern)" },
      { id: "3.2", name: "KPI-kortit: myynti, kate, hit rate, pipeline, kaupat kpl" },
      { id: "3.3", name: "Gauge-mittari: tavoite vs toteuma (Canvas/SVG)" },
      { id: "3.4", name: "Kuukausihistogrammi: Chart.js bar" },
      { id: "3.5", name: "Donitsikaavio: BU-jakauma (Chart.js doughnut)" },
      { id: "3.6", name: "Top-lista: myyjt + asiakkaat (sortattava taulukko)" },
      { id: "3.7", name: "Periodivalitsin: viikko/kk/Q/vuosi" },
      { id: "3.8", name: "12kk trendikayrä: Chart.js line" },
    ],
  },
  {
    id: 4, title: "Hallintapaneeli (targets_admin.html)", sprint: "Sprint 4",
    color: "#10b981", icon: "\u2699\uFE0F", status: "planned",
    tasks: [
      { id: "4.1", name: "GET/POST /api/sales/config \u2014 backend" },
      { id: "4.2", name: "Asiakastavoitteet: kk + vuosi per asiakas" },
      { id: "4.3", name: "BU-jako per asiakas" },
      { id: "4.4", name: "BU Manager -m\u00e4\u00e4ritys (sales_config.json)" },
      { id: "4.5", name: "Myyj\u00e4tavoitteet: kiinte\u00e4 tai laskennallinen" },
      { id: "4.6", name: "Asiakaspotentiaali \u20AC asetus" },
      { id: "4.7", name: "Myyj\u00e4valitsin (scorecard_targets pattern)" },
    ],
  },
  {
    id: 5, title: "Asiakasnäkymät (customer_dashboard.html)", sprint: "Sprint 5-6",
    color: "#ef4444", icon: "\u{1F465}", status: "planned",
    tasks: [
      { id: "5.1", name: "API: /api/customers/activity" },
      { id: "5.2", name: "Aktiivisuuskatsaus ikonit per asiakas" },
      { id: "5.3", name: "Hiljaiset asiakkaat -lista" },
      { id: "5.4", name: "Poistumariski: 3/6/9/12 kk luokat" },
      { id: "5.5", name: "Asiakaskortti: vuosivertailu + muutos%" },
      { id: "5.6", name: "Asiakastaulukko: sortaus, filtterit" },
      { id: "5.7", name: "Asiakaskohtainen \u20AC seuranta" },
    ],
  },
  {
    id: 6, title: "Iframe-embed + integraatio", sprint: "Sprint 7",
    color: "#6366f1", icon: "\u{1F517}", status: "planned",
    tasks: [
      { id: "6.1", name: "sales_embed.html (kuten scorecard_embed)" },
      { id: "6.2", name: "customer_embed.html" },
      { id: "6.3", name: "Reitit: /sales-embed, /widget-sales-embed" },
      { id: "6.4", name: "GET /api/embed/sales (token-auth)" },
      { id: "6.5", name: "GET /api/embed/customers (token-auth)" },
      { id: "6.6", name: "X-Frame-Options + CSP headers" },
    ],
  },
  {
    id: 7, title: "Snapshot + AI + jatkokehitys", sprint: "Tuleva",
    color: "#94a3b8", icon: "\u{1F916}", status: "future",
    tasks: [
      { id: "7.1", name: "Automaattinen p\u00e4ivitt\u00e4inen snapshot" },
      { id: "7.2", name: "Snapshot-vertailunakyma" },
      { id: "7.3", name: "Tuoterivitason seuranta" },
      { id: "7.4", name: "AI: tavoite-ennuste" },
      { id: "7.5", name: "AI: asiakassuosittelu" },
    ],
  },
];

const NEW_FILES = [
  { file: "sales_dashboard.html", desc: "\u20AC tavoitemittaristo", type: "page" },
  { file: "sales_embed.html", desc: "\u20AC mittarit iframe", type: "embed" },
  { file: "customer_dashboard.html", desc: "Asiakasseuranta", type: "page" },
  { file: "customer_embed.html", desc: "Asiakas iframe", type: "embed" },
  { file: "targets_admin.html", desc: "Tavoitteiden hallinta", type: "admin" },
  { file: "server.js (+400 rivi\u00e4)", desc: "Uudet reitit + API:t", type: "backend" },
  { file: "sales_config.json", desc: "Tavoitteet, BU, potentiaalit", type: "config" },
  { file: "snapshots/", desc: "P\u00e4ivitt\u00e4iset tilannekuvat", type: "data" },
];

const API_ENDPOINTS = [
  { m: "GET", p: "/api/sales/summary", d: "KPI yhteenveto periodilla" },
  { m: "GET", p: "/api/sales/monthly", d: "Kuukausimyynti vs tavoite" },
  { m: "GET", p: "/api/sales/by-bu", d: "Myynti BU:ittain" },
  { m: "GET", p: "/api/sales/by-person", d: "Myynti myyjitt\u00e4in" },
  { m: "GET", p: "/api/sales/by-account", d: "Myynti asiakkaittain" },
  { m: "GET", p: "/api/sales/pipeline", d: "Tarjouskanta" },
  { m: "GET", p: "/api/customers/activity", d: "Aktiivisuus per asiakas" },
  { m: "GET", p: "/api/customers/silent", d: "Hiljaiset asiakkaat" },
  { m: "GET", p: "/api/customers/churn-risk", d: "Poistumariski" },
  { m: "GET", p: "/api/embed/sales", d: "\u20AC data (token)" },
  { m: "GET", p: "/api/embed/customers", d: "Asiakasdata (token)" },
  { m: "G/P", p: "/api/sales/config", d: "Tavoitteet hallinta" },
  { m: "POST", p: "/api/sales/snapshot", d: "Tilannekuva tallennus" },
];

const ROLES = [
  { name: "Admin", access: "Kaikki data + hallinta", icon: "\u{1F511}", color: "#ef4444", filter: "Ei suodatusta" },
  { name: "Johtaja", access: "Kaikki data, ei hallintaa", icon: "\u{1F451}", color: "#f59e0b", filter: "Ei suodatusta" },
  { name: "BU Manager", access: "Oman BU:n data", icon: "\u{1F4CA}", color: "#8b5cf6", filter: "opp.business_unit IN omat" },
  { name: "Myyj\u00e4", access: "Omat asiakkaat", icon: "\u{1F4BC}", color: "#10b981", filter: "opp.responsibility = oma" },
];

export default function App() {
  const [tab, setTab] = useState("roadmap");
  const [exp, setExp] = useState(1);

  const tabs = [
    { id: "roadmap", l: "Roadmap" },
    { id: "arch", l: "Arkkitehtuuri" },
    { id: "api", l: "API" },
    { id: "files", l: "Tiedostot" },
    { id: "roles", l: "Roolit" },
  ];

  const total = PHASES.reduce((a, p) => a + p.tasks.length, 0);

  const s = {
    card: { background: "#fff", borderRadius: 10, border: "1px solid #e8e4dd", padding: 16, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
    label: { fontSize: 10, fontWeight: 600, color: "#8a8478", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 },
    mono: { fontFamily: "'DM Mono', monospace" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f3", color: "#1a1814", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #e8e4dd; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid #e8e4dd", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Lunni <span style={{ color: "#4f9cf9", fontStyle: "italic" }}>KPI</span></h1>
          <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, background: "rgba(79,156,249,0.08)", color: "#4f9cf9", fontWeight: 600 }}>
            SALES ROADMAP v2
          </span>
        </div>
        <p style={{ fontSize: 10, color: "#8a8478", letterSpacing: "0.06em" }}>
          Vanilla HTML/CSS/JS + server.js | commit a280329 | {total} tehtavaa
        </p>
        <div style={{ display: "flex", gap: 2, marginTop: 12, background: "#f7f6f3", borderRadius: 5, padding: 2 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "6px 8px", border: "none", borderRadius: 4,
              background: tab === t.id ? "#fff" : "transparent",
              color: tab === t.id ? "#1a1814" : "#8a8478",
              fontSize: 11, fontWeight: tab === t.id ? 600 : 400,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: tab === t.id ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px 18px 40px", maxWidth: 880, margin: "0 auto" }}>

        {/* ROADMAP */}
        {tab === "roadmap" && (
          <div>
            <div style={{ ...s.card, fontSize: 11, color: "#8a8478", lineHeight: 1.6 }}>
              <strong style={{ color: "#1a1814" }}>Periaate:</strong> Laajennetaan olemassa oleva vanilla-arkkitehtuuri. Uudet HTML-tiedostot noudattavat samaa rakennetta kuin crm_dashboard.html. Teema-CSS injektoidaan server.js:n kautta. Chart.js visualisoinneissa. Ei React:ia, ei build-vaihetta.
            </div>

            {PHASES.map((ph, i) => {
              const isE = exp === ph.id;
              return (
                <div key={ph.id} style={{ marginBottom: 4 }}>
                  <div onClick={() => setExp(isE ? null : ph.id)} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                    background: isE ? "#fff" : "#fafaf8",
                    borderRadius: isE ? "7px 7px 0 0" : 7,
                    border: `1px solid ${isE ? ph.color + "40" : "#e8e4dd"}`,
                    borderBottom: isE ? "none" : undefined,
                    cursor: "pointer",
                  }}>
                    <span style={{ fontSize: 16 }}>{ph.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 12 }}>V{ph.id}: {ph.title}</span>
                        {ph.status === "next" && (
                          <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 3, background: ph.color + "15", color: ph.color, fontWeight: 700 }}>ALOITETAAN</span>
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: "#8a8478" }}>{ph.sprint} | {ph.tasks.length} tehtavaa</span>
                    </div>
                    <span style={{ fontSize: 10, color: "#8a8478", transform: isE ? "rotate(180deg)" : "rotate(0)", transition: "0.15s" }}>{"\u25BC"}</span>
                  </div>
                  {isE && (
                    <div style={{ padding: "4px 12px 10px", background: "#fff", borderRadius: "0 0 7px 7px", border: `1px solid ${ph.color}40`, borderTop: "none" }}>
                      {ph.tasks.map((t, ti) => (
                        <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 2px", borderBottom: ti < ph.tasks.length - 1 ? "1px solid #f0ece6" : "none" }}>
                          <span style={{ ...s.mono, fontSize: 10, color: ph.color, width: 24, flexShrink: 0, opacity: 0.7 }}>{t.id}</span>
                          <span style={{ fontSize: 11, lineHeight: 1.5 }}>{t.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ARCHITECTURE */}
        {tab === "arch" && (
          <div>
            <div style={s.card}>
              <div style={s.label}><span style={{ color: "#4f9cf9" }}>{"\u25C6"} </span>Nykyinen pino (ei muutu)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[
                  ["Server", "Node.js http/https \u2014 server.js ~1587 rivi\u00e4"],
                  ["Frontend", "Vanilla HTML/CSS/JS \u2014 ei frameworkia"],
                  ["DB", "db.json (flat file) + config JSONit"],
                  ["Cache", "Tiedostopohjainen cache/ per org"],
                  ["Charts", "Chart.js 4.4.1"],
                  ["Fonts", "DM Sans (light) / DM Mono+Serif (dark)"],
                  ["Teemat", "theme-light.css / theme-dark.css injektio"],
                  ["Embed", "iframe + token URL:ss\u00e4"],
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: "5px 8px", background: "#fafaf8", borderRadius: 5, border: "1px solid #f0ece6" }}>
                    <div style={{ fontSize: 9, color: "#8a8478", fontWeight: 600, letterSpacing: "0.08em" }}>{k}</div>
                    <div style={{ fontSize: 10, color: "#1a1814" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.card}>
              <div style={s.label}><span style={{ color: "#ef4444" }}>{"\u25C6"} </span>Cache-laajennus (CACHE_OBJECTS)</div>
              <div style={{ fontSize: 10, color: "#8a8478", marginBottom: 6 }}>Nykyinen: workorders, serviceschedules, opportunities (suppea), accounts (suppea)</div>
              {[
                { n: "opportunities", f: "+ amount, margin, business_unit, owner_id, account_id, probability", c: "#ef4444" },
                { n: "accounts", f: "+ owner_id, classification, potential, industry", c: "#f59e0b" },
                { n: "contacts (UUSI)", f: "id, name, account_id, email, phone", c: "#8b5cf6" },
                { n: "users (UUSI)", f: "id, name, email, role, team", c: "#0ea5e9" },
              ].map((x, i) => (
                <div key={i} style={{ padding: "6px 8px", marginBottom: 3, background: x.c + "08", borderRadius: 5, borderLeft: `3px solid ${x.c}` }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{x.n}</span>
                  <span style={{ ...s.mono, fontSize: 10, color: "#8a8478", marginLeft: 8 }}>{x.f}</span>
                </div>
              ))}
            </div>

            <div style={s.card}>
              <div style={s.label}><span style={{ color: "#4f9cf9" }}>{"\u25C6"} </span>Embed-arkkitehtuuri (sama kuin scorecard)</div>
              <div style={{ ...s.mono, fontSize: 10, color: "#8a8478", background: "#fafaf8", padding: 10, borderRadius: 5, lineHeight: 1.9, border: "1px solid #f0ece6" }}>
                <div style={{ color: "#bbb" }}>// Lunni360:</div>
                <div>{"<iframe src=\"/sales-embed?token=XXX&period=month\" />"}</div>
                <div style={{ color: "#bbb", marginTop: 4 }}>// server.js reitit:</div>
                <div>/sales-embed {"\u2192"} serveHTMLFileForEmbed(sales_embed.html)</div>
                <div>/widget-sales-embed {"\u2192"} sama (Lunni360 /widget- prefix)</div>
                <div>/api/embed/sales?token=XXX {"\u2192"} JSON (ei sessiota)</div>
              </div>
            </div>
          </div>
        )}

        {/* API */}
        {tab === "api" && (
          <div style={s.card}>
            <div style={s.label}><span style={{ color: "#4f9cf9" }}>{"\u25C6"} </span>Uudet API-endpointit (server.js)</div>
            {API_ENDPOINTS.map((ep, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: i < API_ENDPOINTS.length - 1 ? "1px solid #f0ece6" : "none" }}>
                <span style={{ ...s.mono, fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 2, background: ep.m.includes("P") ? "rgba(251,146,60,0.1)" : "rgba(79,156,249,0.08)", color: ep.m.includes("P") ? "#fb923c" : "#4f9cf9", flexShrink: 0 }}>{ep.m}</span>
                <span style={{ ...s.mono, fontSize: 10, fontWeight: 500, minWidth: 190, flexShrink: 0 }}>{ep.p}</span>
                <span style={{ fontSize: 10, color: "#8a8478" }}>{ep.d}</span>
              </div>
            ))}
          </div>
        )}

        {/* FILES */}
        {tab === "files" && (
          <div style={s.card}>
            <div style={s.label}><span style={{ color: "#4f9cf9" }}>{"\u25C6"} </span>Uudet tiedostot</div>
            {NEW_FILES.map((f, i) => {
              const tc = { page: "#4f9cf9", embed: "#a78bfa", admin: "#fb923c", backend: "#ef4444", config: "#34d399", data: "#8a8478" };
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", borderBottom: i < NEW_FILES.length - 1 ? "1px solid #f0ece6" : "none" }}>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 2, background: (tc[f.type] || "#8a8478") + "12", color: tc[f.type] || "#8a8478", flexShrink: 0, letterSpacing: "0.04em" }}>{f.type.toUpperCase()}</span>
                  <span style={{ ...s.mono, fontSize: 11, fontWeight: 600 }}>{f.file}</span>
                  <span style={{ fontSize: 10, color: "#8a8478" }}>{f.desc}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ROLES */}
        {tab === "roles" && (
          <div>
            {ROLES.map((r, i) => (
              <div key={r.name} style={{ ...s.card, borderLeft: `3px solid ${r.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{r.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.name}</span>
                </div>
                <div style={{ fontSize: 11, marginBottom: 4 }}>{r.access}</div>
                <div style={{ ...s.mono, fontSize: 10, color: "#8a8478", padding: "3px 6px", background: "#fafaf8", borderRadius: 3, display: "inline-block" }}>{r.filter}</div>
              </div>
            ))}
            <div style={s.card}>
              <div style={s.label}><span style={{ color: "#8b5cf6" }}>{"\u25C6"} </span>Myyjan tavoitelaskenta</div>
              <div style={{ ...s.mono, fontSize: 10, color: "#8a8478", background: "#fafaf8", padding: 10, borderRadius: 5, lineHeight: 2 }}>
                <div>{"// A: Laskennallinen"}</div>
                <div><span style={{ color: "#4f9cf9" }}>tavoite</span> = vastuuasiakkaiden_budjetit + BU_budjetit</div>
                <div>{"// B: Kiintea"}</div>
                <div><span style={{ color: "#4f9cf9" }}>tavoite</span> = <span style={{ color: "#fb923c" }}>kiintea_luku</span> (sama/kk tai eri/kk)</div>
                <div>{"// Tallennus: sales_config.json per org"}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
