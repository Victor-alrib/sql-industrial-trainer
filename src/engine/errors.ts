/** Traduz mensagens de erro do SQLite em explicações didáticas em português. */

export interface ErrorExplanation {
  title: string;
  explanation: string;
  tips: string[];
  raw: string;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

function suggest(word: string, options: string[]): string | null {
  const w = word.toLowerCase();
  let best: string | null = null;
  let bestD = Infinity;
  for (const o of options) {
    const dist = levenshtein(w, o.toLowerCase());
    if (dist < bestD) { bestD = dist; best = o; }
  }
  return best && bestD <= Math.max(2, Math.floor(w.length / 3)) ? best : null;
}

const FN_TIPS: Record<string, string> = {
  datediff: 'O SQLite não tem DATEDIFF. Para diferença em dias use julianday(fim) - julianday(inicio); em horas, multiplique por 24.',
  now: 'No SQLite, a data/hora atual é datetime(\'now\').',
  getdate: 'No SQLite, a data/hora atual é datetime(\'now\').',
  year: 'Para extrair o ano use strftime(\'%Y\', coluna).',
  month: 'Para extrair o mês use strftime(\'%m\', coluna).',
  day: 'Para extrair o dia use strftime(\'%d\', coluna).',
  date_format: 'No SQLite use strftime(formato, coluna). Ex.: strftime(\'%Y-%m\', data_hora).',
  isnull: 'No SQLite use IFNULL(valor, padrao) ou COALESCE(valor, padrao).',
  nvl: 'No SQLite use IFNULL(valor, padrao) ou COALESCE(valor, padrao).',
  len: 'No SQLite o tamanho de um texto é obtido com LENGTH(texto).',
  top: 'O SQLite não usa TOP; use LIMIT n ao final da consulta.',
  timestampdiff: 'Use (julianday(fim) - julianday(inicio)) * 24 para horas ou * 1440 para minutos.',
  datepart: 'Use strftime(): %Y ano, %m mês, %d dia, %H hora.',
};

export function explainError(raw: string, tables: string[] = [], columns: string[] = []): ErrorExplanation {
  const m = (re: RegExp) => raw.match(re);
  let r: RegExpMatchArray | null;

  if (raw === '__TIMEOUT__') {
    return {
      raw: 'Tempo limite excedido', title: 'A consulta demorou demais',
      explanation: 'A execução passou de 5 segundos e foi interrompida. O ambiente foi reiniciado automaticamente.',
      tips: [
        'Um JOIN sem condição (produto cartesiano) entre tabelas grandes, como leituras × leituras, gera milhões de linhas.',
        'Confira se todas as tabelas do FROM/JOIN estão ligadas por uma condição ON.',
      ],
    };
  }
  if ((r = m(/no such table: (?:main\.)?(\S+)/i))) {
    const s = suggest(r[1], tables);
    return {
      raw, title: 'Tabela inexistente',
      explanation: `A tabela “${r[1]}” não existe no banco industrial.`,
      tips: [
        s ? `Você quis dizer “${s}”?` : `Tabelas disponíveis: ${tables.join(', ')}.`,
        'Os nomes das tabelas estão em português, no plural e com underline (ex.: ordens_manutencao).',
      ],
    };
  }
  if ((r = m(/no such column: (\S+)/i))) {
    const name = r[1];
    const [alias, col] = name.includes('.') ? name.split('.') : [null, name];
    const s = suggest(col, columns);
    const tips: string[] = [];
    if (s && s.toLowerCase() !== col.toLowerCase()) tips.push(`Você quis dizer “${s}”?`);
    if (alias) tips.push(`Confira se o alias “${alias}” foi definido no FROM/JOIN (ex.: FROM equipamentos ${alias}) e se essa tabela possui a coluna.`);
    tips.push('Textos devem ficar entre aspas simples: \'critica\'. Sem aspas, o SQLite interpreta a palavra como nome de coluna.');
    tips.push('Um alias criado no SELECT não pode ser usado no WHERE da mesma consulta — repita a expressão ou use uma subconsulta.');
    return { raw, title: 'Coluna inexistente', explanation: `A coluna “${name}” não foi encontrada nas tabelas da consulta.`, tips };
  }
  if ((r = m(/ambiguous column name: (\S+)/i))) {
    return {
      raw, title: 'Coluna ambígua',
      explanation: `A coluna “${r[1]}” existe em mais de uma tabela da consulta, então o banco não sabe qual usar.`,
      tips: [`Qualifique a coluna com o nome ou alias da tabela, por exemplo e.${r[1]} ou s.${r[1]}.`],
    };
  }
  if ((r = m(/misuse of aggregate(?: function)?:? (\w+)/i))) {
    return {
      raw, title: 'Uso indevido de função de agregação',
      explanation: `A função ${r[1].toUpperCase()}() foi usada em um lugar onde agregações não são permitidas.`,
      tips: [
        'O WHERE filtra linhas ANTES do agrupamento; para filtrar pelo resultado de uma agregação, use HAVING.',
        'Para comparar com uma agregação de toda a tabela, use uma subconsulta: WHERE custo > (SELECT AVG(custo) FROM ...).',
      ],
    };
  }
  if (m(/misuse of window function/i)) {
    return {
      raw, title: 'Uso indevido de função de janela',
      explanation: 'Funções de janela (ROW_NUMBER, RANK, LAG...) são calculadas depois do WHERE e do GROUP BY, então não podem aparecer nessas cláusulas.',
      tips: ['Calcule a função de janela em uma subconsulta ou CTE (WITH) e filtre na consulta externa.'],
    };
  }
  if (m(/a GROUP BY clause is required before HAVING/i)) {
    return { raw, title: 'HAVING sem GROUP BY', explanation: 'HAVING filtra grupos, então precisa de um GROUP BY antes.', tips: ['Para filtrar linhas individuais, use WHERE.'] };
  }
  if ((r = m(/no such function: (\w+)/i))) {
    const tip = FN_TIPS[r[1].toLowerCase()];
    return {
      raw, title: 'Função inexistente',
      explanation: `A função ${r[1].toUpperCase()}() não existe no SQLite.`,
      tips: [tip ?? 'Cada banco tem suas funções. No SQLite, datas são manipuladas com date(), datetime(), strftime() e julianday().'],
    };
  }
  if ((r = m(/wrong number of arguments to function (\w+)/i))) {
    return { raw, title: 'Número de argumentos incorreto', explanation: `A função ${r[1].toUpperCase()}() recebeu argumentos a mais ou a menos.`, tips: ['Exemplos: ROUND(valor, 2), COUNT(coluna), SUBSTR(texto, inicio, tamanho).'] };
  }
  if ((r = m(/unrecognized token: "(.+)"/i))) {
    return {
      raw, title: 'Símbolo não reconhecido',
      explanation: `O trecho ${r[1]} não é válido em SQL.`,
      tips: ['Verifique aspas não fechadas. Textos usam aspas simples: \'2026-09-01\'.', 'Use ponto como separador decimal: 80.5 (e não 80,5).'],
    };
  }
  if ((r = m(/near "(.+?)": syntax error/i))) {
    const tok = r[1];
    const tips = ['Confira vírgulas entre as colunas do SELECT (e a ausência de vírgula antes do FROM).'];
    const up = tok.toUpperCase();
    if (['FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT'].includes(up)) tips.unshift(`A ordem das cláusulas é: SELECT → FROM → JOIN → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT. Confira o que vem antes de ${up}.`);
    if (up === 'ON') tips.unshift('ON só é usado após um JOIN. Verifique se a palavra JOIN está presente.');
    if (up === ',') tips.unshift('Pode haver uma vírgula sobrando no fim da lista de colunas.');
    tips.push('Em SQLite, textos usam aspas simples e o separador decimal é o ponto.');
    return { raw, title: 'Erro de sintaxe', explanation: `O SQLite não conseguiu interpretar a consulta perto de “${tok}”.`, tips };
  }
  if (m(/incomplete input/i)) {
    return { raw, title: 'Consulta incompleta', explanation: 'A consulta terminou antes do esperado.', tips: ['Verifique parênteses e aspas não fechados, ou uma condição sem valor (ex.: WHERE valor >).'] };
  }
  if (m(/readonly|query_only|attempt to write/i)) {
    return {
      raw, title: 'Ambiente somente leitura',
      explanation: 'Este é um sandbox de consultas: comandos que alteram dados (INSERT, UPDATE, DELETE, CREATE, DROP) são bloqueados.',
      tips: ['Use SELECT para consultar. Para cálculos intermediários, prefira subconsultas ou CTEs (WITH ... AS).'],
    };
  }
  if (m(/do not have the same number of result columns/i)) {
    return { raw, title: 'UNION com colunas diferentes', explanation: 'As consultas combinadas por UNION precisam ter o mesmo número de colunas.', tips: [] };
  }
  if (m(/ORDER BY term out of range/i)) {
    return { raw, title: 'ORDER BY fora do intervalo', explanation: 'Ao ordenar por posição (ORDER BY 3), o número deve corresponder a uma coluna existente no SELECT.', tips: [] };
  }
  return { raw, title: 'Erro ao executar a consulta', explanation: raw, tips: ['Leia a mensagem com atenção e confira nomes de tabelas, colunas e a sintaxe.'] };
}
