import { useState } from "react";

const PIECES = [
  {id:1,t:"API-kenttien kartoitus",pa:"A",d:[],sz:"pieni",s:"next",
   desc:"Selvita Lunni API kentat: opportunities, accounts, users. Dokumentoi kenttanimet IMPLEMENTATION_PLAN.md:hen.",
   files:["IMPLEMENTATION_PLAN.md"],test:"curl palvelimella /api/opportunities?limit=5"},
  {id:2,t:"Cache-laajennus",pa:"A",d:[1],sz:"~10 rv",
   desc:"Laajenna CACHE_OBJECTS: opportunities + accounts uudet kentat. Lisaa users cacheen.",
   files:["server.js"],test:"pm2 restart + tarkista cache/*.json"},
  {id:3,t:"sales_config.json rakenne",pa:"B",d:[],sz:"~50 rv",
   desc:"Config-tiedosto + loadSalesConfig/saveSalesConfig funktiot. Kopioi scorecard_config-pattern.",
   files:["server.js"],test:"GET/POST /api/sales/config"},
  {id:4,t:"Sales API: summary + monthly",pa:"A",d:[2],sz:"~100 rv",
   desc:"GET /api/sales/summary (KPI-luvut) ja /api/sales/monthly (12kk taulukko). Laskee cachesta.",
   files:["server.js"],test:"curl /api/sales/summary?period=month&year=2026&month=3"},
  {id:5,t:"Sales API: by-bu, by-person, by-account",pa:"A",d:[4],sz:"~120 rv",
   desc:"Kolme ryhmiteltya endpointtia: myynti per BU, per myyja, per asiakas.",
   files:["server.js"],test:"curl /api/sales/by-person?year=2026"},
  {id:6,t:"Roolisuodatus kaikkiin API:hin",pa:"A",d:[4,5],sz:"~40 rv",
   desc:"Admin naakee kaiken, manager oman BU:n, myyja omat asiakkaat. Lisaa suodatus paloihin 4-5.",
   files:["server.js"],test:"Testaa eri rooleilla"},
  {id:7,t:"sales_dashboard.html pohja",pa:"C",d:[],sz:"~200 rv",
   desc:"HTML-runko: nav, period-bar (Viikko/Kk/Q/Vuosi), latausanimaatio. Kopioi CRM-pattern.",
   files:["sales_dashboard.html","server.js"],test:"Sivu latautuu, teema injektoituu"},
  {id:8,t:"sales_dashboard gauget + KPI",pa:"C",d:[4,7],sz:"~350 rv",
   desc:"5 KPI-korttia ylariville + 4 scorecard-tyyppista gauge-mittaria.",
   files:["sales_dashboard.html"],test:"Gauget nayttavat oikeat prosentit"},
  {id:9,t:"sales_dashboard kaaviot + taulukot",pa:"C",d:[5,8],sz:"~450 rv",
   desc:"Chart.js: kuukausihistogrammi, BU-donitsi, top-myyjat, top-asiakkaat, 12kk trendi.",
   files:["sales_dashboard.html"],test:"Kaaviot renderoi, tab-vaihto toimii"},
  {id:10,t:"Customer API: activity + silent + churn",pa:"A",d:[2],sz:"~140 rv",
   desc:"Kolme endpointtia: aktiivisuus per asiakas, hiljaiset asiakkaat, poistumariski 3/6/9/12kk.",
   files:["server.js"],test:"curl /api/customers/churn-risk"},
  {id:11,t:"customer_dashboard pohja + aktiiviset",pa:"D",d:[10],sz:"~600 rv",
   desc:"Sivupohja + scorecard-tyylinen orb-rivi per asiakas. Aktiviteetti-ikonit: puhelu, tapaaminen, tarjous, kauppa.",
   files:["customer_dashboard.html","server.js"],test:"Orb-rivit nayttavat oikein"},
  {id:12,t:"customer_dashboard hiljaiset + churn",pa:"D",d:[11],sz:"~350 rv",
   desc:"Hiljaiset-lista (tyhjat orbit) + poistumariski 3/6/9/12kk badgeilla ja vari-ryhmittelylla.",
   files:["customer_dashboard.html"],test:"Tab-vaihto, churn-luokat"},
  {id:13,t:"targets_admin.html asiakastavoitteet",pa:"B",d:[3],sz:"~500 rv",
   desc:"Hallintapaneeli: asiakas-dropdown, 12 kk-inputtia, vuositavoite, BU-jako. Tallenna configiin.",
   files:["targets_admin.html","server.js"],test:"Tallenna + lataa -> data sailyy"},
  {id:14,t:"targets_admin BU + myyjatavoitteet",pa:"B",d:[13],sz:"~450 rv",
   desc:"BU-hallinta (esimiehet), myyjatavoitteet (kiintea/laskennallinen), asiakaspotentiaalit.",
   files:["targets_admin.html"],test:"Kaikki 4 tabia toimivat"},
  {id:15,t:"sales_embed.html + reitit",pa:"C",d:[8,9],sz:"~530 rv",
   desc:"Iframe-versio myyntimittaristosta. Token URL:ssa, kompakti (gauget+KPI).",
   files:["sales_embed.html","server.js"],test:"iframe src=/sales-embed?token=X"},
  {id:16,t:"customer_embed.html + reitit",pa:"D",d:[11,12],sz:"~530 rv",
   desc:"Iframe-versio asiakasseurannasta. Sama embed-pattern kuin scorecard.",
   files:["customer_embed.html","server.js"],test:"iframe src=/customer-embed?token=X"},
  {id:17,t:"Snapshot-mekanismi",pa:"A",d:[4,5],sz:"~70 rv",
   desc:"Paivittainen tilannekuva cron klo 02:00. Vertailu-endpoint: missa oltiin kuukausi sitten?",
   files:["server.js"],test:"Tarkista snapshots/ kansio"},
  {id:18,t:"Viimeistely + README",pa:"-",d:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],sz:"~100 rv",
   desc:"Nav-linkit kaikkiin sivuihin, README paivitys, testaus kaikilla rooleilla + teemoilla, deploy.",
   files:["README.md","kaikki HTML"],test:"Kaikki toimii yhdessa"},
];

const PATHS = {
  A:{n:"Backend",c:"#4f9cf9",desc:"API, cache, data"},
  B:{n:"Config & Admin",c:"#10b981",desc:"Hallinta, asetukset"},
  C:{n:"Sales UI",c:"#f59e0b",desc:"Myyntimittariston kayttoliittyma"},
  D:{n:"Customer UI",c:"#a78bfa",desc:"Asiakasseurannan kayttoliittyma"},
  "-":{n:"Kaikki",c:"#94a3b8",desc:"Viimeistely"},
};

const STS = {
  todo:{bg:"#eceae5",c:"#8a8478",l:"Aloittamatta",i:"\u25A1"},
  next:{bg:"#e8f2fe",c:"#4f9cf9",l:"Seuraava",i:"\u25B6"},
  wip:{bg:"#fef3e8",c:"#fb923c",l:"Kesken",i:"\u{1F527}"},
  done:{bg:"#e8faf2",c:"#10b981",l:"Valmis",i:"\u2705"},
  skip:{bg:"#eceae5",c:"#cbd5e1",l:"Ohitettu",i:"\u23ED"},
};

export default function App(){
  const [sts,setSts]=useState(()=>{
    const s={};PIECES.forEach(p=>s[p.id]=p.s||"todo");return s;
  });
  const [sel,setSel]=useState(null);
  const [vm,setVm]=useState("list");

  const cyc=id=>setSts(prev=>{
    const o=["todo","next","wip","done","skip"];
    return{...prev,[id]:o[(o.indexOf(prev[id])+1)%5]};
  });

  const can=p=>p.d.length===0||p.d.every(d=>sts[d]==="done"||sts[d]==="skip");
  const dn=Object.values(sts).filter(s=>s==="done").length;
  const pct=Math.round(dn/18*100);
  const sp=sel?PIECES.find(p=>p.id===sel):null;

  const pathOrder=["A","B","C","D"];

  return(
    <div style={{minHeight:"100vh",background:"#f7f6f3",color:"#1a1814",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}`}</style>

      {/* HEADER */}
      <div style={{background:"#fff",borderBottom:"1px solid #e8e4dd",padding:"16px 24px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <h1 style={{fontSize:22,fontWeight:700,letterSpacing:"-0.02em"}}>
              Lunni<span style={{color:"#4f9cf9",fontStyle:"italic",marginLeft:4}}>KPI</span>
            </h1>
            <span style={{fontSize:9,padding:"3px 8px",borderRadius:4,background:"#e8f2fe",color:"#4f9cf9",fontWeight:700,letterSpacing:"0.06em"}}>
              TOTEUTUSSUUNNITELMA
            </span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,minWidth:200}}>
            <div style={{flex:1,height:8,background:"#eceae5",borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:pct+"%",background:pct===100?"#10b981":"#4f9cf9",borderRadius:4,transition:"width 0.4s ease"}}/>
            </div>
            <span style={{fontSize:13,fontWeight:700,color:pct===100?"#10b981":"#4f9cf9",fontFamily:"'DM Mono',monospace"}}>{dn}/18</span>
          </div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",gap:14}}>
            {pathOrder.map(k=>{const v=PATHS[k];return(
              <div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
                <span style={{width:10,height:10,borderRadius:3,background:v.c}}/>
                <span style={{fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{k}</span>
                <span style={{color:"#8a8478"}}>{v.n}</span>
              </div>
            )})}
          </div>
          <div style={{display:"flex",gap:3,background:"#f7f6f3",borderRadius:8,padding:3}}>
            {[["list","Lista"],["paths","Polut"],["order","Jarjestys"]].map(([id,l])=>(
              <button key={id} onClick={()=>setVm(id)} style={{
                padding:"6px 16px",borderRadius:6,border:"none",fontSize:12,cursor:"pointer",fontFamily:"inherit",
                background:vm===id?"#fff":"transparent",color:vm===id?"#1a1814":"#8a8478",
                fontWeight:vm===id?600:400,boxShadow:vm===id?"0 1px 3px rgba(0,0,0,0.06)":"none",
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{maxWidth:1040,margin:"0 auto",padding:"16px 20px 50px",display:"flex",gap:14}}>
        <div style={{flex:1,minWidth:0}}>

          {/* LIST VIEW */}
          {vm==="list"&&PIECES.map(p=>{
            const st=STS[sts[p.id]]||STS.todo;
            const pa=PATHS[p.pa];
            const rdy=can(p);
            const iS=sel===p.id;
            return(
              <div key={p.id} onClick={()=>setSel(iS?null:p.id)} style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:3,
                background:iS?"#fff":"transparent",borderRadius:10,cursor:"pointer",
                border:iS?"1.5px solid "+pa.c+"50":"1.5px solid transparent",
                opacity:sts[p.id]==="skip"?0.3:!rdy&&sts[p.id]==="todo"?0.45:1,
                transition:"all 0.15s",
              }}>
                <button onClick={e=>{e.stopPropagation();cyc(p.id)}} title="Vaihda tilaa klikkaamalla"
                  style={{width:30,height:30,borderRadius:7,border:"none",background:st.bg,color:st.c,
                  fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                  transition:"transform 0.1s"}}
                  onMouseOver={e=>e.currentTarget.style.transform="scale(1.1)"}
                  onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}
                >{st.i}</button>

                <span style={{fontSize:11,fontWeight:800,fontFamily:"'DM Mono',monospace",color:pa.c,width:22,textAlign:"center",flexShrink:0}}>{p.id}</span>

                <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,background:pa.c+"12",color:pa.c,flexShrink:0,letterSpacing:"0.04em"}}>{p.pa}</span>

                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.t}</div>
                  {iS&&<div style={{fontSize:11,color:"#8a8478",marginTop:3,lineHeight:1.5}}>{p.desc}</div>}
                </div>

                <span style={{fontSize:10,color:"#8a8478",flexShrink:0,fontFamily:"'DM Mono',monospace"}}>{p.sz}</span>

                {!rdy&&sts[p.id]==="todo"&&<span style={{fontSize:10}} title={"Vaatii palat: "+p.d.join(", ")}>🔒</span>}

                <span style={{fontSize:9,fontWeight:600,padding:"3px 8px",borderRadius:12,background:st.bg,color:st.c,flexShrink:0,whiteSpace:"nowrap"}}>{st.l}</span>
              </div>
            );
          })}

          {/* PATHS VIEW */}
          {vm==="paths"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {pathOrder.map(pk=>{const pi=PATHS[pk];const pp=PIECES.filter(p=>p.pa===pk);
                return(
                  <div key={pk} style={{background:"#fff",borderRadius:12,border:"1px solid #e8e4dd",overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",borderBottom:"1px solid #e8e4dd",background:pi.c+"06"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{width:12,height:12,borderRadius:4,background:pi.c}}/>
                        <span style={{fontSize:14,fontWeight:700}}>Polku {pk}</span>
                        <span style={{fontSize:11,color:"#8a8478"}}>{pi.n}</span>
                      </div>
                      <div style={{fontSize:10,color:"#8a8478",marginTop:3}}>{pi.desc}</div>
                    </div>
                    {pp.map((p,i)=>{const st=STS[sts[p.id]]||STS.todo;return(
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderBottom:i<pp.length-1?"1px solid #f0ece6":"none"}}>
                        <button onClick={()=>cyc(p.id)} style={{width:24,height:24,borderRadius:5,border:"none",background:st.bg,color:st.c,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{st.i}</button>
                        <span style={{fontSize:11,fontWeight:700,color:pi.c,fontFamily:"'DM Mono',monospace",width:18}}>{p.id}</span>
                        <span style={{fontSize:12,fontWeight:500,flex:1}}>{p.t}</span>
                        {p.d.length>0&&<span style={{fontSize:10,color:"#b0a99e",fontFamily:"'DM Mono',monospace"}}>{"\u2190 "}{p.d.join(", ")}</span>}
                      </div>
                    );})}
                  </div>
                );
              })}
            </div>
          )}

          {/* ORDER VIEW — recommended execution order */}
          {vm==="order"&&(
            <div>
              <div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e4dd",padding:20,marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,color:"#8a8478",letterSpacing:"0.1em",marginBottom:10}}>SUOSITELTU JARJESTYS</div>
                <div style={{fontSize:12,color:"#8a8478",lineHeight:1.7,marginBottom:16}}>
                  Tee ensin backend-polku (A) ja config (B) rinnakkain, sitten UI-polut (C, D). Jokainen pala on yksi commit + push.
                </div>
                {[
                  {phase:"Vaihe 1: Perusta",ids:[1,3],note:"Rinnakkaiset — ei riippuvuuksia"},
                  {phase:"Vaihe 2: Data",ids:[2],note:"Vaatii palan 1"},
                  {phase:"Vaihe 3: API:t",ids:[4,5,10],note:"4 ja 10 rinnakkain (molemmat vaativat 2), 5 vaatii 4"},
                  {phase:"Vaihe 4: Suodatus",ids:[6],note:"Vaatii 4+5"},
                  {phase:"Vaihe 5: Sales UI",ids:[7,8,9],note:"7 itsenainen, 8 vaatii 4+7, 9 vaatii 5+8"},
                  {phase:"Vaihe 6: Customer UI",ids:[11,12],note:"11 vaatii 10, 12 vaatii 11"},
                  {phase:"Vaihe 7: Admin UI",ids:[13,14],note:"13 vaatii 3, 14 vaatii 13"},
                  {phase:"Vaihe 8: Embedit",ids:[15,16],note:"15 vaatii 8+9, 16 vaatii 11+12"},
                  {phase:"Vaihe 9: Extra",ids:[17],note:"Vaatii 4+5"},
                  {phase:"Vaihe 10: Julkaisu",ids:[18],note:"Vaatii kaiken"},
                ].map((phase,pi)=>(
                  <div key={pi} style={{marginBottom:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#1a1814",marginBottom:6}}>{phase.phase}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>
                      {phase.ids.map(id=>{
                        const p=PIECES.find(x=>x.id===id);
                        const st=STS[sts[id]]||STS.todo;
                        const pa=PATHS[p.pa];
                        return(
                          <div key={id} onClick={()=>{setSel(id);setVm("list")}} style={{
                            display:"flex",alignItems:"center",gap:6,padding:"6px 10px",
                            background:st.bg,borderRadius:8,cursor:"pointer",border:"1px solid "+pa.c+"20",
                          }}>
                            <span style={{fontSize:12}}>{st.i}</span>
                            <span style={{fontSize:10,fontWeight:700,color:pa.c,fontFamily:"'DM Mono',monospace"}}>{id}</span>
                            <span style={{fontSize:11,fontWeight:500}}>{p.t}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{fontSize:10,color:"#b0a99e",marginLeft:4}}>{phase.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* DETAIL PANEL */}
        {sp&&vm==="list"&&(
          <div style={{width:270,flexShrink:0,background:"#fff",borderRadius:12,border:"1px solid #e8e4dd",padding:18,alignSelf:"flex-start",position:"sticky",top:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:16,fontWeight:800,fontFamily:"'DM Mono',monospace",color:PATHS[sp.pa].c}}>#{sp.id}</span>
              <span style={{fontSize:14,fontWeight:700}}>{sp.t}</span>
            </div>
            <div style={{fontSize:12,color:"#8a8478",lineHeight:1.6,marginBottom:14}}>{sp.desc}</div>

            {/* Deps */}
            <div style={{fontSize:9,fontWeight:700,color:"#8a8478",letterSpacing:"0.1em",marginBottom:4}}>EDELLYTYKSET</div>
            {sp.d.length===0
              ?<div style={{fontSize:11,color:"#10b981",marginBottom:12,fontWeight:500}}>Ei riippuvuuksia — voi aloittaa heti</div>
              :<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12}}>
                {sp.d.filter(d=>d<=18).slice(0,8).map(d=>{
                  const ok=sts[d]==="done"||sts[d]==="skip";
                  return<span key={d} style={{fontSize:10,padding:"2px 8px",borderRadius:5,background:ok?"#e8faf2":"rgba(239,68,68,0.06)",color:ok?"#10b981":"#e74c3c",fontWeight:600,cursor:"pointer"}} onClick={()=>setSel(d)}>{ok?"\u2705":"\u{1F512}"} Pala {d}</span>;
                })}
              </div>
            }

            {/* Files */}
            <div style={{fontSize:9,fontWeight:700,color:"#8a8478",letterSpacing:"0.1em",marginBottom:4}}>TIEDOSTOT</div>
            <div style={{marginBottom:12}}>
              {sp.files.map((f,i)=><div key={i} style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:"#4f9cf9",padding:"2px 0"}}>{f}</div>)}
            </div>

            {/* Test */}
            <div style={{fontSize:9,fontWeight:700,color:"#8a8478",letterSpacing:"0.1em",marginBottom:4}}>TESTAUS</div>
            <div style={{fontSize:11,color:"#1a1814",marginBottom:14,lineHeight:1.5}}>{sp.test}</div>

            {/* Commit */}
            <div style={{fontSize:9,fontWeight:700,color:"#8a8478",letterSpacing:"0.1em",marginBottom:4}}>COMMIT</div>
            <div style={{fontSize:11,fontFamily:"'DM Mono',monospace",background:"#f7f6f3",padding:"8px 10px",borderRadius:6,border:"1px solid #e8e4dd",wordBreak:"break-all",lineHeight:1.4}}>
              git commit -m "Pala {sp.id}: {sp.t}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
