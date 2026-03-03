import { useState } from "react";

// ═══════════════════════════════════════
// LUNNI360 — LAYOUT MOCKUPS
// Scorecard-tyylinen visuaalinen suunnitelma
// ═══════════════════════════════════════

// Scorecard gauge SVG — täsmälleen sama tyyli
function Gauge({ value, max, label, color, sublabel, size = 120 }) {
  const pct = Math.min(value / max, 1);
  const r = size * 0.4;
  const cx = size / 2, cy = size * 0.52;
  const startAngle = Math.PI;
  const endAngle = Math.PI + Math.PI * pct;
  const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
  const large = pct > 0.5 ? 1 : 0;
  const bgX2 = cx + r * Math.cos(2 * Math.PI), bgY2 = cy + r * Math.sin(2 * Math.PI);

  const badgeColor = pct >= 0.7 ? "#27ae60" : pct >= 0.31 ? "#f39c12" : "#e74c3c";
  const pctText = Math.round(pct * 100) + "%";

  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
        {label}
      </div>
      <svg width={size} height={size * 0.56} style={{ overflow: "visible" }}>
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${bgX2} ${bgY2}`} fill="none" stroke="var(--gauge-bg)" strokeWidth={8} strokeLinecap="round" />
        {pct > 0 && <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />}
      </svg>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginTop: 6, lineHeight: 1 }}>
        {typeof value === "number" && value >= 1000 ? Math.round(value / 1000) + "k" : value}
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}> / {max >= 1000 ? Math.round(max / 1000) + "k" : max}</span>
      </div>
      {sublabel && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sublabel}</div>}
      <div style={{ marginTop: 6, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", padding: "3px 10px", borderRadius: 20, border: `1px solid ${badgeColor}`, color: badgeColor }}>{pctText}</div>
    </div>
  );
}

// Scorecard orb — täsmälleen sama tyyli
function Orb({ type, tip, size = 22 }) {
  const colors = { empty: "var(--orb-empty)", red: "#e74c3c", orange: "#f39c12", green: "#27ae60", future: "var(--orb-empty)" };
  const fills = { empty: "none", red: "rgba(231,76,60,0.08)", orange: "rgba(243,156,18,0.08)", green: "rgba(39,174,96,0.08)", future: "none" };

  if (type === "star") {
    return (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", cursor: "default", fontSize: size * 0.7, lineHeight: 1 }} title={tip}>
        ⭐
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", cursor: "default", opacity: type === "future" ? 0.25 : 1 }} title={tip}>
      <svg width={size} height={size} viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" fill={fills[type] || "none"} stroke={colors[type] || colors.empty} strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// Activity icon badge
function ActivityIcon({ type, active = true }) {
  const icons = {
    call: { emoji: "\u{1F4DE}", label: "Puhelu", bg: "#4f9cf9" },
    meeting: { emoji: "\u{1F91D}", label: "Tapaaminen", bg: "#f59e0b" },
    offer: { emoji: "\u{1F4C4}", label: "Tarjous", bg: "#a78bfa" },
    deal: { emoji: "\u{1F48E}", label: "Kauppa", bg: "#10b981" },
    new: { emoji: "\u{1F4A1}", label: "Uusi asiakas", bg: "#f472b6" },
    marketing: { emoji: "\u2B50", label: "Markkinointi", bg: "#fb923c" },
    silent: { emoji: "\u26AA", label: "Hiljainen", bg: "#cbd5e1" },
  };
  const i = icons[type] || icons.silent;
  return (
    <div title={i.label} style={{
      width: 28, height: 28, borderRadius: 8,
      background: active ? i.bg + "15" : "#f0ece6",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 15, opacity: active ? 1 : 0.35,
      border: active ? `1px solid ${i.bg}30` : "1px solid #e8e4dd",
    }}>{i.emoji}</div>
  );
}

// Churn risk badge
function ChurnBadge({ months }) {
  const levels = {
    3: { label: "Huomiotila", color: "#f59e0b", icon: "\u26A0\uFE0F" },
    6: { label: "Varoitus", color: "#f97316", icon: "\u{1F536}" },
    9: { label: "Kriittinen", color: "#ef4444", icon: "\u{1F534}" },
    12: { label: "Menetetty?", color: "#991b1b", icon: "\u{1F480}" },
  };
  const l = levels[months] || levels[3];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600,
      background: l.color + "12", color: l.color, border: `1px solid ${l.color}25`,
    }}>{l.icon} {months} kk — {l.label}</span>
  );
}

// Mock bar chart
function BarChart({ data, maxVal }) {
  const mx = maxVal || Math.max(...data.map(d => Math.max(d.actual, d.target)));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 100, padding: "0 2px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <div style={{ width: "100%", display: "flex", gap: 1, alignItems: "flex-end", justifyContent: "center", height: 80 }}>
            <div style={{ width: "45%", height: Math.max(2, (d.actual / mx) * 80), background: "var(--accent)", borderRadius: "3px 3px 0 0", transition: "height 0.3s" }} />
            <div style={{ width: "45%", height: Math.max(2, (d.target / mx) * 80), background: "var(--border)", borderRadius: "3px 3px 0 0" }} />
          </div>
          <span style={{ fontSize: 8, color: "var(--text-muted)", fontWeight: 500 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Donut chart mock
function DonutChart({ segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  let cumulative = 0;
  const size = 100, r = 36, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const offset = c * cumulative;
          cumulative += pct;
          return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={seg.color} strokeWidth={12} strokeDasharray={`${c * pct} ${c * (1 - pct)}`} strokeDashoffset={-offset} />;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{Math.round(total/1000)}k</span>
        <span style={{ fontSize: 8, color: "var(--text-muted)" }}>EUR</span>
      </div>
    </div>
  );
}

// ═══ MOCKUP DATA ═══
const MOCK_MONTHS = [
  { label: "Tam", actual: 42000, target: 50000 },
  { label: "Hel", actual: 55000, target: 50000 },
  { label: "Maa", actual: 38000, target: 50000 },
  { label: "Huh", actual: 61000, target: 55000 },
  { label: "Tou", actual: 47000, target: 55000 },
  { label: "Kes", actual: 52000, target: 55000 },
  { label: "Hei", actual: 28000, target: 45000 },
  { label: "Elo", actual: 58000, target: 55000 },
  { label: "Syy", actual: 63000, target: 60000 },
  { label: "Lok", actual: 71000, target: 60000 },
  { label: "Mar", actual: 45000, target: 60000 },
  { label: "Jou", actual: 0, target: 60000 },
];

const MOCK_CUSTOMERS = [
  { name: "Kemppi Group Oy", icons: ["call", "meeting", "offer", "deal"], thisYear: 142000, lastYear: 118000, potential: 200000 },
  { name: "Wärtsilä Finland", icons: ["call", "meeting"], thisYear: 98000, lastYear: 105000, potential: 150000 },
  { name: "Metso Outotec", icons: ["call", "deal", "new"], thisYear: 67000, lastYear: 0, potential: 120000 },
  { name: "Valmet Oyj", icons: ["marketing"], thisYear: 23000, lastYear: 89000, potential: 100000 },
  { name: "Ponsse Oyj", icons: ["call", "meeting", "offer"], thisYear: 55000, lastYear: 42000, potential: 80000 },
];

const MOCK_SILENT = [
  { name: "ABB Finland", lastContact: "2025-09-14", months: 6 },
  { name: "Outokumpu Oyj", lastContact: "2025-06-02", months: 9 },
  { name: "Nokia Solutions", lastContact: "2025-03-18", months: 12 },
  { name: "Cargotec Oyj", lastContact: "2025-12-01", months: 3 },
];

const MOCK_SELLERS = [
  { name: "Markku Räisänen", sales: 285000, target: 300000, margin: 71000, deals: 18 },
  { name: "Valtteri Korolainen", sales: 192000, target: 250000, margin: 48000, deals: 12 },
  { name: "Sanna Virtanen", sales: 167000, target: 200000, margin: 42000, deals: 9 },
  { name: "Timo Lahtinen", sales: 143000, target: 200000, margin: 36000, deals: 14 },
];

const BU_DATA = [
  { name: "Teollisuus", value: 340000, color: "#4f9cf9" },
  { name: "Energia", value: 220000, color: "#a78bfa" },
  { name: "Infra", value: 180000, color: "#f472b6" },
  { name: "Muu", value: 47000, color: "#fb923c" },
];

// ═══ VIEWS ═══

function SalesDashboard() {
  return (
    <div>
      {/* Period bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, background: "var(--bg)", borderRadius: 10, padding: 3 }}>
          {["Viikko", "Kuukausi", "Q", "Vuosi"].map((p, i) => (
            <button key={p} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: i === 1 ? "var(--accent)" : "transparent", color: i === 1 ? "#fff" : "var(--text-muted)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)" }}>{p}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u2039"}</button>
          <span style={{ fontSize: 14, fontWeight: 600, minWidth: 140, textAlign: "center" }}>maaliskuu 2026</span>
          <button style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u203A"}</button>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--bg)", borderRadius: 10, padding: 3 }}>
          {["Mittaristo", "Top-listat"].map((t, i) => (
            <button key={t} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: i === 0 ? "var(--bg-card)" : "transparent", color: i === 0 ? "var(--text)" : "var(--text-muted)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)", boxShadow: i === 0 ? "0 1px 4px rgba(0,0,0,0.06)" : "none" }}>{t}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "MYYNTI", value: "560k", sub: "+12% ed.vuosi", color: "#4f9cf9" },
          { label: "KATE", value: "140k", sub: "25% marginaali", color: "#a78bfa" },
          { label: "KAUPAT", value: "53", sub: "kpl suljettu", color: "#10b981" },
          { label: "HIT RATE", value: "34%", sub: "voitettu/kaikki", color: "#fb923c" },
          { label: "PIPELINE", value: "320k", sub: "avoin tarjouskanta", color: "#f472b6" },
        ].map((kpi, i) => (
          <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 14px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: kpi.color }} />
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{kpi.value}<span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}> {"\u20AC"}</span></div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Gauges row — scorecard style */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 14px 14px" }}>
          <Gauge value={560000} max={660000} label="Myynti vs tavoite" color="#4f9cf9" sublabel="kk-tavoite" />
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 14px 14px" }}>
          <Gauge value={140000} max={165000} label="Kate vs tavoite" color="#a78bfa" sublabel="kk-tavoite" />
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 14px 14px" }}>
          <Gauge value={285000} max={300000} label="Markku R." color="#10b981" sublabel="henk.tavoite" />
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 14px 14px" }}>
          <Gauge value={192000} max={250000} label="Valtteri K." color="#fb923c" sublabel="henk.tavoite" />
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 14 }}>
        {/* Monthly histogram */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
            <span style={{ color: "var(--accent)", marginRight: 6 }}>{"\u25C6"}</span>Kuukausimyynti vs tavoite
          </div>
          <BarChart data={MOCK_MONTHS} />
          <div style={{ display: "flex", gap: 16, marginTop: 8, justifyContent: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-muted)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--accent)" }} /> Toteuma
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-muted)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--border)" }} /> Tavoite
            </span>
          </div>
        </div>

        {/* BU Donut */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
            <span style={{ color: "var(--accent)", marginRight: 6 }}>{"\u25C6"}</span>Liiketoiminta-alueet
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <DonutChart segments={BU_DATA} />
          </div>
          {BU_DATA.map((bu, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: bu.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, flex: 1 }}>{bu.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{Math.round(bu.value / 1000)}k</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top sellers */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
          <span style={{ color: "var(--accent)", marginRight: 6 }}>{"\u25C6"}</span>Top myyj{"\u00E4"}t
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["", "Myyj\u00e4", "Myynti", "Tavoite", "Kate", "Kaupat", "Toteuma%"].map(h => (
                <th key={h} style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 8px", textAlign: "left", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_SELLERS.map((s, i) => {
              const pct = Math.round((s.sales / s.target) * 100);
              const barColor = pct >= 70 ? "#27ae60" : pct >= 31 ? "#f39c12" : "#e74c3c";
              return (
                <tr key={i}>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0ece6", fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{i + 1}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0ece6", fontSize: 12, fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0ece6", fontSize: 12, fontWeight: 600 }}>{Math.round(s.sales / 1000)}k {"\u20AC"}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0ece6", fontSize: 12, color: "var(--text-muted)" }}>{Math.round(s.target / 1000)}k</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0ece6", fontSize: 12 }}>{Math.round(s.margin / 1000)}k</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0ece6", fontSize: 12 }}>{s.deals}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0ece6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: "var(--gauge-bg)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: pct + "%", background: barColor, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: barColor, minWidth: 30 }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomerActivity() {
  const [view, setView] = useState("month");
  const [subTab, setSubTab] = useState("active");

  // Generate orb data for timeline (like scorecard)
  const generateOrbs = (count) => {
    const types = ["star", "green", "orange", "red", "empty", "future"];
    return Array.from({ length: count }, (_, i) => {
      if (i > count - 4) return "future";
      const r = Math.random();
      if (r > 0.85) return "star";
      if (r > 0.6) return "green";
      if (r > 0.4) return "orange";
      if (r > 0.2) return "red";
      return "empty";
    });
  };

  const orbCount = view === "week" ? 5 : view === "month" ? 22 : 52;
  const weekLabels = view === "week" ? ["Ma", "Ti", "Ke", "To", "Pe"] : null;

  return (
    <div>
      {/* Control bar — same as scorecard */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, background: "var(--bg)", borderRadius: 10, padding: 3 }}>
          {["Viikko", "Kuukausi", "Vuosi"].map((p) => (
            <button key={p} onClick={() => setView(p === "Viikko" ? "week" : p === "Kuukausi" ? "month" : "year")} style={{
              padding: "6px 16px", borderRadius: 8, border: "none",
              background: (p === "Viikko" && view === "week") || (p === "Kuukausi" && view === "month") || (p === "Vuosi" && view === "year") ? "var(--accent)" : "transparent",
              color: (p === "Viikko" && view === "week") || (p === "Kuukausi" && view === "month") || (p === "Vuosi" && view === "year") ? "#fff" : "var(--text-muted)",
              fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)",
            }}>{p}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u2039"}</button>
          <span style={{ fontSize: 14, fontWeight: 600, minWidth: 160, textAlign: "center" }}>
            {view === "week" ? "vko 10 \u2014 maaliskuu 2026" : view === "month" ? "maaliskuu 2026" : "2026"}
          </span>
          <button style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u203A"}</button>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--bg)", borderRadius: 10, padding: 3 }}>
          {[["active", "Aktiiviset"], ["silent", "Hiljaiset"], ["churn", "Poistumariski"]].map(([k, l]) => (
            <button key={k} onClick={() => setSubTab(k)} style={{
              padding: "6px 14px", borderRadius: 8, border: "none",
              background: subTab === k ? "var(--bg-card)" : "transparent",
              color: subTab === k ? "var(--text)" : "var(--text-muted)",
              fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)",
              boxShadow: subTab === k ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ACTIVE CUSTOMERS — scorecard-tyylinen lista */}
      {subTab === "active" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 0, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px 90px", padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Asiakas</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Eteneminen \u2014 {orbCount} {view === "week" ? "pv" : view === "month" ? "pv" : "vko"}
            </span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "right" }}>Tulos</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center" }}>Toimet</span>
          </div>

          {MOCK_CUSTOMERS.map((c, ci) => {
            const orbs = generateOrbs(orbCount);
            const stars = orbs.filter(o => o === "star").length;
            const total = orbs.filter(o => o !== "future" && o !== "empty").length;
            return (
              <div key={ci} style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px 90px", padding: "12px 16px", borderBottom: "1px solid #f0ece6", alignItems: "center" }}>
                {/* Customer name */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{Math.round(c.thisYear / 1000)}k {"\u20AC"} / {Math.round(c.potential / 1000)}k pot.</div>
                </div>

                {/* Orb row — exact scorecard style */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                  {orbs.map((type, oi) => (
                    <Orb key={oi} type={type} tip={weekLabels ? weekLabels[oi] : `Pv ${oi + 1}`} size={view === "year" ? 14 : 22} />
                  ))}
                </div>

                {/* Result */}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{total}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{stars} {"\u2B50"}</div>
                </div>

                {/* Activity icons */}
                <div style={{ display: "flex", gap: 3, justifyContent: "center", flexWrap: "wrap" }}>
                  {c.icons.map((icon, ii) => <ActivityIcon key={ii} type={icon} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SILENT CUSTOMERS */}
      {subTab === "silent" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px 90px", padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Asiakas</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Eteneminen</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "right" }}>Viim. yhteys</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center" }}>Tila</span>
          </div>
          {MOCK_SILENT.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px 90px", padding: "12px 16px", borderBottom: "1px solid #f0ece6", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {Array.from({ length: orbCount }, (_, oi) => <Orb key={oi} type="empty" size={view === "year" ? 14 : 22} />)}
              </div>
              <div style={{ textAlign: "right", fontSize: 11, color: "var(--text-muted)" }}>{c.lastContact}</div>
              <div style={{ textAlign: "center" }}><ActivityIcon type="silent" active={false} /></div>
            </div>
          ))}
        </div>
      )}

      {/* CHURN RISK */}
      {subTab === "churn" && (
        <div>
          {[3, 6, 9, 12].map(months => {
            const customers = MOCK_SILENT.filter(c => c.months === months);
            if (!customers.length) return null;
            return (
              <div key={months} style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 8 }}><ChurnBadge months={months} /></div>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                  {customers.map((c, ci) => (
                    <div key={ci} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: ci < customers.length - 1 ? "1px solid #f0ece6" : "none" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Viimeisin: {c.lastContact}</div>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {Array.from({ length: months }, (_, i) => (
                          <Orb key={i} type={i < months - 2 ? "empty" : "red"} size={18} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminPanel() {
  const [adminTab, setAdminTab] = useState("targets");

  return (
    <div>
      {/* Admin nav */}
      <div style={{ display: "flex", gap: 4, background: "var(--bg)", borderRadius: 10, padding: 3, marginBottom: 14 }}>
        {[["targets", "Asiakastavoitteet"], ["bu", "Liiketoiminta-alueet"], ["sellers", "Myyj\u00e4tavoitteet"], ["potential", "Potentiaalit"]].map(([k, l]) => (
          <button key={k} onClick={() => setAdminTab(k)} style={{
            flex: 1, padding: "8px 14px", borderRadius: 8, border: "none",
            background: adminTab === k ? "var(--bg-card)" : "transparent",
            color: adminTab === k ? "var(--text)" : "var(--text-muted)",
            fontSize: 12, fontWeight: adminTab === k ? 600 : 400,
            cursor: "pointer", fontFamily: "var(--font)",
            boxShadow: adminTab === k ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
          }}>{l}</button>
        ))}
      </div>

      {/* Customer targets */}
      {adminTab === "targets" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            <span style={{ color: "var(--accent)", marginRight: 6 }}>{"\u25C6"}</span>Asiakastavoitteet \u20AC \u2014 2026
          </div>

          {/* Customer selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>Asiakas</label>
            <select style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 13, fontFamily: "var(--font)", color: "var(--text)" }}>
              <option>Kemppi Group Oy</option>
              <option>W{"\u00E4"}rtsil{"\u00E4"} Finland</option>
              <option>Metso Outotec</option>
            </select>
          </div>

          {/* Monthly targets grid */}
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontWeight: 500 }}>Kuukausitavoitteet {"\u20AC"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 16 }}>
            {["Tam", "Hel", "Maa", "Huh", "Tou", "Kes", "Hei", "Elo", "Syy", "Lok", "Mar", "Jou"].map((m, i) => (
              <div key={i}>
                <label style={{ fontSize: 9, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>{m}</label>
                <input type="text" defaultValue={[15000, 15000, 18000, 20000, 20000, 18000, 10000, 20000, 22000, 22000, 20000, 20000][i]} style={{
                  width: "100%", padding: "7px 8px", borderRadius: 6, border: "1px solid var(--border)",
                  background: "var(--bg)", fontSize: 11, fontFamily: "var(--font)", textAlign: "right",
                }} />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--bg)", borderRadius: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Vuositavoite yhteens{"\u00E4"}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>220 000 {"\u20AC"}</span>
          </div>

          {/* BU split */}
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontWeight: 500 }}>Liiketoiminta-aluejako</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {BU_DATA.slice(0, 3).map((bu, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: bu.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, flex: 1 }}>{bu.name}</span>
                <input type="text" defaultValue={[120000, 60000, 40000][i]} style={{ width: 80, padding: "5px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 11, textAlign: "right", fontFamily: "var(--font)" }} />
              </div>
            ))}
          </div>

          <button style={{ background: "var(--text)", color: "var(--bg-card)", border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>Tallenna</button>
        </div>
      )}

      {/* BU Management */}
      {adminTab === "bu" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            <span style={{ color: "var(--accent)", marginRight: 6 }}>{"\u25C6"}</span>Liiketoiminta-alueet ja esimiehet
          </div>
          {BU_DATA.map((bu, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end", padding: "12px 0", borderBottom: i < BU_DATA.length - 1 ? "1px solid #f0ece6" : "none" }}>
              <div>
                <label style={{ fontSize: 9, color: "var(--text-muted)", display: "block", marginBottom: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>Nimi</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: bu.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{bu.name}</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 9, color: "var(--text-muted)", display: "block", marginBottom: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>BU Esimies</label>
                <select style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, fontFamily: "var(--font)" }}>
                  <option>{["Markku R\u00e4is\u00e4nen", "Valtteri Korolainen", "Sanna Virtanen", "Timo Lahtinen"][i]}</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 9, color: "var(--text-muted)", display: "block", marginBottom: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>Oletusmyyj{"\u00E4"}</label>
                <select style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, fontFamily: "var(--font)" }}>
                  <option>Valitse...</option>
                </select>
              </div>
              <button style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 11, cursor: "pointer", fontFamily: "var(--font)" }}>Poista</button>
            </div>
          ))}
          <button style={{ marginTop: 12, background: "var(--bg)", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "var(--font)", color: "var(--text-muted)" }}>+ Lis{"\u00E4\u00E4"} liiketoiminta-alue</button>
        </div>
      )}

      {/* Seller targets */}
      {adminTab === "sellers" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            <span style={{ color: "var(--accent)", marginRight: 6 }}>{"\u25C6"}</span>Myyj{"\u00E4"}tavoitteet {"\u20AC"} \u2014 2026
          </div>
          {MOCK_SELLERS.map((s, i) => (
            <div key={i} style={{ padding: "14px 0", borderBottom: i < MOCK_SELLERS.length - 1 ? "1px solid #f0ece6" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ fontSize: 10, color: "var(--text-muted)" }}>Tyyppi:</label>
                  <select style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid var(--border)", fontSize: 11, fontFamily: "var(--font)" }}>
                    <option>Laskennallinen</option>
                    <option>Kiinte{"\u00E4"}</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
                {["Tam", "Hel", "Maa", "Huh", "Tou", "Kes", "Hei", "Elo", "Syy", "Lok", "Mar", "Jou"].map((m, mi) => (
                  <div key={mi}>
                    <label style={{ fontSize: 8, color: "var(--text-muted)" }}>{m}</label>
                    <input type="text" defaultValue={Math.round(s.target / 12)} style={{ width: "100%", padding: "5px 6px", borderRadius: 5, border: "1px solid var(--border)", fontSize: 10, textAlign: "right", fontFamily: "var(--font)", background: "var(--bg)" }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button style={{ marginTop: 12, background: "var(--text)", color: "var(--bg-card)", border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>Tallenna kaikki</button>
        </div>
      )}

      {/* Potentials */}
      {adminTab === "potential" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            <span style={{ color: "var(--accent)", marginRight: 6 }}>{"\u25C6"}</span>Asiakaspotentiaalit {"\u20AC"}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Asiakas", "T\u00e4m\u00e4 vuosi", "Potentiaali", "Ero", ""].map(h => (
                  <th key={h} style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px", textAlign: "left", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_CUSTOMERS.map((c, i) => {
                const diff = c.potential - c.thisYear;
                return (
                  <tr key={i}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0ece6", fontSize: 12, fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0ece6", fontSize: 12 }}>{Math.round(c.thisYear / 1000)}k</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0ece6" }}>
                      <input type="text" defaultValue={c.potential} style={{ width: 90, padding: "5px 8px", borderRadius: 5, border: "1px solid var(--border)", fontSize: 11, textAlign: "right", fontFamily: "var(--font)" }} />
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0ece6", fontSize: 12, color: diff > 0 ? "#e74c3c" : "#27ae60", fontWeight: 600 }}>
                      {diff > 0 ? "-" : "+"}{Math.abs(Math.round(diff / 1000))}k
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0ece6" }}>
                      <div style={{ height: 5, width: 80, background: "var(--gauge-bg)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: Math.round((c.thisYear / c.potential) * 100) + "%", background: c.thisYear / c.potential > 0.7 ? "#27ae60" : c.thisYear / c.potential > 0.3 ? "#f39c12" : "#e74c3c", borderRadius: 3 }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══ MAIN APP ═══
export default function LayoutMockups() {
  const [screen, setScreen] = useState("sales");

  const screens = [
    { id: "sales", label: "Myyntimittaristo", icon: "\u{1F4CA}" },
    { id: "customers", label: "Asiakasseuranta", icon: "\u{1F465}" },
    { id: "admin", label: "Hallintapaneeli", icon: "\u2699\uFE0F" },
  ];

  return (
    <div style={{
      "--bg": "#f7f6f3", "--bg-card": "#ffffff", "--text": "#1a1814", "--text-muted": "#8a8478",
      "--accent": "#4f9cf9", "--accent-glow": "rgba(79,156,249,0.15)", "--border": "#e8e4dd",
      "--gauge-bg": "#eceae5", "--orb-empty": "#e0ddd7", "--orb-red": "#e74c3c",
      "--orb-orange": "#f39c12", "--orb-green": "#27ae60", "--font": "'DM Sans', sans-serif",
      "--radius": "16px",
      minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #e8e4dd; border-radius: 3px; }
      `}</style>

      {/* Top nav — like Lunni360 */}
      <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Lunni <span style={{ color: "var(--accent)", fontStyle: "italic" }}>KPI</span></h1>
          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(79,156,249,0.08)", color: "var(--accent)", fontWeight: 600 }}>LAYOUT MOCKUP</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {screens.map(s => (
            <button key={s.id} onClick={() => setScreen(s.id)} style={{
              padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              border: screen === s.id ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: screen === s.id ? "rgba(79,156,249,0.08)" : "var(--bg-card)",
              color: screen === s.id ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer", fontFamily: "var(--font)",
            }}>{s.icon} {s.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 20px 40px" }}>
        {screen === "sales" && <SalesDashboard />}
        {screen === "customers" && <CustomerActivity />}
        {screen === "admin" && <AdminPanel />}
      </div>
    </div>
  );
}
