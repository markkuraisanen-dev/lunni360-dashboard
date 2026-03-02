# Lunni360 KPI Dashboard — Projektidokumentaatio
## Versio 6.0 — Aktiviteettien luokittelu korjattu + iframe Lunni360:ssa
Viimeksi päivitetty: 2.3.2026

---

## Miten jatkat seuraavalla kerralla (LUE TÄMÄ ENSIN)

1. Avaa uusi Claude-keskustelu
2. Kirjoita: **"Jatketaan Lunni360 KPI -projektin kehitystä. README liitteenä."**
3. Liitä tämä README tiedosto mukaan
4. Ensimmäinen tehtävä: katso **Roadmap** -osio alhaalla

---

## Projektin tila

| Asia | Tila |
|---|---|
| Palvelin (Scaleway) | ✅ Käynnissä |
| Kirjautuminen + sessiot | ✅ Valmis |
| Multi-tenant (orgs) | ✅ Valmis |
| Super Admin -paneeli | ✅ Valmis |
| Käyttäjien lisäys/poisto/muokkaus | ✅ Valmis |
| Esimies (manager) -rooli | ✅ Valmis |
| Lunni-käyttäjänimi-kenttä | ✅ Valmis |
| CRM-mittaristo | ✅ Valmis |
| FSM-mittaristo | ✅ Valmis |
| Karttanäkymä | ✅ Valmis |
| Widget-wizard (AI) | ✅ Valmis |
| Scorecard-proxy (aktiviteetit) | ✅ Valmis — /api/scorecard/data |
| Scorecard HTML (tähti/pallo) | ✅ Valmis — DM Sans, vaalea teema |
| Scorecard kuukausinäkymä | ✅ Valmis — pallot, tähdet, gauget |
| Scorecard päivänäkymä | ✅ Valmis — arc + 4 korttia |
| Scorecard viikkonäkymä | ✅ Valmis — ma-pe yhteenveto |
| Päivä/Viikko/Kuukausi-navigaatio | ✅ Valmis — unified control bar |
| Saavutukset (pelillistäminen) | ✅ Valmis — tasot, merkit, streak, tähdet |
| Myyjävalitsin (esimies/admin) | ✅ Valmis — dropdown per org-käyttäjä |
| Tavoitteiden asetus (esimies) | ✅ Valmis — /scorecard/targets |
| Scorecard ohje-sivu | ✅ Valmis — /scorecard/help |
| Teemajärjestelmä (2 teemaa) | ✅ Valmis — vaalea/tumma, admin valitsee |
| Teema CSS-injektio | ✅ Valmis — palvelin injektoi per org |
| HTTPS (Cloudflare Tunnel) | ✅ Valmis — PM2:n alla 24/7 |
| Scorecard iframe-embed | ✅ Valmis — /scorecard-embed |
| Embed API proxy | ✅ Valmis — /api/embed/scorecard |
| iframe-integraatio Lunni360:ssa | ✅ Valmis — testattu ja toimii 2.3.2026 |
| Widget-scorecard-embed reitti | ✅ Valmis — Lunni360 lisää /widget- etuliitteen |
| Aktiviteettien luokittelu (subject) | ✅ Valmis — puhelut, tehtävät, sähköpostit eroteltu 2.3.2026 |
| Toast-viestit (motivaatio) | 🔜 Seuraava |
| 5 min polling | 🔜 Tulossa |
| Esimiehen tiimitaulukko | 🔜 Tulossa |
| Oma domain (kpi.lunni.fi) | 🔜 Tulossa (korvaa Quick Tunnel) |
| SMS-aktiviteettien seuranta | 🔜 Tulossa (roadmapille lisätty 2.3.2026) |

---

## Infrastruktuuri

- **Palvelin**: Scaleway DEV1-S, Paris 1 (EU/Ranska, GDPR)
- **IP-osoite**: 212.47.232.1
- **Käyttöjärjestelmä**: Ubuntu 24.04 LTS
- **Node.js**: v20.20.0
- **Prosessinhallinta**: PM2 (autostart, 24/7)
- **HTTPS**: Cloudflare Tunnel (Quick Tunnel, PM2:n alla)
- **Hinta**: ~€6.50/kk (palvelin) + Cloudflare ilmainen

### PM2-prosessit

| Prosessi | Kuvaus |
|---|---|
| lunni-dashboard | Node.js palvelin (port 3000) |
| cloudflare-tunnel | HTTPS-tunneli → localhost:3000 |

---

## Tiedostorakenne palvelimella

```
/root/dashboard/
├── server.js              ← Pääpalvelin (~1450 riviä, kaikki API:t + reititys + teemainjektio)
├── dashboard.html         ← Etusivu/dashboard
├── crm_dashboard.html     ← CRM-mittaristo
├── fsm_dashboard.html     ← FSM-mittaristo
├── map_dashboard.html     ← Karttanäkymä
├── scorecard.html         ← Scorecard (päivä/viikko/kk + saavutukset) — vaatii kirjautumisen
├── scorecard_embed.html   ← Scorecard iframe-versio (ei navbaria/loginia, token URL:ssä)
├── scorecard_targets.html ← Tavoitteiden asetus (esimies/admin)
├── scorecard_help.html    ← Scorecard ohje-sivu
├── widget_wizard.html     ← Widget AI -wizard
├── widget_dashboard.html  ← Widget-dashboard
├── theme-light.css        ← Vaalea teema (DM Sans, oletus)
├── theme-dark.css         ← Tumma teema (DM Mono + DM Serif Display)
├── ecosystem.config.js    ← PM2 + ANTHROPIC_API_KEY
├── db.json                ← Tietokanta (käyttäjät, orgit, asetukset)
├── scorecard_config.json  ← Scorecard-tavoitteet per org
└── cache/                 ← API-cache per organisaatio
```

## Tiedostorakenne omalla koneella

```
/Users/meamartair1/Desktop/Koodaus by MR/
├── server.js
├── dashboard.html
├── crm_dashboard.html
├── fsm_dashboard.html
├── map_dashboard.html
├── scorecard.html
├── scorecard_embed.html
├── scorecard_targets.html
├── scorecard_help.html
├── widget_wizard.html
├── widget_dashboard.html
├── theme-light.css
├── theme-dark.css
└── README.md
```

---

## Osoitteet

### Sisäiset (vaatii kirjautumisen)

| Osoite | Kuvaus |
|---|---|
| http://212.47.232.1:3000 | Dashboard |
| http://212.47.232.1:3000/superadmin | Super Admin |
| http://212.47.232.1:3000/crm | CRM Mittaristo |
| http://212.47.232.1:3000/fsm | FSM Mittaristo |
| http://212.47.232.1:3000/map | Karttanäkymä |
| http://212.47.232.1:3000/scorecard | Scorecard |
| http://212.47.232.1:3000/scorecard/targets | Tavoitteet (esimies/admin) |
| http://212.47.232.1:3000/scorecard/help | Scorecard ohje |
| http://212.47.232.1:3000/widgets | Widget-wizard |
| http://212.47.232.1:3000/login | Kirjautuminen |

### HTTPS (Cloudflare Tunnel)

| Osoite | Kuvaus |
|---|---|
| https://zoo-outsourcing-filme-ministries.trycloudflare.com | Kaikki sama kuin yllä, HTTPS |
| https://zoo-outsourcing-filme-ministries.trycloudflare.com/scorecard-embed?token=XXX | Scorecard iframe (ei vaadi sessiota) |

**HUOM:** Quick Tunnel -URL vaihtuu jos PM2 käynnistää cloudflare-tunnel-prosessin uudelleen. Tarkista aina uusi URL: `pm2 logs cloudflare-tunnel --lines 20`

Myöhemmin korvataan omalla domainilla (esim. kpi.lunni.fi) → pysyvä URL.

---

## Palvelimen hallinta

### Kaksi paikkaa — älä sekoita!

| Missä olet | Näet rivin alussa | Käyttö |
|---|---|---|
| **Mac Terminal** | `MacBook-Air-2:~ meamartair1$` | scp-komennot (tiedostojen siirto), paikallinen työ |
| **Palvelin (SSH)** | `root@lunni360-dashboard:~#` | pm2, sed, curl, palvelimen hallinta |

### Yhteys palvelimelle
```bash
# Macin Terminalissa:
ssh root@212.47.232.1
# → Odota kunnes näet: root@lunni360-dashboard:~#
```

### PM2-komennot (PALVELIMELLA)
```bash
pm2 status
pm2 restart lunni-dashboard
pm2 restart cloudflare-tunnel
pm2 logs lunni-dashboard --lines 30
pm2 logs cloudflare-tunnel --lines 20   # ← Tästä näet HTTPS-URL:n
```

### Tiedostojen siirto (MACILLA, EI palvelimella!)
```bash
# Kopioi KAIKKI tiedostot palvelimelle:
scp "/Users/meamartair1/Desktop/Koodaus by MR/server.js" "/Users/meamartair1/Desktop/Koodaus by MR/scorecard_embed.html" "/Users/meamartair1/Desktop/Koodaus by MR/theme-light.css" "/Users/meamartair1/Desktop/Koodaus by MR/theme-dark.css" "/Users/meamartair1/Desktop/Koodaus by MR/scorecard.html" "/Users/meamartair1/Desktop/Koodaus by MR/scorecard_targets.html" "/Users/meamartair1/Desktop/Koodaus by MR/scorecard_help.html" "/Users/meamartair1/Desktop/Koodaus by MR/crm_dashboard.html" "/Users/meamartair1/Desktop/Koodaus by MR/fsm_dashboard.html" "/Users/meamartair1/Desktop/Koodaus by MR/dashboard.html" "/Users/meamartair1/Desktop/Koodaus by MR/map_dashboard.html" "/Users/meamartair1/Desktop/Koodaus by MR/widget_wizard.html" "/Users/meamartair1/Desktop/Koodaus by MR/widget_dashboard.html" root@212.47.232.1:/root/dashboard/ && ssh root@212.47.232.1 "pm2 restart lunni-dashboard && echo VALMIS"

# Lataa palvelimelta Macille:
scp root@212.47.232.1:/root/dashboard/server.js ~/Desktop/server.js
# → Tiedosto ilmestyy Macin Desktopille (Työpöydälle)
```

TÄRKEÄÄ: scp-komento ajetaan aina Mac-terminaalissa, ei palvelimella.
Jos olet SSH:lla palvelimella, kirjoita ensin: exit

---

## Käyttäjäroolit

```javascript
org.users[email] = {
  email, name, password,
  role: "user" | "manager" | "admin",
  lunniUserName: "Matti Virtanen",  // koko nimi kuten Lunni360 /users name-kentässä
  created
}
```

| Rooli | Näkee | Erityisoikeudet |
|---|---|---|
| user (myyjä) | Vain omat aktiviteetit | — |
| manager (esimies) | Oman tiimin + myyjävalitsin | Tavoitteiden asetus |
| admin | Koko organisaatio + myyjävalitsin | Tavoitteet + kaikki käyttäjät |

---

## Lunni API

- **Base URL**: https://apiv3.lunni.io
- **Autentikaatio**: Bearer token (db.json per organisaatio)
- **Token toimii**: kyllä (testattu 2.3.2026)

### Tärkeät endpointit
- /users — name-kenttä = koko nimi, id = person_id aktiviteeteissa
- /activities — activity_type, begins (ISO8601), status, person_id, name (= subject-kenttä)
- /usergroups — supervisor_id viittaa users.id:hen
- /opportunities — CRM
- /workorders — FSM

### Lunni API status-kentät (TÄRKEÄ — selvitetty debuggaamalla)
Status-arvot ovat pitkiä käännösavaimia, EI lyhyitä kuten "ready":
```
Valmis task/call = "{{{TRANSLATE_CONTENT}}}picklist_task_status_ready"
Avoin task/call  = "{{{TRANSLATE_CONTENT}}}picklist_task_status_open"
Lähetetty email  = "{{{TRANSLATE_CONTENT}}}picklistsystemvalue_email_sent"
```
Koodissa käytetään: `status.includes('ready')`, `status.includes('sent')` jne.

### Lunni API rajoitukset (TÄRKEÄ — selvitetty 1.3.2026)
- **EI tue päivämäärärajausta** query-parametreilla (begins_start, created_start jne. eivät toimi)
- Ratkaisu: haetaan KAIKKI aktiviteetit `fetchAllPages`-funktiolla ja suodatetaan palvelimella
- Aktiviteettidata haetaan 1000 riviä/sivu, kaikki sivut peräkkäin
- Päivämäärät muotoa: "2019-10-30 13:39:49" (välilyönti, ei ISO T)

### Aktiviteettien luokittelu (TÄRKEÄ — korjattu 2.3.2026)

Lunni API:ssa kaikki puhelut, tehtävät ja sähköpostit ovat `activity_type: "task"`. Ne erotetaan toisistaan **`name`-kentän** (= subject picklist-arvo) perusteella:

| name-kentän arvo (sisältää) | Kategoria | UI-label | Ikoni |
|---|---|---|---|
| `subject_call` | call | Soitot | 📞 |
| `subject_task` | task | Tehtävät | ✅ |
| `subject_email` | email | Sähköpostit | 📧 |
| `subject_sms` | (ei vielä tuettu) | SMS | 📱 |
| — (activity_type = "event") | event | Tapaamiset | 🤝 |

**Lunni360 hallintapaneelissa** (Objektit → Tehtävät → Tyyppi-kenttä):
- Tunniste: `subject`
- Tyyppi: Valintaluettelo
- Listan arvot: Puhelu, Sähköposti, Tehtävä, SMS

**API palauttaa name-kentässä** picklist-arvon muodossa:
```
"{{{TRANSLATE_CONTENT}}}picklist_task_subject_call"    → Puhelu
"{{{TRANSLATE_CONTENT}}}picklist_task_subject_task"     → Tehtävä
"{{{TRANSLATE_CONTENT}}}picklist_task_subject_email"    → Sähköposti (oletettu, varmista)
```

**Koodissa** luokittelu (server.js, kaksi kohtaa: embed API ~rivi 675 ja scorecard API ~rivi 1160):
```javascript
if (actType === 'task') {
  if (subject.includes('subject_call')) category = 'call';
  else if (subject.includes('subject_email')) category = 'email';
  else category = 'task';
}
```

**TÄRKEÄÄ:** `name`-kenttä pitää hakea API:sta eksplisiittisesti fields-parametrissa:
- fetchAllPages: `'id,activity_type,status,begins,updated,person_id,name'`
- fetchLunniJSON: `fields=id,activity_type,status,begins,updated,name`

### Aktiviteettidata
- activity_type-arvot: "task" (kattaa puhelut, tehtävät, sähköpostit, SMS), "event" (tapaamiset)
- Demodata vuosilta 2018–2024
- Tuotantodata helmikuusta 2026 alkaen

---

## iframe-integraatio — Arkkitehtuuri

### Miten toimii
1. Cloudflare Tunnel tarjoaa HTTPS-osoitteen palvelimelle (PM2:n alla)
2. Lunni360 upottaa `scorecard_embed.html` iframeen Widget-laajennuksena
3. API-token välitetään URL-parametrina — ei erillistä kirjautumista
4. Embed-sivu kutsuu `/api/embed/scorecard` → palvelin hakee Lunni API:sta ja suodattaa
5. Teema injektoidaan palvelimelta (`?theme=light|dark`)

### Kaksi erillistä sivua
- **scorecard.html** — täysi dashboard-versio, vaatii kirjautumisen, navbar mukana
- **scorecard_embed.html** — kevennetty iframe-versio, ei navbaria/loginia, token URL:ssä

Molemmat toimivat rinnakkain. Kumpikaan ei vaikuta toiseen.

### Embed URL-parametrit
| Parametri | Kuvaus | Esimerkki |
|---|---|---|
| token | Lunni API Bearer token (PAKOLLINEN) | ?token=eyJ0eXAi... |
| person | Käyttäjän koko nimi Lunnissa | &person=Markku+Räisänen |
| theme | Teema (light/dark, oletus light) | &theme=dark |
| start | Aikavälin alku YYYY-MM-DD | &start=2026-02-01 |
| end | Aikavälin loppu YYYY-MM-DD | &end=2026-02-28 |

### Embed API: /api/embed/scorecard
```
GET /api/embed/scorecard?token=BEARER&start=2026-02-01&end=2026-02-28&person=Markku+Räisänen
```
- Ei vaadi sessiota — token tulee query-parametrina
- Hakee kaikki aktiviteetit Lunni API:sta (fetchAllPages, kaikki sivut)
- Suodattaa palvelimella: päivämäärä + henkilö + status
- Palauttaa: `{ counts: {task, call, email, event, total}, daily: {...}, total, start, end }`

### Turvallisuus
- Token URL:ssä = OK koska Lunni360 iframe on HTTPS
- `X-Frame-Options: ALLOWALL` sallii iframen (vain embed-reitillä)
- `Content-Security-Policy: frame-ancestors *` (voi myöhemmin rajoittaa: `*.lunni.io`)
- Normaali dashboard EI salli iframea (ei näitä headereita)

### Lunni360 Widget-konfiguraatio (hallintapaneelissa)

**Miten Lunni360 widget-järjestelmä toimii (selvitetty 2.3.2026):**
- `param`-kenttä = Lunni360:n sisäinen polku. Lunni360 lisää automaattisesti `/widget-` etuliitteen.
- `URL`-kenttä = iframen src sellaisenaan. Lunni360 EI lisää polkua eikä tokenia automaattisesti.
- Eli param `/scorecard-embed` → Lunni360 tekee sisäisen reitin `/widget-scorecard-embed`
- Iframe src tulee suoraan URL-kentästä

**Toimiva konfiguraatio (ScorecardTEST, testattu 2.3.2026):**

| Kenttä | Arvo |
|---|---|
| title | ScorecardTEST |
| color | 🟢 (vihreä) |
| param | `/scorecard-test1` |
| URL | `https://zoo-outsourcing-filme-ministries.trycloudflare.com/scorecard-embed?token=BEARER_TOKEN_TÄHÄN` |

**TÄRKEÄÄ:** Token pitää laittaa manuaalisesti URL-kenttään muodossa `?token=XXX`. Lunni360 EI lisää tokenia automaattisesti (testattu 2.3.2026).

**Palvelimen reitit jotka tukevat iframea:**
- `/scorecard-embed` — alkuperäinen reitti
- `/widget-scorecard-embed` — lisätty 2.3.2026, koska Lunni360 lisää `/widget-` etuliitteen param-kenttään

**Selvitettävää arkkitehdiltä:**
- Onko mahdollista saada Lunni360 välittämään kirjautuneen käyttäjän API-token iframelle automaattisesti? Nykyisellään token pitää kovakoodata widget-URL:iin.
- Onko mahdollista saada `kpi.lunni.fi` subdomain osoittamaan palvelimelle?

---

## Scorecard — arkkitehtuuri

### API: /api/scorecard/data (kirjautuneille käyttäjille)
```
GET /api/scorecard/data?start=2025-07-01&end=2025-07-31&person=Markku+Räisänen
```
- **start/end**: YYYY-MM-DD päivämääräväli
- **person**: lunniUserName (vain esimies/admin voi käyttää)
- **month**: YYYY-MM (vanha, backward compatible)
- **debug=1**: palauttaa uniqueTypes, uniqueStatuses, samples

### Scorecard-näkymät
- **Päivä**: Arc-progress ympyrä + 4 aktiviteettikorttia + pallo/tähti-rivi
- **Viikko**: Orb-taulukko (5 palloa/rivi) + gauget. Tavoitteet ×5.
- **Kuukausi**: Orb-taulukko (20 palloa/rivi) + gauget. Tavoitteet ×20.

### Saavutukset-välilehti
- Yhteenvetokortti (aktiviteetit, tähdet, putki, pisteet)
- Per-trackable kortit (skaalattu aikajaksoon)
- 6 tasoa: Aloittelija (0), Aktiivinen (100), Taitava Tekijä (300), Kokenut Tekijä (600), Mestari (1000), Legenda (2000)
- Streak + milestone-palkki (3, 5, 7, 10, 14, 21 pv)
- 7 ansaintamerkkiä × 4 tasoa (pronssi/hopea/kulta/timantti)

### Pallo/tähti-värit
- Tyhjä: tuleva päivä. ⚪ Muted: 0 kirjausta.
- 🔴 1–30 %. 🟠 31–69 %. 🟢 70–99 %. ⭐ 100 %+

---

## Teemajärjestelmä

### Miten toimii
1. Admin valitsee teeman: Super Admin → Org → Asetukset → Teema
2. `org.theme` tallennetaan db.json:iin ("light" tai "dark")
3. Palvelin injektoi `<link href="/theme-{light|dark}.css">` jokaiseen HTML-sivuun
4. CSS ylikirjoittaa HTML:n sisäiset :root-muuttujat (koska ladataan viimeisenä)
5. Kaikki sivut päivittyvät yhdellä muutoksella
6. Embed-sivu: teema voidaan antaa myös URL-parametrilla `?theme=dark`

### Teematiedostot
- **theme-light.css**: DM Sans, #f7f6f3 tausta, #4f9cf9 aksentti (OLETUS)
- **theme-dark.css**: DM Mono + Serif Display, #0d0f14 tausta, #c8f060 aksentti

### Hienosäätö
Muokkaa VAIN CSS-tiedostoa → muutos näkyy automaattisesti kaikilla sivuilla.

---

## Demo-organisaatio käyttäjät

| Nimi | Sähköposti | Salasana | Rooli | Lunni-nimi |
|---|---|---|---|---|
| Henri Hiljanen | henri.hiljanen@lunni.fi | ? | admin | — |
| Valtteri Korolainen | valtteri.korolainen@lunni.fi | ? | manager | Valtteri Korolainen |
| Markku Räisänen | markku@lunni.click | Makedemo2023 | user | Markku Räisänen |

Super Admin: markku@lunni.click / Makedemo2023

---

## Roadmap

### ✅ VALMIS

| # | Tehtävä | Valmis |
|---|---|---|
| 1 | Palvelin + Node.js + PM2 | ✅ |
| 2 | Kirjautuminen + sessiot | ✅ |
| 3 | Multi-tenant organisaatiot | ✅ |
| 4 | Super Admin -paneeli | ✅ |
| 5 | Käyttäjien CRUD | ✅ |
| 6 | Esimies-rooli + myyjävalitsin | ✅ |
| 7 | Lunni-käyttäjänimi-kenttä | ✅ |
| 8 | CRM-mittaristo | ✅ |
| 9 | FSM-mittaristo | ✅ |
| 10 | Karttanäkymä | ✅ |
| 11 | Widget-wizard (AI) | ✅ |
| 12 | Scorecard-proxy API | ✅ |
| 13 | Scorecard päivä/viikko/kk-näkymät | ✅ |
| 14 | Saavutukset (pelillistäminen) | ✅ |
| 15 | Tavoitteiden asetus | ✅ |
| 16 | Teemajärjestelmä (vaalea + tumma) | ✅ |
| 17 | HTTPS (Cloudflare Tunnel) | ✅ |
| 18 | Scorecard iframe-embed sivu | ✅ |
| 19 | Embed API proxy (/api/embed/scorecard) | ✅ |
| 20 | iframe-integraatio Lunni360:ssa | ✅ 2.3.2026 |
| 21 | Widget-scorecard-embed reitti (Lunni360 /widget- etuliite) | ✅ 2.3.2026 |
| 22 | Aktiviteettien luokittelu subject-kentällä (puhelu/tehtävä/sähköposti) | ✅ 2.3.2026 |
| 23 | name-kentän lisäys API-hakuihin (fetchAllPages + fetchLunniJSON) | ✅ 2.3.2026 |

### 🔧 KESKEN / SELVITETTÄVÄÄ

| # | Tehtävä | Tila | Huomiot |
|---|---|---|---|
| 24 | Token-välitys automaattisesti Lunni360 → iframe | 🔧 Selvitettävä | Nyt token kovakoodattu URL:iin. Kysy arkkitehdiltä: voiko Lunni360 välittää tokenin automaattisesti? |
| 25 | Sähköposti-luokittelun varmennus | 🔧 Testattava | Oletus: `subject_email` — ei vielä testattu oikealla sähköpostidatalla |

### 🔜 ALOITTAMATTA

| # | Tehtävä | Prioriteetti | Kuvaus |
|---|---|---|---|
| 26 | SMS-aktiviteettien seuranta | P1 | Lunni API:n `subject_sms` → uusi kategoria. Vaatii UI-muutoksen (5. kortti tai yhdistäminen) |
| 27 | Esimiehen tiimitaulukko | P1 | Myyjä × päivä matriisi palloineen/tähdineen |
| 28 | 4 summary-korttia esimiehelle | P1 | Tiimin kokonaistulos, tähdet, paras suorittaja, tukea tarvitseva |
| 29 | Heatmap pitkille aikaväleille | P1 | Kvartaali, vuosi |
| 30 | 5 min polling | P2 | Aktiviteettien automaattinen päivitys |
| 31 | Toast-kannustusviestit | P2 | Motivaatioviestit kirjausten jälkeen |
| 32 | Työpäivien hallinta | P3 | Org-oletus per kk + myyjäkohtaiset poikkeamat |
| 33 | Super Admin -mukautukset | P3 | Toast-tekstit, merkkien nimet per org |
| 34 | Myyjäkohtaiset tavoitteet | P3 | Eri tavoitteet eri myyjille |
| 35 | Oma domain (kpi.lunni.fi) | P4 | Korvaa Quick Tunnel pysyvällä URL:llä. Vaatii Cloudflare-tilin + DNS. |
| 36 | Embed-sivun hienosäätö | P4 | Vastaa scorecard.html:n ulkoasua tarkemmin |
| 37 | Vaalea teema — viimeistely | P5 | Hienosäätö kaikissa näkymissä |
| 38 | Tumma teema — viimeistely | P5 | Dark moden viimeistely |

---

## 2.3.2026 session muutosloki

### Tehdyt muutokset server.js:ään

1. **Reittilisäys (rivi 592):** Lisätty `/widget-scorecard-embed` reitti `/scorecard-embed`:n rinnalle, koska Lunni360 lisää automaattisesti `/widget-` etuliitteen param-kenttään.
   ```javascript
   if (url === '/scorecard-embed' || url === '/widget-scorecard-embed') {
   ```

2. **Aktiviteettien luokittelu (rivit ~675 ja ~1160):** Muutettu molemmat API-endpointit (embed + scorecard) käyttämään `name`-kenttää (subject picklist) puhelujen, tehtävien ja sähköpostien erotteluun:
   ```javascript
   if (actType === 'task') {
     if (subject.includes('subject_call')) category = 'call';
     else if (subject.includes('subject_email')) category = 'email';
     else category = 'task';
   }
   ```

3. **Fields-lisäys API-hakuihin:** Lisätty `name` kenttä kaikkiin aktiviteettihakuihin:
   - fetchAllPages: `'id,activity_type,status,begins,updated,person_id,name'` (3 kohtaa)
   - fetchLunniJSON: `fields=id,activity_type,status,begins,updated,name` (1 kohta)

### Debugatut ongelmat

- **urlParams-virhe (rivi ~800):** Virheilmoitus logeissa `ReferenceError: Cannot access 'urlParams' before initialization` — osoittautui johtuvan Cloudflare Tunnel URL:n reitityksestä, ei koodibugista.
- **Lunni360 iframe näytti kirjautumissivun:** Johtui siitä, että iframe src ei sisältänyt polkua `/scorecard-embed`. Korjattiin laittamalla polku suoraan widget-URL-kenttään.
- **Puhelut näkyivät Tehtävät-kohdassa:** Johtui kahdesta ongelmasta: (1) `name`-kenttää ei haettu API:sta, (2) luokittelulogiikka puuttui.

---

## Tunnetut rajoitukset

- Lunni API ei tue päivämäärärajausta → kaikki aktiviteetit haetaan ja suodatetaan palvelimella
- Embed-sivun ensimmäinen lataus voi olla hidas (hakee kaikki aktiviteetit)
- Quick Tunnel -URL vaihtuu PM2-restartin yhteydessä
- Päivä/viikkodata arvioitu kuukausikeskiarvoista
- Saavutukset lasketaan joka sivulatauksella (ei pysyvää tallennusta)
- Henri Hiljasella ei lunniUserName → scorecard ei toimi
- Teeman CSS cache max-age 300s
- Token kovakoodattu widget-URL:iin (Lunni360 ei välitä automaattisesti)
- SMS-aktiviteetit eivät vielä tuettuja

---

## Cloudflare Tunnel -hallinta

```bash
# Tarkista tunnelin tila
pm2 status

# Katso nykyinen HTTPS-URL
pm2 logs cloudflare-tunnel --lines 20

# Käynnistä tunneli uudelleen (URL VAIHTUU!)
pm2 restart cloudflare-tunnel

# Myöhemmin: vaihto omaan domainiin
# 1. Luo Cloudflare-tili: https://dash.cloudflare.com/sign-up
# 2. cloudflared tunnel login
# 3. cloudflared tunnel create lunni-kpi
# 4. Konfiguroi ~/.cloudflared/config.yml
# 5. DNS CNAME: kpi.lunni.fi → <tunnel-id>.cfargotunnel.com
# 6. pm2 start cloudflared --name cloudflare-tunnel -- tunnel run lunni-kpi
```

---

## Server.js rakenne (~1450 riviä)
- 1–85: Moduulit, apufunktiot
- 86–117: sendHTML + serveHTMLFile (teemainjektio)
- 118–140: serveHTMLFileForEmbed (iframe-headerit: X-Frame-Options, CSP)
- 141–510: Lunni API proxy, cache, fetchAllPages
- 511–567: HTTP-palvelin, login
- 567–589: Logout + session check
- 589–598: /scorecard-embed + /widget-scorecard-embed reitti (EI vaadi sessiota)
- 598–720: /api/embed/scorecard (EI vaadi sessiota, token URL:ssä, fetchAllPages, subject-luokittelu)
- 720–750: getOrgId, getOrgToken, getOrgTheme
- 750–850: Super Admin + org-sivut
- 850–940: Käyttäjien CRUD + /api/me
- 940–1010: Scorecard help + targets + config
- 1010–1220: /api/scorecard/data (subject-luokittelu) + /api/scorecard/users
- 1220–1320: HTML-reitit, widget, preview, tile proxy
- 1320–1450: AI widget generator, server listen
