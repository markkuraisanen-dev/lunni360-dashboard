# Server.js muutokset — Scorecard Embed (iframe)

## Yhteenveto

Lisää 2 asiaa server.js:ään:
1. Uusi reitti `/scorecard-embed` joka palauttaa `scorecard_embed.html` (EI vaadi sessiota)
2. Teemainjektio toimii normaalisti — embed-sivu tukee `?theme=light|dark` parametria

---

## Muutos 1: Uusi reitti (lisää HTML-reittien joukkoon, noin rivi 1050–1160)

Etsi kohdasta jossa muut HTML-reitit ovat (esim. `/scorecard`, `/crm` jne.) ja lisää:

```javascript
// ===== SCORECARD EMBED (iframe, ei vaadi sessiota) =====
// URL: /scorecard-embed?token=BEARER_TOKEN&person=Nimi&theme=light
// Lunni360 iframe kutsuu tätä suoraan
if (pathname === '/scorecard-embed') {
  // Embed ei vaadi kirjautumista — token tulee URL-parametrista
  // Teema: katso query param tai oletus 'light'
  const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const theme = urlParams.get('theme') || 'light';

  serveHTMLFileWithThemeOverride(res, 'scorecard_embed.html', theme);
  return;
}
```

---

## Muutos 2: Apufunktio teeman ylikirjoitukselle (lisää noin riville 86–115, sendHTML-funktioiden jälkeen)

Jos sinulla ei vielä ole tällaista, lisää:

```javascript
// Serve HTML with explicit theme override (for embed/iframe use)
function serveHTMLFileWithThemeOverride(res, filename, theme) {
  const filePath = path.join(__dirname, filename);
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    // Inject theme CSS before </head>
    const validTheme = (theme === 'dark') ? 'dark' : 'light';
    const themeLink = `<link rel="stylesheet" href="/theme-${validTheme}.css">`;
    html = html.replace('</head>', `${themeLink}\n</head>`);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      // TÄRKEÄ: Salli iframe-upotus Lunni360:stä
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors *;"
    });
    res.end(html);
  });
}
```

**TÄRKEÄÄ:** Huomaa `X-Frame-Options: ALLOWALL` ja `Content-Security-Policy: frame-ancestors *` — nämä sallivat sivun näyttämisen iframessa. Ilman näitä selain estää iframen.

Jos haluat rajoittaa vain Lunni360:een, käytä:
```javascript
'Content-Security-Policy': "frame-ancestors https://*.lunni.io https://setup.lunni.io;"
```

---

## Muutos 3: Staattinen tiedostoreitti (tarkista että nämä on jo)

Varmista että server.js palvelee staattisia tiedostoja (CSS, JS). Tämän pitäisi jo toimia
koska theme-light.css ja theme-dark.css ovat käytössä. Jos ei, lisää:

```javascript
// Serve static CSS files
if (pathname.startsWith('/theme-') && pathname.endsWith('.css')) {
  const cssFile = path.join(__dirname, pathname.substring(1));
  fs.readFile(cssFile, 'utf8', (err, css) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {
      'Content-Type': 'text/css',
      'Cache-Control': 'public, max-age=300'
    });
    res.end(css);
  });
  return;
}
```

---

## Tiedoston kopiointi palvelimelle

Lisää `scorecard_embed.html` scp-komentoon. Päivitetty kopio-komento:

```bash
scp "/Users/meamartair1/Desktop/Koodaus by MR/server.js" "/Users/meamartair1/Desktop/Koodaus by MR/scorecard_embed.html" "/Users/meamartair1/Desktop/Koodaus by MR/theme-light.css" "/Users/meamartair1/Desktop/Koodaus by MR/theme-dark.css" "/Users/meamartair1/Desktop/Koodaus by MR/scorecard.html" "/Users/meamartair1/Desktop/Koodaus by MR/scorecard_targets.html" "/Users/meamartair1/Desktop/Koodaus by MR/scorecard_help.html" "/Users/meamartair1/Desktop/Koodaus by MR/crm_dashboard.html" "/Users/meamartair1/Desktop/Koodaus by MR/fsm_dashboard.html" "/Users/meamartair1/Desktop/Koodaus by MR/dashboard.html" "/Users/meamartair1/Desktop/Koodaus by MR/map_dashboard.html" "/Users/meamartair1/Desktop/Koodaus by MR/widget_wizard.html" "/Users/meamartair1/Desktop/Koodaus by MR/widget_dashboard.html" root@212.47.232.1:/root/dashboard/ && ssh root@212.47.232.1 "pm2 restart lunni-dashboard && echo VALMIS"
```

---

## Testaaminen

### 1. Ilman iframea (selaimessa suoraan):
```
https://<cloudflare-url>/scorecard-embed?token=YOUR_BEARER_TOKEN&person=Markku+Räisänen
```

### 2. Lunni360 Widget -konfiguraatio:
- title: **Scorecard**
- color: sininen
- param: `/scorecard-embed?token=`  (Lunni360 lisää tokenin perään)
- URL: `https://<cloudflare-url>`

### 3. Tarkista konsolista (F12):
- Ei CORS-virheitä
- Ei "refused to frame" -virheitä
- API-kutsut palauttavat dataa

---

## Etenemispolku

```
1. Muokkaa server.js (lisää yllä olevat muutokset)
2. Kopioi scorecard_embed.html koodauskansioon
3. scp kaikki palvelimelle
4. Asenna Cloudflare Tunnel (ks. CLOUDFLARE_TUNNEL_OHJE.md)
5. Testaa selaimessa suoraan
6. Lisää widget Lunni360 hallintapaneeliin
7. Testaa iframessa
```
