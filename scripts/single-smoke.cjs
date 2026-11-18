const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = []; p.on('console', m => logs.push(m.type() + ': ' + m.text().slice(0, 200)));
  await p.goto(process.argv[2]);
  await p.waitForSelector('text=SQLite sandbox online', { timeout: 20000 });
  await p.click('text=Reconhecimento da planta');
  await p.click('.cm-content'); await p.keyboard.press('Control+A'); await p.keyboard.insertText('SELECT * FROM linhas_producao');
  await p.click('text=Verificar resposta');
  await p.waitForSelector('text=Resposta correta!', { timeout: 10000 });
  await p.click('text=Próximo exercício');
  await p.waitForSelector('text=Inventário de ativos');
  console.log('single-file OK'); console.log(logs.filter(l => !l.startsWith('log')).join('\n'));
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
