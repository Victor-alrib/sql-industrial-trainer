// Gera as imagens de docs/ (requer `npm run build && npx vite preview --port 4173`)
const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2] || 'http://localhost:4173/';
  const out = process.argv[3] || 'docs';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  await p.goto(url + '#/exercicio/10.4');
  await p.waitForSelector('text=SQLite sandbox online', { timeout: 20000 });
  const type = async (sql) => { await p.click('.cm-content'); await p.keyboard.press('Control+A'); await p.keyboard.press('Delete'); await p.keyboard.insertText(sql); };
  // simula um aluno: alguns exercícios resolvidos
  await p.goto(url + '#/exercicio/9.2');
  await type(`SELECT data_hora, valor,\n       valor - LAG(valor) OVER (ORDER BY data_hora) AS variacao\nFROM leituras\nWHERE sensor_id = 10\n  AND data_hora >= '2026-09-20' AND data_hora < '2026-09-21'\nORDER BY data_hora;`);
  await p.click('text=Verificar resposta');
  await p.waitForSelector('text=Resposta correta!');
  await p.screenshot({ path: `${out}/exercicio.png` });
  await p.goto(url + '#/exercicio/7.3');
  await type(`SELECT e.tag, COUNT(*) AS qtd_alarmes\nFROM equipamentos e\nLEFT JOIN alarmes a ON a.equipamento_id = e.id\nGROUP BY e.tag;`);
  await p.click('text=Verificar resposta');
  await p.waitForSelector('text=Valores diferentes');
  await p.click('text=Mostrar primeira dica');
  await p.screenshot({ path: `${out}/feedback.png` });
  await p.goto(url + '#/'); await p.waitForTimeout(600);
  await p.screenshot({ path: `${out}/dashboard.png` });
  await p.goto(url + '#/dados'); await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/explorador.png` });
  await p.click('text=Modo claro'); await p.goto(url + '#/trilha'); await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/trilha-claro.png` });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(url + '#/exercicio/2.2'); await p.waitForTimeout(600);
  await p.screenshot({ path: `/tmp/scratch/mobile.png` });
  await b.close();
})();
