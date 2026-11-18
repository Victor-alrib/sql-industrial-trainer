const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(url + '#/exercicio/6.3');
  await p.waitForSelector('text=SQLite sandbox online', { timeout: 20000 });
  const type = async (sql) => { await p.click('.cm-content'); await p.keyboard.press('Control+A'); await p.keyboard.press('Delete'); await p.keyboard.insertText(sql); };
  // erro de coluna
  await type("SELECT tag, AVG(valr) FROM equipamentos");
  await p.keyboard.press('Control+Enter');
  await p.waitForSelector('text=Coluna inexistente');
  await p.screenshot({ path: '/tmp/scratch/s_error.png' });
  // resposta errada (sem filtro de tipo)
  await type("SELECT e.tag, ROUND(AVG(l.valor),2) FROM equipamentos e JOIN sensores s ON s.equipamento_id=e.id JOIN leituras l ON l.sensor_id=s.id GROUP BY e.tag HAVING AVG(l.valor) > 80");
  await p.click('text=Verificar resposta');
  await p.waitForSelector('text=Quantidade de linhas diferente');
  await p.click('text=Mostrar primeira dica');
  await p.screenshot({ path: '/tmp/scratch/s_wrong.png' });
  await type("SELECT e.tag, ROUND(AVG(l.valor), 2) AS media\nFROM equipamentos e\nJOIN sensores s ON s.equipamento_id = e.id\nJOIN leituras l ON l.sensor_id = s.id\nWHERE s.tipo = 'temperatura'\nGROUP BY e.tag\nHAVING AVG(l.valor) > 80;");
  await p.keyboard.press('Control+Shift+Enter');
  await p.waitForSelector('text=Resposta correta!');
  await p.screenshot({ path: '/tmp/scratch/s_ok.png' });
  // timeout
  await type("WITH RECURSIVE r(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM r) SELECT count(*) FROM r");
  await p.keyboard.press('Control+Enter');
  await p.waitForSelector('text=A consulta demorou demais', { timeout: 15000 });
  await type("SELECT COUNT(*) FROM leituras");
  await p.keyboard.press('Control+Enter');
  await p.waitForSelector('text=4860', { timeout: 20000 });
  console.log('timeout recovery ok');
  await p.goto(url + '#/'); await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/scratch/s_dash.png', fullPage: true });
  await p.goto(url + '#/trilha'); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/scratch/s_trail.png' });
  await p.goto(url + '#/dados'); await p.waitForTimeout(1000);
  await p.screenshot({ path: '/tmp/scratch/s_data.png' });
  await p.goto(url + '#/exercicio/10.4'); await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/scratch/s_final.png' });
  // persistence after reload
  await p.goto(url + '#/'); await p.reload(); await p.waitForTimeout(800);
  console.log('solved text present:', await p.isVisible('text=1/45') || await p.textContent('main').then(t => t.includes('1/')));
  console.log('errors:', errs);
  await b.close();
})();
