c = open('/root/dashboard/server.js').read()

old = """  // ── POST /api/ai/generate-widget ──
  if (url === '/api/ai/generate-widget' && req.method === 'POST') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', async () => {
      try {
        const { system, messages } = JSON.parse(body);
        const aiRes = await new Promise((resolve, reject) => {
          const payload = JSON.stringify({
            model: 'claude-sonnet-4-6',
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
              'x-api-key': process.env.ANTHROPIC_API_KEY || '',
              'anthropic-version': '2023-06-01'
            }
          };
          const req2 = https.request(options, r2 => {
            let data = '';
            r2.on('data', c => data += c);
            r2.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
          });
          req2.on('error', reject);
          req2.write(payload);
          req2.end();
        });

        const text = aiRes.content?.[0]?.text || '[]';
        const clean = text.replace(/```json|```/g, '').trim();
        let variants;
        try { variants = JSON.parse(clean); }
        catch { variants = [{ label:'Vaihtoehto 1', html: '<div style="color:#c8f060;padding:20px;text-align:center">Widget generoitu</div>' }]; }

        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ variants }));
      } catch(e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }"""

new = """  // ── POST /api/ai/generate-widget ──
  if (url === '/api/ai/generate-widget' && req.method === 'POST') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch(e) {
        res.writeHead(400, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
      const { system, messages } = parsed;
      const apiKey = process.env.ANTHROPIC_API_KEY || '';
      const payload = JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 4000, system, messages });
      const options = {
        hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
      };
      const req2 = https.request(options, r2 => {
        let data = '';
        r2.on('data', c => data += c);
        r2.on('end', () => {
          try {
            const aiRes = JSON.parse(data);
            const text = (aiRes.content && aiRes.content[0] && aiRes.content[0].text) ? aiRes.content[0].text : '[]';
            const clean = text.replace(/```json|```/g, '').trim();
            let variants;
            try { variants = JSON.parse(clean); }
            catch { variants = [{ label:'Vaihtoehto 1', html: '<div style="color:#c8f060;padding:20px;text-align:center">' + text.substring(0,200) + '</div>' }]; }
            if (!Array.isArray(variants)) variants = [{ label:'Vaihtoehto 1', html: text }];
            res.writeHead(200, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ variants }));
          } catch(e) {
            res.writeHead(500, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ error: e.message, raw: data.substring(0,200) }));
          }
        });
      });
      req2.on('error', e => {
        res.writeHead(500, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: e.message }));
      });
      req2.write(payload);
      req2.end();
    });
    return;
  }"""

if old in c:
    c = c.replace(old, new)
    open('/root/dashboard/server.js', 'w').write(c)
    print('OK - reitti korjattu')
else:
    print('EI LOYDY - etsitaan osittain')
    if 'generate-widget' in c:
        print('Reitti on olemassa mutta teksti ei tasmaa')
