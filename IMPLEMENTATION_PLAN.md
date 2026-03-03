# Lunni360 Sales Dashboard — Toteutussuunnitelma
## Versio 1.0 — Paloiteltu toteutusjarjestys
Luotu: 3.3.2026

---

## Miten jatkat seuraavalla kerralla (LUE TAMA ENSIN)

1. Avaa uusi Claude-keskustelu
2. Kirjoita: **"Jatketaan Lunni360 Sales Dashboard -projektia. Tehdaan pala X."**
3. Liita mukaan: **tama tiedosto + README.md + server.js + muutettavat tiedostot**
4. Kun pala valmis: paivita tilan tiedoston tila, commit, push

---

## Palojen tila

| # | Pala | Tila | Tiedostot | Commit |
|---|------|------|-----------|--------|
| 1 | API-kenttien kartoitus | kesk | IMPLEMENTATION_PLAN.md | — |
| 2 | Cache-laajennus server.js | aloittamatta | server.js | — |
| 3 | sales_config.json rakenne | aloittamatta | server.js | — |
| 4 | Sales API: summary + monthly | aloittamatta | server.js | — |
| 5 | Sales API: by-bu + by-person + by-account | aloittamatta | server.js | — |
| 6 | Sales API: roolisuodatus | aloittamatta | server.js | — |
| 7 | sales_dashboard.html pohja | aloittamatta | sales_dashboard.html | — |
| 8 | sales_dashboard.html gauget + KPI | aloittamatta | sales_dashboard.html | — |
| 9 | sales_dashboard.html kaaviot + taulukot | aloittamatta | sales_dashboard.html | — |
| 10 | Customer API: activity + silent + churn | aloittamatta | server.js | — |
| 11 | customer_dashboard.html pohja + aktiiviset | aloittamatta | customer_dashboard.html | — |
| 12 | customer_dashboard.html hiljaiset + poistuma | aloittamatta | customer_dashboard.html | — |
| 13 | targets_admin.html asiakastavoitteet | aloittamatta | targets_admin.html | — |
| 14 | targets_admin.html BU + myyjatavoitteet | aloittamatta | targets_admin.html | — |
| 15 | sales_embed.html + embed-reitit | aloittamatta | sales_embed.html, server.js | — |
| 16 | customer_embed.html + embed-reitit | aloittamatta | customer_embed.html, server.js | — |
| 17 | Snapshot-mekanismi | aloittamatta | server.js | — |
| 18 | Viimeistely + README paivitys | aloittamatta | README.md, kaikki | — |

Tilat: aloittamatta | kesk | valmis | ohitettu

---

## Riippuvuuskaavio

```
Pala 1 (API-kartoitus)
  |-> Pala 2 (Cache-laajennus)
       |-> Pala 4 (Sales API: summary)
       |    |-> Pala 5 (Sales API: by-bu/person/account)
       |         |-> Pala 6 (Roolisuodatus)
       |              |-> Pala 9 (Kaaviot + taulukot)
       |                   |-> Pala 15 (sales_embed)
       |-> Pala 10 (Customer API)
            |-> Pala 11 (customer aktiiviset)
                 |-> Pala 12 (hiljaiset + churn)
                      |-> Pala 16 (customer_embed)

Pala 3 (sales_config) -- itsenainen
  |-> Pala 13 (targets admin pohja)
       |-> Pala 14 (BU + myyjatavoitteet)

Pala 7 (sales_dashboard pohja) -- itsenainen
  |-> Pala 8 (gauget + KPI)
       |-> Pala 9 (kaaviot + taulukot)

Palat 4-5 valmiit
  |-> Pala 17 (Snapshot)

Kaikki valmiit
  |-> Pala 18 (Viimeistely)
```

## Rinnakkaiset polut

**Polku A — Backend:**  1 -> 2 -> 4 -> 5 -> 6 -> 10 -> 17
**Polku B — Config:**   3 -> 13 -> 14
**Polku C — Sales UI:** 7 -> 8 -> 9 -> 15
**Polku D — Cust UI:**  11 -> 12 -> 16

Suositus: A+B ensin, sitten C+D.

---

## Pala 1: API-kenttien kartoitus

**Tavoite:** Selvittaa mita kenttia Lunni API oikeasti palauttaa opportunities, accounts ja users -endpointeista.

**Miksi ensin:** Koko projekti perustuu siihen, mita dataa API tarjoaa. Ilman tata rakennamme sokeasti.

**Tehtavat:**
- [ ] Hae /opportunities?limit=5 -- listaa kaikki kentat
- [ ] Etsi: amount/totalamount, margin/kate, business_unit, owner_id, account_id, closedate, stage
- [ ] Hae /accounts?limit=5 -- listaa kaikki kentat
- [ ] Etsi: owner_id, classification, industry, potential
- [ ] Hae /users?limit=5 -- listaa kaikki kentat
- [ ] Etsi: role, team, business_unit, active
- [ ] Testaa loytyyko erillinen /businessunits endpoint
- [ ] Dokumentoi tulokset alle

**Tapa tehda:** Kayta olemassa olevaa /api/ proxy-reittia (server.js rivi ~1320) tai suoraan curl palvelimella.

**Tuotos:** Tama tiedosto paivitettyna

**Muutettavat tiedostot:** Vain IMPLEMENTATION_PLAN.md

### API-kenttakartta (taytetaan palassa 1)

```
OPPORTUNITIES -- nykyinen cache: id,stage,totalamount,responsibility,closedate,custom_miksihvittiin,created
Loydetyt lisakentat:
- amount: ???
- margin/kate: ???
- business_unit: ???
- owner_id: ???
- account_id: ???
- probability: ???
- pipeline: ???
- won_date: ???

ACCOUNTS -- nykyinen cache: id,name,created,updated
Loydetyt lisakentat:
- owner_id: ???
- classification: ???
- industry: ???
- potential: ???
- business_units: ???

USERS -- ei cachessa
Loydetyt kentat:
- id: ???
- name: ???
- email: ???
- role: ???
- team: ???
- business_unit: ???

BUSINESS UNITS -- erillinen endpoint?
- endpoint: ???
- kentat: ???
```

---

## Pala 2: Cache-laajennus server.js

**Tavoite:** Laajentaa CACHE_OBJECTS-taulukkoa uusilla kentilla.

**Edellytys:** Pala 1 valmis (tiedetaan kenttanimet)

**Tehtavat:**
- [ ] Paivita CACHE_OBJECTS opportunities-rivi: lisaa palan 1 loydokset
- [ ] Paivita CACHE_OBJECTS accounts-rivi: lisaa palan 1 loydokset
- [ ] Lisaa users CACHE_OBJECTS:iin
- [ ] Lisaa contacts CACHE_OBJECTS:iin (jos tarpeen)
- [ ] Testaa: pm2 restart, cache refresh, tarkista JSON

**Muutettavat tiedostot:** server.js (rivit ~151-156, CACHE_OBJECTS)

**Muutoksen koko:** ~5-10 rivia muutettu

**Testaus palvelimella:**
```bash
ssh root@212.47.232.1
pm2 restart lunni-dashboard
# Odota minuutti
cat /root/dashboard/cache/*/opportunities.json | python3 -m json.tool | head -30
```

---

## Pala 3: sales_config.json rakenne

**Tavoite:** Config-tiedoston rakenne ja server.js lataus/tallennus. Sama pattern kuin scorecard_config.json.

**Edellytys:** Ei edellytyksia

**Tehtavat:**
- [ ] Suunnittele sales_config.json rakenne (alla)
- [ ] Lisaa server.js: loadSalesConfig(), saveSalesConfig(), getDefaultSalesConfig()
- [ ] Lisaa reitit: GET/POST /api/sales/config
- [ ] Roolirajoitus: vain admin/manager

**Muutettavat tiedostot:** server.js (+40-60 rivia)

**Muutoksen koko:** Pieni -- kopioi scorecard_config-pattern

### sales_config.json rakenne

```json
{
  "ORG_ID": {
    "business_units": [
      {
        "id": "bu-1",
        "name": "Teollisuus",
        "manager_email": "markku@lunni.click",
        "color": "#4f9cf9"
      }
    ],
    "account_targets": {
      "ACCOUNT_ID": {
        "name": "Kemppi Group Oy",
        "potential": 200000,
        "yearly_target": 220000,
        "monthly_targets": {
          "2026-01": 15000,
          "2026-02": 15000
        },
        "bu_split": {
          "bu-1": 120000,
          "bu-2": 60000
        }
      }
    },
    "seller_targets": {
      "markku@lunni.click": {
        "type": "fixed",
        "yearly_target": 300000,
        "monthly_targets": {
          "2026-01": 25000,
          "2026-02": 25000
        }
      },
      "valtteri@lunni.click": {
        "type": "calculated"
      }
    },
    "snapshot_enabled": true
  }
}
```

---

## Pala 4: Sales API — summary + monthly

**Tavoite:** Kaksi endpointtia jotka laskevat myyntidatan cachesta.

**Edellytys:** Pala 2 valmis

**Tehtavat:**
- [ ] GET /api/sales/summary?period=month&year=2026&month=3
  - Palauttaa: total_sales, total_margin, deal_count, win_rate, pipeline_value
  - Laskee: cachesta opp:t joiden closedate osuu periodille ja stage=won
- [ ] GET /api/sales/monthly?year=2026
  - Palauttaa: 12 kk taulukko: actual, target (configista), margin
- [ ] Periodivalinnat: week, month, quarter, year
- [ ] Vuosivertailu: ed. vuoden luvut mukaan

**Muutettavat tiedostot:** server.js (+80-120 rivia)

**Testaus:**
```bash
curl localhost:3000/api/sales/summary?period=month&year=2026&month=3
curl localhost:3000/api/sales/monthly?year=2026
```

---

## Pala 5: Sales API — by-bu + by-person + by-account

**Tavoite:** Kolme ryhmiteltya endpointtia.

**Edellytys:** Pala 4 valmis

**Tehtavat:**
- [ ] GET /api/sales/by-bu?year=2026
  - Ryhmattelee: myynti per business_unit
  - Palauttaa: [{bu_name, sales, margin, deals, target}]
- [ ] GET /api/sales/by-person?period=month&year=2026&month=3
  - Ryhmattelee: myynti per responsibility/owner
  - Palauttaa: [{name, sales, target, margin, deals, hit_rate}]
- [ ] GET /api/sales/by-account?year=2026
  - Ryhmattelee: myynti per account
  - Palauttaa: [{account_name, this_year, last_year, change_pct, pipeline, potential}]
  - Sisaltaa: last_contact_date

**Muutettavat tiedostot:** server.js (+100-140 rivia)

---

## Pala 6: Sales API — roolisuodatus

**Tavoite:** Lisata kaikkiin palojen 4-5 endpointteihin roolipohjainen datasuodatus.

**Edellytys:** Palat 4-5 valmiit

**Tehtavat:**
- [ ] Admin/superadmin: kaikki data
- [ ] Manager: filtteroi BU:n mukaan (sales_configista)
- [ ] User (myyja): filtteroi opp:t joiden responsibility = oma id
- [ ] ?person= parametri: manager/admin voi katsoa yksittaista myyjaa

**Muutettavat tiedostot:** server.js (muokkaa paloja 4-5, +30-50 rivia)

---

## Pala 7: sales_dashboard.html pohja

**Tavoite:** HTML-tiedoston runko: nav, period-bar, latausanimaatio, API-kutsu. Kopioi crm_dashboard.html -rakenne.

**Edellytys:** Ei edellytyksia (API voi olla stubbattu)

**Tehtavat:**
- [ ] Kopioi crm_dashboard.html pohja
- [ ] Paivita nav: otsikko "Myynti", linkit
- [ ] Period-bar: Viikko/Kk/Q/Vuosi + navigaatio + Mittaristo/Top-listat tabs
- [ ] Latausanimaatio
- [ ] fetchData()-funktio (kutsuu /api/sales/summary + monthly)
- [ ] Lisaa reitti server.js: /sales -> serveHTMLFile('sales_dashboard.html')
- [ ] Testaa: sivu latautuu, teema injektoituu

**Muutettavat tiedostot:** sales_dashboard.html (UUSI ~200 rivia), server.js (+3 rivia)

---

## Pala 8: sales_dashboard.html gauget + KPI-kortit

**Tavoite:** 5 KPI-korttia ja 4 gauge-mittaria.

**Edellytys:** Palat 4 + 7 valmiit

**Tehtavat:**
- [ ] 5 KPI-korttia: myynti, kate, kaupat kpl, hit rate, pipeline
- [ ] 4 Gauge-mittaria (scorecardin SVG-tyyli):
  - Kokonaismyynti vs tavoite
  - Kate vs tavoite
  - Myyja 1 henk.tavoite
  - Myyja 2 henk.tavoite
- [ ] Varikoodaus: vihrea 70%+, oranssi 31-69%, punainen 0-30%
- [ ] Responsiivinen

**Muutettavat tiedostot:** sales_dashboard.html (+300-400 rivia)

---

## Pala 9: sales_dashboard.html kaaviot + taulukot

**Tavoite:** Histogrammi, donitsi, top-listat. Chart.js.

**Edellytys:** Palat 5 + 8 valmiit

**Tehtavat:**
- [ ] Kuukausihistogrammi (Chart.js bar): myynti vs tavoite, 12 kk
- [ ] BU-donitsi (Chart.js doughnut)
- [ ] Top myyjat -taulukko: nimi, myynti, tavoite, kate, kaupat, toteuma%
- [ ] Top asiakkaat -taulukko: nimi, tama vuosi, ed.vuosi, muutos%
- [ ] 12kk trendi (Chart.js line)
- [ ] Tab-vaihto: Mittaristo / Top-listat

**Muutettavat tiedostot:** sales_dashboard.html (+400-500 rivia)

---

## Pala 10: Customer API — activity + silent + churn

**Tavoite:** API-endpointit asiakasnakyiille.

**Edellytys:** Pala 2 valmis

**Tehtavat:**
- [ ] GET /api/customers/activity?period=month&year=2026&month=3
  - Per asiakas: viimeisin aktiviteetti, ikonityypit, orb-data per paiva
  - Orb-data: paiva -> pct (empty/red/orange/green/star)
- [ ] GET /api/customers/silent?period=month&year=2026&month=3
  - Asiakkaat joilla 0 aktiviteettia
- [ ] GET /api/customers/churn-risk
  - Asiakkaat jotka EIVAT ole ostaneet: 3kk, 6kk, 9kk, 12kk luokat

**Muutettavat tiedostot:** server.js (+120-160 rivia)

---

## Pala 11: customer_dashboard.html pohja + aktiiviset

**Tavoite:** Asiakasseurannan perusrakenne ja aktiiviset-nakyma scorecard-tyylisella orb-rivilla.

**Edellytys:** Pala 10 valmis

**Tehtavat:**
- [ ] Sivupohja: nav, period-bar (Viikko/Kk/Vuosi), tab-bar (Aktiiviset/Hiljaiset/Poistuma)
- [ ] Reitti server.js: /customers -> serveHTMLFile('customer_dashboard.html')
- [ ] Aktiiviset-nakyma:
  - Taulukko: Asiakas | Orb-rivi (pallot+tahdet) | Tulos | Toimet-ikonit
  - Varikoodaus: 1-30% pun, 31-69% oran, 70-99% vihr, 100%+ tahti
  - Aktiviteetti-ikonit: puhelu, tapaaminen, tarjous, kauppa, uusi, markkinointi
- [ ] Vuosi-nakymassa: pienemmät orbit (14px), 52 kpl per rivi

**Muutettavat tiedostot:** customer_dashboard.html (UUSI ~600 rivia), server.js (+3 rivia)

---

## Pala 12: customer_dashboard.html hiljaiset + poistumariski

**Tavoite:** Kaksi lisanakymaa samaan sivuun.

**Edellytys:** Pala 11 valmis

**Tehtavat:**
- [ ] Hiljaiset: sama taulukko, orb-rivi kokonaan tyhjia, viimeisin yhteys
- [ ] Poistumariski: 3kk varoitus, 6kk huomio, 9kk kriittinen, 12kk menetetty
  - Ryhmittely badge-komponenteilla
  - Per asiakas: nimi, viimeisin osto, euromaara, orb-rivi

**Muutettavat tiedostot:** customer_dashboard.html (+300-400 rivia)

---

## Pala 13: targets_admin.html asiakastavoitteet

**Tavoite:** Hallintapaneelin ensimmainen valilehti.

**Edellytys:** Pala 3 valmis

**Tehtavat:**
- [ ] Sivupohja: 4 tabia (Asiakastavoitteet / BU / Myyjatavoitteet / Potentiaalit)
- [ ] Reitti server.js: /sales/targets -> serveHTMLFile('targets_admin.html')
- [ ] Asiakas-dropdown (cachesta)
- [ ] 12 kuukausi-inputtia per asiakas
- [ ] Vuositavoite = summa (automaattinen)
- [ ] BU-jako: tavoitteen pilkkominen
- [ ] Tallenna -> POST /api/sales/config
- [ ] Roolirajoitus: admin/manager

**Muutettavat tiedostot:** targets_admin.html (UUSI ~500 rivia), server.js (+5 rivia)

---

## Pala 14: targets_admin.html BU + myyjatavoitteet

**Tavoite:** Loput valilehdet.

**Edellytys:** Pala 13 valmis

**Tehtavat:**
- [ ] BU-hallinta: lista, manager-dropdown, oletusmyyja, lisaa/poista
- [ ] Myyjatavoitteet: lista, kiintea/laskennallinen, kk-inputit
- [ ] Potentiaalit: taulukko, asiakas, tama vuosi, potentiaali input, ero, palkki

**Muutettavat tiedostot:** targets_admin.html (+400-500 rivia)

---

## Pala 15: sales_embed.html + embed-reitit

**Tavoite:** Iframe-versio myyntimittaristosta. Sama pattern kuin scorecard_embed.

**Edellytys:** Palat 8-9 valmiit

**Tehtavat:**
- [ ] Kopioi scorecard_embed.html rakenne
- [ ] Token URL-parametrissa
- [ ] GET /api/embed/sales?token=X&period=month&person=Nimi
- [ ] Reitit: /sales-embed + /widget-sales-embed
- [ ] serveHTMLFileForEmbed (X-Frame-Options)
- [ ] Kompakti: gauget + KPI (ei kaavioita)

**Muutettavat tiedostot:** sales_embed.html (UUSI ~500 rivia), server.js (+30 rivia)

---

## Pala 16: customer_embed.html + embed-reitit

**Tavoite:** Iframe-versio asiakasseurannasta.

**Edellytys:** Palat 11-12 valmiit

**Tehtavat:**
- [ ] Kopioi scorecard_embed.html rakenne
- [ ] Token URL:ssa, /customer-embed + /widget-customer-embed
- [ ] GET /api/embed/customers?token=X&period=month
- [ ] Kompakti: aktiivisuuslista + hiljaiset

**Muutettavat tiedostot:** customer_embed.html (UUSI ~500 rivia), server.js (+30 rivia)

---

## Pala 17: Snapshot-mekanismi

**Tavoite:** Automaattinen paivittainen tilannekuva.

**Edellytys:** Palat 4-5 valmiit

**Tehtavat:**
- [ ] snapshots/ kansio per org
- [ ] Formaatti: snapshots/{orgId}/{date}.json
- [ ] Sisalto: per myyja per asiakas: ytd_sales, ytd_margin, won_count, pipeline
- [ ] Lisaa cron klo 02:00: snapshot-tallennus
- [ ] GET /api/sales/snapshot?date=2026-03-01
- [ ] GET /api/sales/snapshot/compare?from=...&to=...

**Muutettavat tiedostot:** server.js (+60-80 rivia)

---

## Pala 18: Viimeistely + README paivitys

**Tavoite:** Kaikki yhdessa, README paivitetty.

**Edellytys:** Kaikki palat 1-17

**Tehtavat:**
- [ ] Paivita README.md: uudet sivut, reitit, API:t, tiedostorakenne
- [ ] Nav-linkit kaikkiin HTML-sivuihin: /sales, /customers, /sales/targets
- [ ] Testaa roolit: admin, manager, user
- [ ] Testaa teemat: light + dark
- [ ] Testaa embedit
- [ ] scp palvelimelle + pm2 restart

**Muutettavat tiedostot:** README.md, dashboard.html, kaikki HTML (nav-linkit)

---

## Tiedostorakenne tavoitetila

```
/root/dashboard/
  server.js                 +400 rivia (palat 2-6, 10, 15-17)
  dashboard.html            nav-paivitys (pala 18)
  crm_dashboard.html        nav-paivitys (pala 18)
  fsm_dashboard.html        nav-paivitys (pala 18)
  map_dashboard.html        nav-paivitys (pala 18)
  scorecard.html            nav-paivitys (pala 18)
  scorecard_embed.html      ei muutoksia
  scorecard_targets.html    ei muutoksia
  scorecard_help.html       ei muutoksia
  sales_dashboard.html      UUSI (palat 7-9)
  sales_embed.html          UUSI (pala 15)
  customer_dashboard.html   UUSI (palat 11-12)
  customer_embed.html       UUSI (pala 16)
  targets_admin.html        UUSI (palat 13-14)
  widget_wizard.html        ei muutoksia
  widget_dashboard.html     ei muutoksia
  theme-light.css           ei muutoksia
  theme-dark.css            ei muutoksia
  db.json                   ei muutoksia
  scorecard_config.json     ei muutoksia
  sales_config.json         UUSI (pala 3)
  snapshots/                UUSI kansio (pala 17)
    {orgId}/
      2026-03-03.json
  cache/                    laajennettu (pala 2)
    {orgId}/
      opportunities.json    laajennetut kentat
      accounts.json         laajennetut kentat
      users.json            UUSI
  IMPLEMENTATION_PLAN.md    UUSI (tama tiedosto)
  README.md                 paivitetty (pala 18)
```

---

## Commit-kaytanto

```
git add -A
git commit -m "Pala X: [lyhyt kuvaus]"
git push
```

Esimerkki:
```
git commit -m "Pala 1: API-kenttakartoitus - opportunities, accounts, users"
git commit -m "Pala 2: Cache-laajennus - opp + accounts + users kentat"
git commit -m "Pala 7: sales_dashboard.html pohja + nav + period-bar"
```

---

## Muistiinpanot per sessio

### Sessio 1 (3.3.2026) — Suunnittelu
- Arkkitehtuuri ja roadmap suunniteltu
- Layout-mockupit luotu (React JSX: lunni360-layouts.jsx)
- Tama toteutussuunnitelma luotu
- Koodipohja analysoitu: server.js 1587 rivia, vanilla HTML/CSS/JS
- Nykyinen CACHE_OBJECTS: workorders, serviceschedules, opportunities (suppea), accounts (suppea)
- Scorecardin gauge/orb/tahti-tyyli dokumentoitu mockuppeihin
- Seuraava: Pala 1 (API-kenttien kartoitus)

### Sessio 2 — (paivamaara)
- (kirjoita tahan mita tehtiin)
- (mika pala valmistui)
- (mita ongelmia tuli vastaan)
- Seuraava: Pala X
