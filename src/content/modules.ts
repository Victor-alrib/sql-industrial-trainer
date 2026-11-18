import type { Module } from './types';

export const MODULES: Module[] = [
  {
    id: 1, slug: 'select', title: 'SELECT e FROM', conceptLabel: 'SELECT / FROM',
    tagline: 'Escolha colunas, crie colunas calculadas e elimine repetições.',
    cheatsheet: `SELECT coluna1, coluna2 FROM tabela;
SELECT * FROM tabela;                 -- todas as colunas
SELECT a - b AS diferenca FROM t;     -- coluna calculada com alias
SELECT DISTINCT coluna FROM tabela;   -- valores únicos`,
  },
  {
    id: 2, slug: 'where', title: 'WHERE', conceptLabel: 'Filtros com WHERE',
    tagline: 'Filtre registros por condições, faixas, listas, textos e NULL.',
    cheatsheet: `WHERE severidade = 'critica' AND reconhecido = 0
WHERE tipo IN ('Bomba', 'Compressor')
WHERE tag LIKE 'TT-%'
WHERE linha_id IS NULL
WHERE data_hora >= '2026-09-01' AND data_hora < '2026-10-01'`,
  },
  {
    id: 3, slug: 'order-by', title: 'ORDER BY', conceptLabel: 'Ordenação',
    tagline: 'Ordene resultados, monte rankings e pegue os N primeiros.',
    cheatsheet: `ORDER BY custo DESC
ORDER BY turno ASC, nome ASC
ORDER BY data_hora DESC LIMIT 10
ORDER BY CASE severidade WHEN 'critica' THEN 1 ELSE 2 END`,
  },
  {
    id: 4, slug: 'agregacao', title: 'Funções de agregação', conceptLabel: 'COUNT, SUM, AVG, MIN, MAX',
    tagline: 'Resuma milhares de registros em indicadores.',
    cheatsheet: `SELECT COUNT(*), COUNT(DISTINCT equipamento_id) FROM alarmes;
SELECT MIN(valor), MAX(valor), ROUND(AVG(valor), 2) FROM leituras;
SELECT ROUND(100.0 * SUM(x) / COUNT(*), 1) ...  -- evite divisão inteira`,
  },
  {
    id: 5, slug: 'group-by', title: 'GROUP BY e HAVING', conceptLabel: 'GROUP BY / HAVING',
    tagline: 'Calcule indicadores por equipamento, linha, tipo ou turno.',
    cheatsheet: `SELECT equipamento_id, COUNT(*) AS qtd
FROM ordens_manutencao
WHERE tipo = 'corretiva'        -- filtra linhas (antes de agrupar)
GROUP BY equipamento_id
HAVING COUNT(*) > 3;            -- filtra grupos (depois de agrupar)`,
  },
  {
    id: 6, slug: 'inner-join', title: 'INNER JOIN', conceptLabel: 'INNER JOIN',
    tagline: 'Relacione sensores, equipamentos, linhas e pessoas.',
    cheatsheet: `SELECT e.tag, l.nome
FROM equipamentos e
JOIN linhas_producao l ON l.id = e.linha_id;
-- INNER JOIN mantém só as linhas com correspondência nos dois lados`,
  },
  {
    id: 7, slug: 'left-join', title: 'LEFT JOIN', conceptLabel: 'LEFT JOIN',
    tagline: 'Encontre o que está faltando: ativos sem manutenção, contagens zero.',
    cheatsheet: `SELECT e.tag, COUNT(o.id)
FROM equipamentos e
LEFT JOIN ordens_manutencao o ON o.equipamento_id = e.id
GROUP BY e.tag;
-- sem correspondência → colunas da direita ficam NULL`,
  },
  {
    id: 8, slug: 'subqueries', title: 'Subqueries', conceptLabel: 'Subconsultas',
    tagline: 'Use o resultado de uma consulta dentro de outra.',
    cheatsheet: `WHERE custo > (SELECT AVG(custo) FROM ordens_manutencao)
WHERE id IN (SELECT equipamento_id FROM alarmes WHERE ...)
WHERE NOT EXISTS (SELECT 1 FROM alarmes a WHERE a.operador_id = o.id)
SELECT AVG(total) FROM (SELECT SUM(custo) AS total FROM ... GROUP BY ...)`,
  },
  {
    id: 9, slug: 'window', title: 'Window Functions', conceptLabel: 'Funções de janela',
    tagline: 'Rankings, variações entre leituras, médias móveis e acumulados.',
    cheatsheet: `RANK() OVER (ORDER BY total DESC)
LAG(valor) OVER (ORDER BY data_hora)
AVG(valor) OVER (ORDER BY data_hora ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)
ROW_NUMBER() OVER (PARTITION BY equipamento_id ORDER BY data_abertura DESC)
SUM(x) OVER (ORDER BY mes)   -- acumulado`,
  },
  {
    id: 10, slug: 'desafios', title: 'Desafios integradores', conceptLabel: 'Indicadores de manutenção',
    tagline: 'MTTR, MTBF, disponibilidade: consultas completas como no dia a dia.',
    cheatsheet: `WITH falhas AS (
  SELECT equipamento_id, COUNT(*) AS n FROM ... GROUP BY equipamento_id
)
SELECT ... FROM equipamentos e JOIN falhas f ON f.equipamento_id = e.id;
-- MTTR = tempo médio de reparo | MTBF = tempo operando / nº de falhas
-- horas entre datas: (julianday(fim) - julianday(inicio)) * 24`,
  },
];
