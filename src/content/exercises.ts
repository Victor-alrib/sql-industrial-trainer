import type { Exercise } from './types';

const SUBQ = { pattern: /\(\s*SELECT\b/i, message: 'Resultado correto! Este módulo é sobre subconsultas — tente resolver também usando uma.' };
const WINDOW = { pattern: /\bOVER\s*\(/i, message: 'Resultado correto! Este módulo é sobre funções de janela — tente também com OVER (...).' };
const LEFTJ = { pattern: /\bLEFT\s+(OUTER\s+)?JOIN\b/i, message: 'Resultado correto! Que tal praticar também a versão com LEFT JOIN?' };
const JOIN = { pattern: /\bJOIN\b/i, message: 'Resultado correto! Tente também escrever a versão com JOIN explícito.' };
const GROUP = { pattern: /\bGROUP\s+BY\b/i, message: 'Resultado correto! Pratique também a versão com GROUP BY.' };

export const EXERCISES: Exercise[] = [
  // =========================================================================
  // 1. SELECT e FROM
  // =========================================================================
  {
    id: '1.1', moduleId: 1, difficulty: 'facil', title: 'Reconhecimento da planta',
    context: 'Primeiro dia como analista de dados da manutenção. Antes de qualquer análise, você precisa conhecer as linhas de produção da unidade.',
    objective: 'Liste todas as colunas e todos os registros da tabela de linhas de produção.',
    expectedColumns: ['id', 'nome', 'area', 'capacidade_hora', 'gerente'],
    tables: ['linhas_producao'],
    hints: [
      'Para trazer todas as colunas existe um atalho: o asterisco.',
      'A estrutura é SELECT <colunas> FROM <tabela>.',
      'SELECT * FROM ___;',
    ],
    solution: 'SELECT * FROM linhas_producao;',
    takeaway: 'SELECT * é ótimo para explorar, mas em relatórios prefira listar as colunas: a consulta fica mais legível e não quebra se a tabela ganhar colunas novas.',
  },
  {
    id: '1.2', moduleId: 1, difficulty: 'facil', title: 'Inventário de ativos',
    context: 'O planejamento de manutenção pediu uma planilha simples com a identificação de cada ativo e quem o fabricou, para negociar contratos de peças.',
    objective: 'Retorne a tag, o nome e o fabricante de todos os equipamentos.',
    expectedColumns: ['tag', 'nome', 'fabricante'],
    tables: ['equipamentos'],
    hints: [
      'Liste no SELECT apenas as colunas pedidas, separadas por vírgula.',
      'A tabela de ativos se chama equipamentos.',
      'SELECT tag, ___, ___ FROM equipamentos;',
    ],
    solution: 'SELECT tag, nome, fabricante FROM equipamentos;',
    takeaway: 'A ordem das colunas no SELECT define a ordem no resultado. Aqui a validação aceita qualquer ordem, mas em relatórios ela importa para quem lê.',
  },
  {
    id: '1.3', moduleId: 1, difficulty: 'medio', title: 'Faixa operacional dos sensores',
    context: 'A instrumentação quer revisar as faixas de calibração. Para cada sensor é preciso saber a amplitude da faixa operacional (limite máximo menos limite mínimo).',
    objective: 'Retorne a tag do sensor, a unidade de medida e a amplitude da faixa (limite_max − limite_min) com o nome amplitude.',
    expectedColumns: ['tag', 'unidade', 'amplitude'],
    tables: ['sensores'],
    hints: [
      'Você pode fazer contas diretamente no SELECT, como em uma planilha.',
      'Use AS para dar nome a uma coluna calculada.',
      'SELECT tag, unidade, limite_max - ___ AS amplitude FROM sensores;',
    ],
    solution: 'SELECT tag, unidade, limite_max - limite_min AS amplitude FROM sensores;',
    takeaway: 'Colunas calculadas não alteram o banco: o cálculo acontece só no resultado da consulta.',
  },
  {
    id: '1.4', moduleId: 1, difficulty: 'facil', title: 'Fornecedores da planta',
    context: 'Compras quer saber com quantos fabricantes diferentes a planta trabalha. Primeiro passo: a lista de fabricantes, sem repetições.',
    objective: 'Liste cada fabricante de equipamento uma única vez.',
    expectedColumns: ['fabricante'],
    tables: ['equipamentos'],
    hints: [
      'Vários equipamentos têm o mesmo fabricante. Existe uma palavra-chave que remove linhas duplicadas.',
      'Ela vem logo depois do SELECT.',
      'SELECT ___ fabricante FROM equipamentos;',
    ],
    solution: 'SELECT DISTINCT fabricante FROM equipamentos;',
    takeaway: 'DISTINCT se aplica à combinação de todas as colunas do SELECT, não só à primeira.',
  },

  // =========================================================================
  // 2. WHERE
  // =========================================================================
  {
    id: '2.1', moduleId: 2, difficulty: 'facil', title: 'Ativos de criticidade A',
    context: 'A matriz de criticidade classifica como “A” os equipamentos cuja parada interrompe a linha inteira. Eles recebem preventiva mensal.',
    objective: 'Retorne a tag e o nome dos equipamentos com criticidade A.',
    expectedColumns: ['tag', 'nome'],
    tables: ['equipamentos'],
    hints: [
      'Filtre os registros com a cláusula WHERE.',
      'Textos são comparados entre aspas simples.',
      "SELECT tag, nome FROM equipamentos WHERE criticidade = '___';",
    ],
    solution: "SELECT tag, nome FROM equipamentos WHERE criticidade = 'A';",
    takeaway: 'No SQLite, comparações de texto com = diferenciam maiúsculas de minúsculas: \'a\' não é igual a \'A\'.',
  },
  {
    id: '2.2', moduleId: 2, difficulty: 'facil', title: 'Alarmes críticos pendentes',
    context: 'Na passagem de turno, o supervisor quer ver os alarmes críticos que ninguém reconheceu no supervisório.',
    objective: 'Retorne id, data_hora e mensagem dos alarmes com severidade critica que ainda não foram reconhecidos (reconhecido = 0).',
    expectedColumns: ['id', 'data_hora', 'mensagem'],
    tables: ['alarmes'],
    hints: [
      'São duas condições que precisam ser verdadeiras ao mesmo tempo.',
      'Combine condições com AND.',
      "... WHERE severidade = 'critica' AND ___ = 0;",
    ],
    solution: "SELECT id, data_hora, mensagem FROM alarmes WHERE severidade = 'critica' AND reconhecido = 0;",
    takeaway: 'Alarmes críticos sem reconhecimento são um indicador clássico de sobrecarga do operador (alarm flooding).',
  },
  {
    id: '2.3', moduleId: 2, difficulty: 'medio', title: 'Equipe de apoio',
    context: 'Técnicos, supervisor e engenharia atendem a planta toda e por isso não têm linha de produção atribuída no cadastro.',
    objective: 'Retorne o nome e a função das pessoas que não estão vinculadas a nenhuma linha de produção.',
    expectedColumns: ['nome', 'funcao'],
    tables: ['operadores'],
    hints: [
      'A ausência de valor é representada por NULL.',
      'NULL não é comparado com =. Existe um operador específico.',
      'SELECT nome, funcao FROM operadores WHERE linha_id IS ___;',
    ],
    solution: 'SELECT nome, funcao FROM operadores WHERE linha_id IS NULL;',
    takeaway: 'linha_id = NULL nunca é verdadeiro (resulta em “desconhecido”). Use sempre IS NULL / IS NOT NULL.',
  },
  {
    id: '2.4', moduleId: 2, difficulty: 'medio', title: 'Corretivas caras em setembro',
    context: 'O orçamento de manutenção estourou em setembro. O gerente quer revisar as ordens corretivas abertas no mês com custo acima de R$ 3.000.',
    objective: 'Retorne id, equipamento_id, data_abertura e custo das ordens corretivas abertas em setembro de 2026 com custo maior que 3000.',
    expectedColumns: ['id', 'equipamento_id', 'data_abertura', 'custo'],
    tables: ['ordens_manutencao'],
    hints: [
      'Datas estão armazenadas como texto no formato AAAA-MM-DD HH:MM:SS, que pode ser comparado como texto.',
      "Um período de um mês pode ser filtrado com data >= '2026-09-01' AND data < '2026-10-01'.",
      "WHERE tipo = 'corretiva' AND data_abertura >= '2026-09-01' AND data_abertura < '___' AND custo > ___",
    ],
    solution: `SELECT id, equipamento_id, data_abertura, custo
FROM ordens_manutencao
WHERE tipo = 'corretiva'
  AND data_abertura >= '2026-09-01' AND data_abertura < '2026-10-01'
  AND custo > 3000;`,
    takeaway: 'O padrão “>= início AND < início do próximo período” evita erros com horários e funciona para qualquer granularidade.',
  },
  {
    id: '2.5', moduleId: 2, difficulty: 'dificil', title: 'Investigação do spindle',
    context: 'O centro de usinagem CUS-202 apresentou superaquecimento no fim do mês. A engenharia pediu todas as leituras do sensor TT-202 (sensor_id = 10) acima de 85 °C entre 20 e 25 de setembro, inclusive o dia 25 inteiro.',
    objective: 'Retorne data_hora e valor das leituras do sensor 10 com valor acima de 85, de 20/09/2026 até o fim do dia 25/09/2026.',
    expectedColumns: ['data_hora', 'valor'],
    tables: ['leituras'],
    hints: [
      'Cuidado com o fim do período: data_hora inclui o horário.',
      "'2026-09-25 08:00:00' é MAIOR que '2026-09-25' na comparação de textos. BETWEEN '2026-09-20' AND '2026-09-25' perderia o dia 25.",
      "WHERE sensor_id = 10 AND valor > 85 AND data_hora >= '2026-09-20' AND data_hora < '___'",
    ],
    solution: `SELECT data_hora, valor
FROM leituras
WHERE sensor_id = 10
  AND valor > 85
  AND data_hora >= '2026-09-20' AND data_hora < '2026-09-26';`,
    takeaway: 'BETWEEN com datas que têm horário é uma armadilha comum. Use limite superior exclusivo (< dia seguinte) ou date(data_hora) BETWEEN ...',
  },

  // =========================================================================
  // 3. ORDER BY
  // =========================================================================
  {
    id: '3.1', moduleId: 3, difficulty: 'facil', title: 'Idade do parque fabril',
    context: 'Para o plano de retrofit, a engenharia quer a lista de equipamentos do mais antigo ao mais novo.',
    objective: 'Retorne tag e data_instalacao de todos os equipamentos, ordenados da instalação mais antiga para a mais recente.',
    expectedColumns: ['tag', 'data_instalacao'],
    tables: ['equipamentos'],
    hints: [
      'ORDER BY vem no final da consulta.',
      'A ordem crescente (ASC) é o padrão.',
      'SELECT tag, data_instalacao FROM equipamentos ORDER BY ___;',
    ],
    solution: 'SELECT tag, data_instalacao FROM equipamentos ORDER BY data_instalacao;',
    options: { orderMatters: true, orderKeys: [1] },
    takeaway: 'Datas no formato ISO (AAAA-MM-DD) ordenam corretamente como texto — é por isso que esse formato é o padrão em bancos de dados.',
  },
  {
    id: '3.2', moduleId: 3, difficulty: 'facil', title: 'Top 5 ordens mais caras',
    context: 'Na reunião mensal de custos, o gerente quer começar pelas cinco ordens de manutenção mais caras do trimestre.',
    objective: 'Retorne id, equipamento_id e custo das 5 ordens de maior custo, da mais cara para a mais barata.',
    expectedColumns: ['id', 'equipamento_id', 'custo'],
    tables: ['ordens_manutencao'],
    hints: [
      'Ordene de forma decrescente.',
      'LIMIT restringe a quantidade de linhas retornadas.',
      'SELECT id, equipamento_id, custo FROM ordens_manutencao ORDER BY custo ___ LIMIT ___;',
    ],
    solution: 'SELECT id, equipamento_id, custo FROM ordens_manutencao ORDER BY custo DESC LIMIT 5;',
    options: { orderMatters: true, orderKeys: [2] },
    takeaway: 'ORDER BY + LIMIT é a base de qualquer “Top N”. Sem ORDER BY, o LIMIT devolve linhas em ordem indefinida.',
  },
  {
    id: '3.3', moduleId: 3, difficulty: 'medio', title: 'Escala por turno',
    context: 'O RH precisa da lista de colaboradores agrupada visualmente por turno e, dentro de cada turno, em ordem alfabética.',
    objective: 'Retorne nome e turno de todos os operadores, ordenados por turno (A, B, C) e depois por nome.',
    expectedColumns: ['nome', 'turno'],
    tables: ['operadores'],
    hints: [
      'É possível ordenar por mais de uma coluna.',
      'A primeira coluna do ORDER BY tem prioridade; a segunda desempata.',
      'ORDER BY turno, ___',
    ],
    solution: 'SELECT nome, turno FROM operadores ORDER BY turno, nome;',
    options: { orderMatters: true, orderKeys: [1, 0] },
    takeaway: 'Cada coluna do ORDER BY pode ter sua própria direção: ORDER BY turno ASC, data_admissao DESC.',
  },
  {
    id: '3.4', moduleId: 3, difficulty: 'medio', title: 'Últimas leituras do compressor',
    context: 'O compressor CMP-401 disparou alarme de alta temperatura de descarga. O operador quer ver as 10 leituras mais recentes do sensor TT-401 (sensor_id = 20).',
    objective: 'Retorne data_hora e valor das 10 leituras mais recentes do sensor 20, da mais recente para a mais antiga.',
    expectedColumns: ['data_hora', 'valor'],
    tables: ['leituras'],
    hints: [
      'Filtre o sensor, ordene por data e limite.',
      'Mais recente primeiro = ordem decrescente de data_hora.',
      'WHERE sensor_id = 20 ORDER BY data_hora ___ LIMIT 10',
    ],
    solution: 'SELECT data_hora, valor FROM leituras WHERE sensor_id = 20 ORDER BY data_hora DESC LIMIT 10;',
    options: { orderMatters: true, orderKeys: [0] },
    takeaway: 'A ordem das cláusulas é fixa: SELECT → FROM → WHERE → ORDER BY → LIMIT.',
  },
  {
    id: '3.5', moduleId: 3, difficulty: 'dificil', title: 'Fila de atendimento de alarmes',
    context: 'O painel da sala de controle deve mostrar os alarmes não reconhecidos por gravidade (critica → alta → media → baixa) e, dentro da mesma gravidade, do mais antigo para o mais novo.',
    objective: 'Retorne id, severidade e data_hora dos alarmes não reconhecidos, nessa ordem de prioridade.',
    expectedColumns: ['id', 'severidade', 'data_hora'],
    tables: ['alarmes'],
    hints: [
      'Ordem alfabética não serve: alta < baixa < critica < media.',
      'Use CASE dentro do ORDER BY para transformar a severidade em um número de prioridade.',
      "ORDER BY CASE severidade WHEN 'critica' THEN 1 WHEN 'alta' THEN 2 WHEN ___ THEN 3 ELSE 4 END, data_hora",
    ],
    solution: `SELECT id, severidade, data_hora
FROM alarmes
WHERE reconhecido = 0
ORDER BY CASE severidade
           WHEN 'critica' THEN 1 WHEN 'alta' THEN 2
           WHEN 'media' THEN 3 ELSE 4 END,
         data_hora;`,
    options: { orderMatters: true, orderKeys: [1, 2] },
    takeaway: 'CASE no ORDER BY permite qualquer ordem de negócio, sem precisar de uma tabela auxiliar de prioridades.',
  },

  // =========================================================================
  // 4. Funções de agregação
  // =========================================================================
  {
    id: '4.1', moduleId: 4, difficulty: 'facil', title: 'Volume de alarmes',
    context: 'A norma ISA-18.2 recomenda acompanhar o volume de alarmes. Quantos alarmes o supervisório registrou em setembro?',
    objective: 'Retorne o total de registros da tabela de alarmes em uma coluna chamada total_alarmes.',
    expectedColumns: ['total_alarmes'],
    tables: ['alarmes'],
    hints: ['Existe uma função que conta linhas.', 'COUNT(*) conta todas as linhas.', 'SELECT COUNT(*) AS ___ FROM alarmes;'],
    solution: 'SELECT COUNT(*) AS total_alarmes FROM alarmes;',
    takeaway: 'COUNT(*) conta linhas; COUNT(coluna) conta apenas valores não nulos daquela coluna.',
  },
  {
    id: '4.2', moduleId: 4, difficulty: 'facil', title: 'Estatística do spindle',
    context: 'Para o relatório de condição do CUS-202, a engenharia quer a menor, a maior e a média das leituras do sensor TT-202 (sensor_id = 10).',
    objective: 'Retorne a menor leitura, a maior leitura e a média (arredondada a 2 casas) do sensor 10.',
    expectedColumns: ['minima', 'maxima', 'media'],
    tables: ['leituras'],
    hints: ['MIN, MAX e AVG resumem uma coluna inteira.', 'ROUND(valor, 2) arredonda para duas casas.', 'SELECT MIN(valor), MAX(valor), ROUND(AVG(valor), 2) FROM leituras WHERE ___;'],
    solution: 'SELECT MIN(valor) AS minima, MAX(valor) AS maxima, ROUND(AVG(valor), 2) AS media FROM leituras WHERE sensor_id = 10;',
    takeaway: 'Funções de agregação respeitam o WHERE: primeiro as linhas são filtradas, depois resumidas.',
  },
  {
    id: '4.3', moduleId: 4, difficulty: 'medio', title: 'Custo das ordens concluídas',
    context: 'A controladoria quer o custo total e o custo médio por ordem, considerando apenas ordens já concluídas.',
    objective: 'Retorne o custo total e o custo médio (2 casas) das ordens com status concluida.',
    expectedColumns: ['custo_total', 'custo_medio'],
    tables: ['ordens_manutencao'],
    hints: ['SUM soma; AVG calcula a média.', "Filtre status = 'concluida' antes de agregar.", "SELECT SUM(custo), ROUND(AVG(custo), 2) FROM ordens_manutencao WHERE ___;"],
    solution: "SELECT ROUND(SUM(custo), 2) AS custo_total, ROUND(AVG(custo), 2) AS custo_medio FROM ordens_manutencao WHERE status = 'concluida';",
    takeaway: 'Indicadores financeiros quase sempre precisam de um filtro de status: ordens canceladas ou abertas distorcem a média.',
  },
  {
    id: '4.4', moduleId: 4, difficulty: 'medio', title: 'Ativos com alarme crítico',
    context: 'Quantos equipamentos diferentes geraram pelo menos um alarme crítico? A resposta define quantas inspeções extras serão programadas.',
    objective: 'Retorne a quantidade de equipamentos distintos com alarmes de severidade critica.',
    expectedColumns: ['equipamentos'],
    tables: ['alarmes'],
    hints: ['Um mesmo equipamento pode ter vários alarmes: contar linhas não basta.', 'COUNT aceita DISTINCT dentro dos parênteses.', "SELECT COUNT(DISTINCT ___) FROM alarmes WHERE severidade = 'critica';"],
    solution: "SELECT COUNT(DISTINCT equipamento_id) AS equipamentos FROM alarmes WHERE severidade = 'critica';",
    takeaway: 'COUNT(DISTINCT x) é a forma direta de contar entidades únicas dentro de um conjunto de eventos.',
  },
  {
    id: '4.5', moduleId: 4, difficulty: 'dificil', title: 'Taxa de reconhecimento',
    context: 'Meta da operação: reconhecer pelo menos 90% dos alarmes. Qual foi a taxa de reconhecimento em setembro?',
    objective: 'Retorne o percentual de alarmes reconhecidos (reconhecido = 1) sobre o total, com 1 casa decimal (ex.: 78.4).',
    expectedColumns: ['taxa_reconhecimento'],
    tables: ['alarmes'],
    hints: [
      'reconhecido vale 0 ou 1, então SUM(reconhecido) conta os reconhecidos.',
      'Divisão entre inteiros no SQLite descarta a parte decimal: 122 / 174 resulta em 0. Multiplique por 100.0 antes de dividir.',
      'SELECT ROUND(100.0 * SUM(reconhecido) / ___, 1) FROM alarmes;',
    ],
    solution: 'SELECT ROUND(100.0 * SUM(reconhecido) / COUNT(*), 1) AS taxa_reconhecimento FROM alarmes;',
    takeaway: 'Multiplicar por 100.0 (com ponto) força a divisão em ponto flutuante. Esse detalhe causa muitos indicadores zerados em produção!',
  },

  // =========================================================================
  // 5. GROUP BY e HAVING
  // =========================================================================
  {
    id: '5.1', moduleId: 5, difficulty: 'facil', title: 'Ativos por linha',
    context: 'Para dimensionar a equipe de manutenção, é preciso saber quantos equipamentos existem em cada linha.',
    objective: 'Retorne o linha_id e a quantidade de equipamentos de cada linha.',
    expectedColumns: ['linha_id', 'qtd_equipamentos'],
    tables: ['equipamentos'],
    hints: ['GROUP BY cria um grupo para cada valor distinto da coluna.', 'A agregação é calculada para cada grupo.', 'SELECT linha_id, COUNT(*) FROM equipamentos GROUP BY ___;'],
    solution: 'SELECT linha_id, COUNT(*) AS qtd_equipamentos FROM equipamentos GROUP BY linha_id;',
    concept: GROUP,
    takeaway: 'Toda coluna no SELECT que não está dentro de uma agregação deve estar no GROUP BY.',
  },
  {
    id: '5.2', moduleId: 5, difficulty: 'facil', title: 'Custo por tipo de manutenção',
    context: 'A gestão quer comparar quanto foi gasto em manutenção corretiva, preventiva e preditiva no trimestre.',
    objective: 'Retorne o tipo de ordem e o custo total (2 casas) de cada tipo.',
    expectedColumns: ['tipo', 'custo_total'],
    tables: ['ordens_manutencao'],
    hints: ['Agrupe pelo tipo.', 'SUM(custo) dentro de cada grupo.', 'SELECT tipo, ROUND(SUM(custo), 2) FROM ordens_manutencao GROUP BY ___;'],
    solution: 'SELECT tipo, ROUND(SUM(custo), 2) AS custo_total FROM ordens_manutencao GROUP BY tipo;',
    concept: GROUP,
    takeaway: 'Uma planta madura gasta mais em preventiva/preditiva do que em corretiva. Compare os números que você obteve!',
  },
  {
    id: '5.3', moduleId: 5, difficulty: 'medio', title: 'Maus atores',
    context: 'Na metodologia de confiabilidade, “maus atores” são os equipamentos com falhas repetitivas. O critério da planta: mais de 3 ordens corretivas no trimestre.',
    objective: 'Retorne equipamento_id e a quantidade de ordens corretivas dos equipamentos com mais de 3 corretivas.',
    expectedColumns: ['equipamento_id', 'qtd_corretivas'],
    tables: ['ordens_manutencao'],
    hints: [
      'Filtre o tipo antes de agrupar (WHERE) e o resultado da contagem depois de agrupar.',
      'HAVING filtra grupos usando agregações.',
      "WHERE tipo = 'corretiva' GROUP BY equipamento_id HAVING COUNT(*) ___",
    ],
    solution: `SELECT equipamento_id, COUNT(*) AS qtd_corretivas
FROM ordens_manutencao
WHERE tipo = 'corretiva'
GROUP BY equipamento_id
HAVING COUNT(*) > 3;`,
    concept: GROUP,
    takeaway: 'WHERE atua nas linhas (antes do agrupamento); HAVING atua nos grupos (depois).',
  },
  {
    id: '5.4', moduleId: 5, difficulty: 'medio', title: 'Horas perdidas por tipo de evento',
    context: 'O MES registra paradas, setups e microparadas. O PCP quer saber quantos eventos de cada tipo ocorreram e quantas horas cada tipo consumiu.',
    objective: 'Retorne o tipo de evento, a quantidade de eventos e o total de horas (soma de duracao_min ÷ 60, com 2 casas).',
    expectedColumns: ['tipo', 'qtd_eventos', 'horas'],
    tables: ['eventos_operacionais'],
    hints: ['Agrupe por tipo e use COUNT e SUM.', 'Para converter minutos em horas, divida por 60.0.', 'SELECT tipo, COUNT(*), ROUND(SUM(duracao_min) / 60.0, 2) FROM eventos_operacionais GROUP BY ___;'],
    solution: 'SELECT tipo, COUNT(*) AS qtd_eventos, ROUND(SUM(duracao_min) / 60.0, 2) AS horas FROM eventos_operacionais GROUP BY tipo;',
    concept: GROUP,
    takeaway: 'SUM ignora valores NULL: eventos ainda em aberto (sem duração) não entram na soma, mas entram no COUNT(*).',
  },
  {
    id: '5.5', moduleId: 5, difficulty: 'dificil', title: 'Tempo de resposta a alarmes',
    context: 'Quanto tempo, em média, a operação leva para reconhecer um alarme? A resposta deve ser separada por severidade — esperamos que alarmes críticos sejam reconhecidos mais rápido.',
    objective: 'Para cada severidade, retorne o tempo médio de reconhecimento em minutos (1 casa), considerando apenas alarmes reconhecidos.',
    expectedColumns: ['severidade', 'tempo_medio_min'],
    tables: ['alarmes'],
    hints: [
      'julianday(data) converte uma data em número de dias. A diferença entre duas datas em dias, × 1440, dá minutos.',
      'Alarmes não reconhecidos têm data_reconhecimento NULL — AVG ignora NULL, mas filtrar deixa a intenção explícita.',
      'SELECT severidade, ROUND(AVG((julianday(data_reconhecimento) - julianday(data_hora)) * 1440), 1) FROM alarmes WHERE reconhecido = 1 GROUP BY ___;',
    ],
    solution: `SELECT severidade,
       ROUND(AVG((julianday(data_reconhecimento) - julianday(data_hora)) * 1440), 1) AS tempo_medio_min
FROM alarmes
WHERE reconhecido = 1
GROUP BY severidade;`,
    concept: GROUP,
    takeaway: 'julianday() é a ferramenta do SQLite para cálculos de duração: × 24 para horas, × 1440 para minutos.',
  },

  // =========================================================================
  // 6. INNER JOIN
  // =========================================================================
  {
    id: '6.1', moduleId: 6, difficulty: 'facil', title: 'Equipamento e sua linha',
    context: 'O relatório de ativos mostra linha_id = 2, mas ninguém na reunião decorou os ids. Precisamos do nome da linha.',
    objective: 'Retorne a tag do equipamento, o nome do equipamento e o nome da linha de produção a que ele pertence.',
    expectedColumns: ['tag', 'equipamento', 'linha'],
    tables: ['equipamentos', 'linhas_producao'],
    hints: [
      'equipamentos.linha_id aponta para linhas_producao.id.',
      'Use aliases curtos (e, l) e qualifique as colunas: as duas tabelas têm a coluna nome!',
      'FROM equipamentos e JOIN linhas_producao l ON l.id = ___',
    ],
    solution: `SELECT e.tag, e.nome AS equipamento, l.nome AS linha
FROM equipamentos e
JOIN linhas_producao l ON l.id = e.linha_id;`,
    concept: JOIN,
    takeaway: 'O ON define como as linhas das duas tabelas se correspondem — normalmente chave estrangeira = chave primária.',
  },
  {
    id: '6.2', moduleId: 6, difficulty: 'facil', title: 'Mapa de instrumentação',
    context: 'A equipe de instrumentação quer saber em qual equipamento cada sensor está instalado.',
    objective: 'Retorne a tag do sensor, o tipo do sensor e a tag do equipamento.',
    expectedColumns: ['tag_sensor', 'tipo', 'tag_equipamento'],
    tables: ['sensores', 'equipamentos'],
    hints: [
      'As duas tabelas têm uma coluna chamada tag — e também tipo.',
      'Sem prefixo, o banco reclama de “ambiguous column name”.',
      'SELECT s.tag, s.tipo, e.tag FROM sensores s JOIN equipamentos e ON ___',
    ],
    solution: `SELECT s.tag AS tag_sensor, s.tipo, e.tag AS tag_equipamento
FROM sensores s
JOIN equipamentos e ON e.id = s.equipamento_id;`,
    concept: JOIN,
    takeaway: 'Sempre qualifique colunas em consultas com JOIN, mesmo quando não há ambiguidade: a consulta fica mais clara e resistente a mudanças.',
  },
  {
    id: '6.3', moduleId: 6, difficulty: 'medio', title: 'Equipamentos superaquecidos',
    context: 'Identifique quais equipamentos apresentaram temperatura média superior a 80 °C durante setembro de 2026. Eles entrarão na rota de termografia.',
    objective: 'Retorne a tag do equipamento e a temperatura média (2 casas) dos equipamentos cujos sensores de temperatura tiveram média acima de 80 °C em setembro/2026.',
    expectedColumns: ['tag', 'temperatura_media'],
    tables: ['equipamentos', 'sensores', 'leituras'],
    hints: [
      'O caminho é equipamentos → sensores → leituras. Apenas sensores do tipo temperatura interessam.',
      'Junte as três tabelas, filtre tipo e período no WHERE, agrupe por equipamento e filtre a média no HAVING.',
      `SELECT e.tag, ROUND(AVG(l.valor), 2)
FROM equipamentos e
JOIN sensores s ON s.equipamento_id = e.id
JOIN leituras l ON l.sensor_id = s.id
WHERE s.tipo = 'temperatura' AND l.data_hora >= '2026-09-01' AND l.data_hora < '2026-10-01'
GROUP BY e.tag
HAVING ___`,
    ],
    solution: `SELECT e.tag, ROUND(AVG(l.valor), 2) AS temperatura_media
FROM equipamentos e
JOIN sensores s ON s.equipamento_id = e.id
JOIN leituras l ON l.sensor_id = s.id
WHERE s.tipo = 'temperatura'
  AND l.data_hora >= '2026-09-01' AND l.data_hora < '2026-10-01'
GROUP BY e.id, e.tag
HAVING AVG(l.valor) > 80;`,
    concept: JOIN,
    takeaway: 'Sem o filtro s.tipo = \'temperatura\', correntes de 145 A e pressões de 185 bar entrariam na “média de temperatura”. Sempre confira as unidades!',
  },
  {
    id: '6.4', moduleId: 6, difficulty: 'medio', title: 'Alarmes críticos por linha',
    context: 'Qual linha de produção concentra os alarmes críticos? O gerente de cada linha receberá o número na reunião diária.',
    objective: 'Retorne o nome da linha e a quantidade de alarmes críticos dessa linha (apenas linhas com pelo menos um).',
    expectedColumns: ['linha', 'alarmes_criticos'],
    tables: ['alarmes', 'equipamentos', 'linhas_producao'],
    hints: [
      'alarmes tem equipamento_id; equipamentos tem linha_id.',
      'Encadeie dois JOINs e agrupe pelo nome da linha.',
      "FROM alarmes a JOIN equipamentos e ON e.id = a.equipamento_id JOIN linhas_producao l ON ___ WHERE a.severidade = 'critica' GROUP BY l.nome",
    ],
    solution: `SELECT l.nome AS linha, COUNT(*) AS alarmes_criticos
FROM alarmes a
JOIN equipamentos e ON e.id = a.equipamento_id
JOIN linhas_producao l ON l.id = e.linha_id
WHERE a.severidade = 'critica'
GROUP BY l.id, l.nome;`,
    concept: JOIN,
    takeaway: 'Encadear JOINs é como seguir as setas do diagrama de relacionamentos: alarme → equipamento → linha.',
  },
  {
    id: '6.5', moduleId: 6, difficulty: 'dificil', title: 'Quem consertou o quê',
    context: 'Auditoria de horas: para cada ordem corretiva concluída, o RH quer o equipamento, a linha e o técnico responsável, com as horas apontadas.',
    objective: 'Retorne o id da ordem, a tag do equipamento, o nome da linha, o nome do técnico e as horas_trabalhadas das ordens corretivas concluídas.',
    expectedColumns: ['ordem', 'tag', 'linha', 'tecnico', 'horas_trabalhadas'],
    tables: ['ordens_manutencao', 'equipamentos', 'linhas_producao', 'operadores'],
    hints: [
      'São quatro tabelas. O técnico está em operadores, ligado por ordens_manutencao.tecnico_id.',
      'Três JOINs: ordem → equipamento, equipamento → linha, ordem → operador.',
      `FROM ordens_manutencao o
JOIN equipamentos e ON e.id = o.equipamento_id
JOIN linhas_producao l ON l.id = e.linha_id
JOIN operadores op ON op.id = ___
WHERE o.tipo = 'corretiva' AND o.status = 'concluida'`,
    ],
    solution: `SELECT o.id AS ordem, e.tag, l.nome AS linha, op.nome AS tecnico, o.horas_trabalhadas
FROM ordens_manutencao o
JOIN equipamentos e ON e.id = o.equipamento_id
JOIN linhas_producao l ON l.id = e.linha_id
JOIN operadores op ON op.id = o.tecnico_id
WHERE o.tipo = 'corretiva' AND o.status = 'concluida';`,
    concept: JOIN,
    takeaway: 'Uma mesma tabela (operadores) pode ter papéis diferentes: técnico da ordem, operador que reconheceu um alarme... Aliases deixam o papel claro.',
  },

  // =========================================================================
  // 7. LEFT JOIN
  // =========================================================================
  {
    id: '7.1', moduleId: 7, difficulty: 'facil', title: 'Todos os colaboradores e suas linhas',
    context: 'A lista de contatos de emergência deve incluir todo mundo — inclusive técnicos e engenheiros que não pertencem a uma linha.',
    objective: 'Retorne o nome de todos os operadores e o nome da linha correspondente (NULL quando não houver).',
    expectedColumns: ['nome', 'linha'],
    tables: ['operadores', 'linhas_producao'],
    hints: [
      'Um INNER JOIN removeria quem tem linha_id NULL.',
      'LEFT JOIN mantém todas as linhas da tabela da esquerda.',
      'SELECT op.nome, l.nome FROM operadores op LEFT JOIN linhas_producao l ON ___',
    ],
    solution: `SELECT op.nome, l.nome AS linha
FROM operadores op
LEFT JOIN linhas_producao l ON l.id = op.linha_id;`,
    concept: LEFTJ,
    takeaway: 'A tabela que você quer preservar inteira deve ficar à ESQUERDA do LEFT JOIN.',
  },
  {
    id: '7.2', moduleId: 7, difficulty: 'medio', title: 'Ativos esquecidos',
    context: 'Auditoria de PCM: existem equipamentos que não receberam nenhuma ordem de manutenção no trimestre — nem preventiva? Isso pode indicar falha no plano.',
    objective: 'Retorne tag e nome dos equipamentos que não possuem nenhuma ordem de manutenção.',
    expectedColumns: ['tag', 'nome'],
    tables: ['equipamentos', 'ordens_manutencao'],
    hints: [
      'Faça o LEFT JOIN e observe: equipamentos sem ordem aparecem com as colunas da ordem em NULL.',
      'Filtre as linhas onde a chave da tabela da direita é NULL (anti-join).',
      'FROM equipamentos e LEFT JOIN ordens_manutencao o ON o.equipamento_id = e.id WHERE o.id IS ___',
    ],
    solution: `SELECT e.tag, e.nome
FROM equipamentos e
LEFT JOIN ordens_manutencao o ON o.equipamento_id = e.id
WHERE o.id IS NULL;`,
    concept: LEFTJ,
    takeaway: 'O padrão LEFT JOIN + WHERE direita.id IS NULL (anti-join) responde perguntas do tipo “quem nunca...”.',
  },
  {
    id: '7.3', moduleId: 7, difficulty: 'medio', title: 'Alarmes por equipamento (com zeros)',
    context: 'O dashboard de alarmes precisa listar TODOS os equipamentos, inclusive os que não geraram alarme — zero também é informação.',
    objective: 'Retorne a tag de cada equipamento e a quantidade de alarmes dele (0 para quem não teve alarmes).',
    expectedColumns: ['tag', 'qtd_alarmes'],
    tables: ['equipamentos', 'alarmes'],
    hints: [
      'Use LEFT JOIN a partir de equipamentos e agrupe.',
      'COUNT(*) conta a linha do equipamento mesmo sem alarme (resultado 1!). Conte uma coluna da tabela da direita.',
      'SELECT e.tag, COUNT(a.___) FROM equipamentos e LEFT JOIN alarmes a ON a.equipamento_id = e.id GROUP BY e.tag',
    ],
    solution: `SELECT e.tag, COUNT(a.id) AS qtd_alarmes
FROM equipamentos e
LEFT JOIN alarmes a ON a.equipamento_id = e.id
GROUP BY e.id, e.tag;`,
    concept: LEFTJ,
    takeaway: 'Com LEFT JOIN, use COUNT(coluna_da_direita): ela é NULL quando não há correspondência e não é contada.',
  },
  {
    id: '7.4', moduleId: 7, difficulty: 'dificil', title: 'Backlog por linha',
    context: 'Backlog de manutenção = ordens abertas ou em andamento. O gerente quer o backlog de cada linha, mostrando 0 nas linhas sem pendências.',
    objective: 'Retorne o nome de cada linha e a quantidade de ordens com status aberta ou em_andamento dos seus equipamentos (incluindo linhas com 0).',
    expectedColumns: ['linha', 'backlog'],
    tables: ['linhas_producao', 'equipamentos', 'ordens_manutencao'],
    hints: [
      'Se o filtro de status ficar no WHERE, as linhas sem ordens (NULL) são eliminadas e o LEFT JOIN vira, na prática, um INNER JOIN.',
      'Coloque a condição de status dentro do ON do LEFT JOIN com ordens_manutencao.',
      `FROM linhas_producao l
JOIN equipamentos e ON e.linha_id = l.id
LEFT JOIN ordens_manutencao o ON o.equipamento_id = e.id AND o.status IN (___)
GROUP BY l.nome`,
    ],
    solution: `SELECT l.nome AS linha, COUNT(o.id) AS backlog
FROM linhas_producao l
JOIN equipamentos e ON e.linha_id = l.id
LEFT JOIN ordens_manutencao o
       ON o.equipamento_id = e.id
      AND o.status IN ('aberta', 'em_andamento')
GROUP BY l.id, l.nome;`,
    concept: LEFTJ,
    takeaway: 'No LEFT JOIN, condições sobre a tabela da direita vão no ON. No WHERE, elas descartam as linhas preservadas.',
  },

  // =========================================================================
  // 8. Subqueries
  // =========================================================================
  {
    id: '8.1', moduleId: 8, difficulty: 'facil', title: 'Ordens acima da média',
    context: 'Ordens com custo acima da média merecem análise de causa raiz. Qual é a lista?',
    objective: 'Retorne id, tipo e custo das ordens cujo custo é maior que o custo médio de todas as ordens.',
    expectedColumns: ['id', 'tipo', 'custo'],
    tables: ['ordens_manutencao'],
    hints: [
      'WHERE custo > AVG(custo) não funciona: agregações não podem ir no WHERE.',
      'Calcule a média em uma subconsulta entre parênteses.',
      'WHERE custo > (SELECT ___ FROM ordens_manutencao)',
    ],
    solution: 'SELECT id, tipo, custo FROM ordens_manutencao WHERE custo > (SELECT AVG(custo) FROM ordens_manutencao);',
    concept: SUBQ,
    takeaway: 'Uma subconsulta escalar retorna um único valor e pode ser usada em qualquer lugar onde caberia uma constante.',
  },
  {
    id: '8.2', moduleId: 8, difficulty: 'medio', title: 'Equipamentos sob alerta',
    context: 'A engenharia vai abrir inspeção extra em todo equipamento que teve pelo menos um alarme crítico.',
    objective: 'Retorne tag e nome dos equipamentos que possuem ao menos um alarme de severidade critica.',
    expectedColumns: ['tag', 'nome'],
    tables: ['equipamentos', 'alarmes'],
    hints: [
      'Primeiro descubra quais equipamento_id têm alarme crítico; depois filtre equipamentos por essa lista.',
      'O operador IN aceita uma subconsulta que retorna uma coluna.',
      "SELECT tag, nome FROM equipamentos WHERE id IN (SELECT ___ FROM alarmes WHERE severidade = 'critica')",
    ],
    solution: `SELECT tag, nome
FROM equipamentos
WHERE id IN (SELECT equipamento_id FROM alarmes WHERE severidade = 'critica');`,
    concept: SUBQ,
    takeaway: 'Com IN não há duplicação: um JOIN direto repetiria o equipamento para cada alarme (e exigiria DISTINCT).',
  },
  {
    id: '8.3', moduleId: 8, difficulty: 'dificil', title: 'Operadores sem reconhecimentos',
    context: 'Treinamento de resposta a alarmes: quais operadores de produção/utilidades não reconheceram nenhum alarme em setembro?',
    objective: "Retorne o nome dos colaboradores cuja função começa com 'Operador' e que não aparecem como operador_id em nenhum alarme.",
    expectedColumns: ['nome'],
    tables: ['operadores', 'alarmes'],
    hints: [
      "Filtre a função com LIKE 'Operador%'.",
      'Armadilha: alarmes.operador_id contém NULL (alarmes não reconhecidos). NOT IN com uma lista que contém NULL nunca é verdadeiro! Use NOT EXISTS, ou exclua os NULL dentro da subconsulta.',
      `SELECT nome FROM operadores o
WHERE funcao LIKE 'Operador%'
  AND NOT EXISTS (SELECT 1 FROM alarmes a WHERE a.operador_id = ___)`,
    ],
    solution: `SELECT nome
FROM operadores o
WHERE funcao LIKE 'Operador%'
  AND NOT EXISTS (SELECT 1 FROM alarmes a WHERE a.operador_id = o.id);`,
    concept: SUBQ,
    takeaway: 'x NOT IN (1, 2, NULL) é sempre “desconhecido”, portanto nenhuma linha passa. NOT EXISTS não tem esse problema.',
  },
  {
    id: '8.4', moduleId: 8, difficulty: 'dificil', title: 'Pico de vibração',
    context: 'Para cada sensor de vibração, o analista preditivo quer saber o maior valor medido em setembro e QUANDO ele ocorreu.',
    objective: 'Retorne a tag do sensor de vibração, a data_hora e o valor da leitura máxima de cada sensor.',
    expectedColumns: ['tag', 'data_hora', 'valor'],
    tables: ['sensores', 'leituras'],
    hints: [
      'MAX(valor) com GROUP BY dá o valor, mas não a data em que ocorreu.',
      'Use uma subconsulta correlacionada: para cada leitura, compare com o máximo do MESMO sensor.',
      `... WHERE s.tipo = 'vibracao'
  AND l.valor = (SELECT MAX(l2.valor) FROM leituras l2 WHERE l2.sensor_id = ___)`,
    ],
    solution: `SELECT s.tag, l.data_hora, l.valor
FROM sensores s
JOIN leituras l ON l.sensor_id = s.id
WHERE s.tipo = 'vibracao'
  AND l.valor = (SELECT MAX(l2.valor) FROM leituras l2 WHERE l2.sensor_id = s.id);`,
    concept: SUBQ,
    takeaway: 'Uma subconsulta correlacionada referencia a consulta externa (s.id) e é reavaliada para cada linha.',
  },
  {
    id: '8.5', moduleId: 8, difficulty: 'dificil', title: 'Custo médio por ativo',
    context: 'Benchmark de custos: qual é o custo médio de manutenção por equipamento no trimestre, considerando só equipamentos que tiveram ordens e excluindo ordens canceladas?',
    objective: 'Retorne um único valor: a média (2 casas) dos custos totais por equipamento.',
    expectedColumns: ['custo_medio_por_equipamento'],
    tables: ['ordens_manutencao'],
    hints: [
      'São duas etapas: (1) somar o custo por equipamento; (2) tirar a média dessas somas.',
      'A primeira etapa pode virar uma “tabela temporária” dentro do FROM (subconsulta com alias).',
      "SELECT ROUND(AVG(total), 2) FROM (SELECT equipamento_id, SUM(custo) AS total FROM ordens_manutencao WHERE status <> 'cancelada' GROUP BY ___) t",
    ],
    solution: `SELECT ROUND(AVG(total), 2) AS custo_medio_por_equipamento
FROM (
  SELECT equipamento_id, SUM(custo) AS total
  FROM ordens_manutencao
  WHERE status <> 'cancelada'
  GROUP BY equipamento_id
) t;`,
    concept: SUBQ,
    takeaway: 'AVG(custo) direto daria a média por ORDEM, não por equipamento. Agregar em duas etapas muda completamente o indicador.',
  },

  // =========================================================================
  // 9. Window Functions
  // =========================================================================
  {
    id: '9.1', moduleId: 9, difficulty: 'medio', title: 'Ranking de custo',
    context: 'O comitê de confiabilidade quer o ranking dos equipamentos por custo total de manutenção (ordens não canceladas).',
    objective: 'Retorne tag, custo_total (2 casas) e a posição no ranking (1 = mais caro), ordenado pela posição. Considere só equipamentos com ordens.',
    expectedColumns: ['tag', 'custo_total', 'posicao'],
    tables: ['equipamentos', 'ordens_manutencao'],
    hints: [
      'Primeiro agrupe por equipamento para obter o custo total.',
      'RANK() OVER (ORDER BY ...) numera as linhas do resultado agrupado.',
      "SELECT e.tag, ROUND(SUM(o.custo), 2), RANK() OVER (ORDER BY SUM(o.custo) DESC) ... WHERE o.status <> 'cancelada' GROUP BY e.tag ORDER BY ___",
    ],
    solution: `SELECT e.tag,
       ROUND(SUM(o.custo), 2) AS custo_total,
       RANK() OVER (ORDER BY SUM(o.custo) DESC) AS posicao
FROM equipamentos e
JOIN ordens_manutencao o ON o.equipamento_id = e.id
WHERE o.status <> 'cancelada'
GROUP BY e.id, e.tag
ORDER BY posicao;`,
    options: { orderMatters: true, orderKeys: [2] },
    concept: WINDOW,
    takeaway: 'Funções de janela são calculadas DEPOIS do GROUP BY, então podem usar agregações como SUM(o.custo).',
  },
  {
    id: '9.2', moduleId: 9, difficulty: 'medio', title: 'Variação entre leituras',
    context: 'Uma subida brusca de temperatura indica falha iminente. Calcule a variação do TT-202 (sensor_id = 10) entre leituras consecutivas no dia 20/09/2026.',
    objective: 'Retorne data_hora, valor e a variação em relação à leitura anterior do mesmo dia (NULL na primeira), em ordem cronológica.',
    expectedColumns: ['data_hora', 'valor', 'variacao'],
    tables: ['leituras'],
    hints: [
      'LAG(coluna) devolve o valor da linha anterior segundo a ordem definida no OVER.',
      'variacao = valor − LAG(valor). Filtre o sensor e o dia no WHERE.',
      "SELECT data_hora, valor, ROUND(valor - LAG(valor) OVER (ORDER BY ___), 1) FROM leituras WHERE sensor_id = 10 AND data_hora >= '2026-09-20' AND data_hora < '2026-09-21' ORDER BY data_hora",
    ],
    solution: `SELECT data_hora, valor,
       ROUND(valor - LAG(valor) OVER (ORDER BY data_hora), 1) AS variacao
FROM leituras
WHERE sensor_id = 10
  AND data_hora >= '2026-09-20' AND data_hora < '2026-09-21'
ORDER BY data_hora;`,
    options: { orderMatters: true, orderKeys: [0] },
    concept: WINDOW,
    takeaway: 'Sem window functions, comparar uma linha com a anterior exigiria um self-join complicado.',
  },
  {
    id: '9.3', moduleId: 9, difficulty: 'dificil', title: 'Média móvel do spindle',
    context: 'Leituras isoladas têm ruído. A engenharia quer a média móvel de 3 leituras (a atual e as duas anteriores) do TT-202 (sensor_id = 10) entre 25 e 26 de setembro (inclusive).',
    objective: 'Retorne data_hora, valor e a média móvel de 3 leituras (2 casas), em ordem cronológica, considerando apenas as leituras do período.',
    expectedColumns: ['data_hora', 'valor', 'media_movel'],
    tables: ['leituras'],
    hints: [
      'AVG também pode ser usada como função de janela.',
      'O “tamanho” da janela é definido por ROWS BETWEEN ... AND CURRENT ROW.',
      "ROUND(AVG(valor) OVER (ORDER BY data_hora ROWS BETWEEN ___ PRECEDING AND CURRENT ROW), 2)",
    ],
    solution: `SELECT data_hora, valor,
       ROUND(AVG(valor) OVER (ORDER BY data_hora ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS media_movel
FROM leituras
WHERE sensor_id = 10
  AND data_hora >= '2026-09-25' AND data_hora < '2026-09-27'
ORDER BY data_hora;`,
    options: { orderMatters: true, orderKeys: [0] },
    concept: WINDOW,
    takeaway: 'Nas duas primeiras linhas a janela tem menos de 3 leituras — a média usa só as disponíveis.',
  },
  {
    id: '9.4', moduleId: 9, difficulty: 'dificil', title: 'Última intervenção de cada ativo',
    context: 'O planejador quer ver, para cada equipamento que já recebeu manutenção, qual foi a ordem mais recente (pela data de abertura) e de que tipo era.',
    objective: 'Retorne a tag do equipamento, a data_abertura e o tipo da ordem mais recente de cada equipamento.',
    expectedColumns: ['tag', 'data_abertura', 'tipo'],
    tables: ['equipamentos', 'ordens_manutencao'],
    hints: [
      'ROW_NUMBER() com PARTITION BY reinicia a numeração para cada equipamento.',
      'Numere as ordens de cada equipamento da mais recente para a mais antiga e fique com a de número 1 — o filtro precisa ser feito em uma consulta externa.',
      `WITH ranqueadas AS (
  SELECT o.*, ROW_NUMBER() OVER (PARTITION BY o.equipamento_id ORDER BY o.data_abertura DESC) AS rn
  FROM ordens_manutencao o
)
SELECT e.tag, r.data_abertura, r.tipo FROM ranqueadas r JOIN equipamentos e ON ___ WHERE rn = 1`,
    ],
    solution: `WITH ranqueadas AS (
  SELECT o.*,
         ROW_NUMBER() OVER (PARTITION BY o.equipamento_id ORDER BY o.data_abertura DESC) AS rn
  FROM ordens_manutencao o
)
SELECT e.tag, r.data_abertura, r.tipo
FROM ranqueadas r
JOIN equipamentos e ON e.id = r.equipamento_id
WHERE r.rn = 1;`,
    concept: WINDOW,
    takeaway: 'PARTITION BY é como um GROUP BY que não colapsa as linhas: cada linha continua existindo, mas a função é calculada dentro do seu grupo.',
  },
  {
    id: '9.5', moduleId: 9, difficulty: 'medio', title: 'Custo acumulado no trimestre',
    context: 'O controller acompanha o consumo do orçamento anual de manutenção mês a mês.',
    objective: "Retorne o mês ('AAAA-MM', pela data de abertura), o custo do mês e o custo acumulado até aquele mês (ambos com 2 casas), em ordem cronológica.",
    expectedColumns: ['mes', 'custo_mes', 'custo_acumulado'],
    tables: ['ordens_manutencao'],
    hints: [
      "strftime('%Y-%m', data_abertura) extrai ano e mês.",
      'Agrupe por mês e aplique SUM(SUM(custo)) OVER (ORDER BY mes) — ou calcule o mensal em uma CTE.',
      "SELECT strftime('%Y-%m', data_abertura) AS mes, ROUND(SUM(custo), 2), ROUND(SUM(SUM(custo)) OVER (ORDER BY ___), 2) FROM ordens_manutencao GROUP BY mes ORDER BY mes",
    ],
    solution: `SELECT strftime('%Y-%m', data_abertura) AS mes,
       ROUND(SUM(custo), 2) AS custo_mes,
       ROUND(SUM(SUM(custo)) OVER (ORDER BY strftime('%Y-%m', data_abertura)), 2) AS custo_acumulado
FROM ordens_manutencao
GROUP BY mes
ORDER BY mes;`,
    options: { orderMatters: true, orderKeys: [0] },
    concept: WINDOW,
    takeaway: 'SUM(...) OVER (ORDER BY ...) gera totais acumulados (running total) sem nenhum self-join.',
  },

  // =========================================================================
  // 10. Desafios integradores
  // =========================================================================
  {
    id: '10.1', moduleId: 10, difficulty: 'medio', title: 'MTTR por equipamento',
    context: 'MTTR (Mean Time To Repair) é o tempo médio para reparar uma falha. O PCM quer o MTTR de cada equipamento, calculado a partir das ordens corretivas concluídas (de data_inicio a data_conclusao).',
    objective: 'Retorne tag, número de reparos e MTTR em horas (2 casas), do maior MTTR para o menor.',
    expectedColumns: ['tag', 'reparos', 'mttr_horas'],
    tables: ['equipamentos', 'ordens_manutencao'],
    hints: [
      'Horas entre duas datas: (julianday(fim) − julianday(inicio)) × 24.',
      "Filtre tipo = 'corretiva' AND status = 'concluida', junte com equipamentos e agrupe.",
      `SELECT e.tag, COUNT(*), ROUND(AVG((julianday(o.data_conclusao) - julianday(o.data_inicio)) * 24), 2) AS mttr_horas
FROM ordens_manutencao o JOIN equipamentos e ON ___
WHERE ... GROUP BY e.tag ORDER BY mttr_horas DESC`,
    ],
    solution: `SELECT e.tag,
       COUNT(*) AS reparos,
       ROUND(AVG((julianday(o.data_conclusao) - julianday(o.data_inicio)) * 24), 2) AS mttr_horas
FROM ordens_manutencao o
JOIN equipamentos e ON e.id = o.equipamento_id
WHERE o.tipo = 'corretiva' AND o.status = 'concluida'
GROUP BY e.id, e.tag
ORDER BY mttr_horas DESC;`,
    options: { orderMatters: true, orderKeys: [2] },
    takeaway: 'MTTR alto aponta para problemas de manutenibilidade: falta de peças, de procedimento ou de capacitação.',
  },
  {
    id: '10.2', moduleId: 10, difficulty: 'dificil', title: 'Disponibilidade por linha',
    context: 'Disponibilidade = (tempo total − tempo de parada não programada) ÷ tempo total. O trimestre (jul–set/2026) tem 92 dias = 2208 horas.',
    objective: "Para cada linha, retorne o nome, as horas de parada não programada (soma de duracao_min dos eventos 'parada_nao_programada' ÷ 60, 2 casas) e a disponibilidade em % (2 casas).",
    expectedColumns: ['linha', 'horas_parada', 'disponibilidade_pct'],
    tables: ['linhas_producao', 'eventos_operacionais'],
    hints: [
      'eventos_operacionais já tem linha_id — não é preciso passar por equipamentos.',
      'disponibilidade = 100 × (2208 − horas_parada) ÷ 2208. Eventos ainda abertos têm duracao_min NULL e não somam.',
      `SELECT l.nome, ROUND(SUM(ev.duracao_min) / 60.0, 2),
       ROUND(100.0 * (2208 - SUM(ev.duracao_min) / 60.0) / 2208, 2)
FROM linhas_producao l JOIN eventos_operacionais ev ON ev.linha_id = l.id
WHERE ev.tipo = ___ GROUP BY l.nome`,
    ],
    solution: `SELECT l.nome AS linha,
       ROUND(SUM(ev.duracao_min) / 60.0, 2) AS horas_parada,
       ROUND(100.0 * (2208 - SUM(ev.duracao_min) / 60.0) / 2208, 2) AS disponibilidade_pct
FROM linhas_producao l
JOIN eventos_operacionais ev ON ev.linha_id = l.id
WHERE ev.tipo = 'parada_nao_programada'
GROUP BY l.id, l.nome;`,
    takeaway: 'Disponibilidade é um dos três pilares do OEE (junto com performance e qualidade).',
  },
  {
    id: '10.3', moduleId: 10, difficulty: 'dificil', title: 'Intervalo entre falhas do CUS-202',
    context: 'O CUS-202 (equipamento_id = 6) falhou várias vezes. A engenharia quer ver o intervalo, em horas, entre o início de cada parada não programada e o início da anterior, para avaliar se as falhas estão ficando mais frequentes.',
    objective: 'Retorne data_inicio de cada parada não programada do equipamento 6 e as horas desde a falha anterior (2 casas; NULL na primeira), em ordem cronológica.',
    expectedColumns: ['data_inicio', 'horas_desde_anterior'],
    tables: ['eventos_operacionais'],
    hints: [
      'LAG(data_inicio) traz a data da falha anterior.',
      'Diferença em horas: (julianday(atual) − julianday(anterior)) × 24.',
      "SELECT data_inicio, ROUND((julianday(data_inicio) - julianday(LAG(data_inicio) OVER (ORDER BY data_inicio))) * 24, 2) FROM eventos_operacionais WHERE equipamento_id = 6 AND tipo = ___ ORDER BY data_inicio",
    ],
    solution: `SELECT data_inicio,
       ROUND((julianday(data_inicio) - julianday(LAG(data_inicio) OVER (ORDER BY data_inicio))) * 24, 2) AS horas_desde_anterior
FROM eventos_operacionais
WHERE equipamento_id = 6 AND tipo = 'parada_nao_programada'
ORDER BY data_inicio;`,
    options: { orderMatters: true, orderKeys: [0] },
    takeaway: 'Intervalos entre falhas cada vez menores são um sinal clássico de degradação — combinado com a temperatura subindo, o diagnóstico do spindle fica claro.',
  },
  {
    id: '10.4', moduleId: 10, difficulty: 'dificil', finalChallenge: true, title: 'Desafio final: relatório de confiabilidade',
    context: `A diretoria industrial vai decidir onde investir o orçamento de 2027 e pediu um relatório de confiabilidade dos equipamentos de criticidade A no 3º trimestre de 2026 (2208 horas).

Definições oficiais da planta:
• falhas: quantidade de eventos 'parada_nao_programada' do equipamento (inclusive os ainda em aberto);
• horas_parado: soma de duracao_min desses eventos ÷ 60 (eventos em aberto não somam);
• MTTR: média de duracao_min desses eventos ÷ 60 (apenas eventos encerrados);
• MTBF: (2208 − horas_parado) ÷ falhas;
• custo_total: soma do custo de TODAS as ordens de manutenção do equipamento, exceto as canceladas;
• alarmes_criticos: quantidade de alarmes de severidade 'critica' do equipamento (0 se não houver).`,
    objective: 'Para cada equipamento de criticidade A com pelo menos uma falha, retorne: tag, nome da linha, falhas, horas_parado, mttr_h, mtbf_h, custo_total (valores decimais com 2 casas) e alarmes_criticos — do menor MTBF (menos confiável) para o maior.',
    expectedColumns: ['tag', 'linha', 'falhas', 'horas_parado', 'mttr_h', 'mtbf_h', 'custo_total', 'alarmes_criticos'],
    tables: ['equipamentos', 'linhas_producao', 'eventos_operacionais', 'ordens_manutencao', 'alarmes'],
    hints: [
      'Cuidado com o “fan-out”: juntar eventos, ordens e alarmes na mesma consulta multiplica as linhas (cada falha × cada ordem × cada alarme) e infla todas as somas.',
      'Agregue cada tabela separadamente em uma CTE (WITH) por equipamento_id e só depois junte as CTEs com equipamentos. Para alarmes, use LEFT JOIN + COALESCE(..., 0).',
      `WITH falhas AS (
  SELECT equipamento_id, COUNT(*) AS falhas, SUM(duracao_min) / 60.0 AS horas_parado, AVG(duracao_min) / 60.0 AS mttr_h
  FROM eventos_operacionais WHERE tipo = 'parada_nao_programada' GROUP BY equipamento_id
), custos AS (
  SELECT equipamento_id, SUM(custo) AS custo_total FROM ordens_manutencao WHERE ___ GROUP BY equipamento_id
), criticos AS (
  SELECT equipamento_id, COUNT(*) AS n FROM alarmes WHERE ___ GROUP BY equipamento_id
)
SELECT e.tag, l.nome, f.falhas, ..., (2208 - f.horas_parado) / f.falhas AS mtbf_h, ...
FROM equipamentos e
JOIN linhas_producao l ON ...
JOIN falhas f ON ...
LEFT JOIN custos c ON ...
LEFT JOIN criticos a ON ...
WHERE e.criticidade = 'A'
ORDER BY mtbf_h`,
    ],
    solution: `WITH falhas AS (
  SELECT equipamento_id,
         COUNT(*)                 AS falhas,
         SUM(duracao_min) / 60.0  AS horas_parado,
         AVG(duracao_min) / 60.0  AS mttr_h
  FROM eventos_operacionais
  WHERE tipo = 'parada_nao_programada'
  GROUP BY equipamento_id
),
custos AS (
  SELECT equipamento_id, SUM(custo) AS custo_total
  FROM ordens_manutencao
  WHERE status <> 'cancelada'
  GROUP BY equipamento_id
),
criticos AS (
  SELECT equipamento_id, COUNT(*) AS n
  FROM alarmes
  WHERE severidade = 'critica'
  GROUP BY equipamento_id
)
SELECT e.tag,
       l.nome                                         AS linha,
       f.falhas,
       ROUND(f.horas_parado, 2)                       AS horas_parado,
       ROUND(f.mttr_h, 2)                             AS mttr_h,
       ROUND((2208 - f.horas_parado) / f.falhas, 2)   AS mtbf_h,
       ROUND(COALESCE(c.custo_total, 0), 2)           AS custo_total,
       COALESCE(a.n, 0)                               AS alarmes_criticos
FROM equipamentos e
JOIN linhas_producao l ON l.id = e.linha_id
JOIN falhas f          ON f.equipamento_id = e.id
LEFT JOIN custos c     ON c.equipamento_id = e.id
LEFT JOIN criticos a   ON a.equipamento_id = e.id
WHERE e.criticidade = 'A'
ORDER BY mtbf_h;`,
    options: { orderMatters: true, orderKeys: [5] },
    takeaway: 'Você construiu um relatório real de engenharia de confiabilidade: CTEs para isolar cada agregação, LEFT JOIN para preservar zeros e indicadores calculados a partir de definições precisas. Esse padrão “agregue antes de juntar” evita o erro mais comum em relatórios gerenciais.',
  },
];

export const exerciseById = (id: string) => EXERCISES.find((e) => e.id === id);
export const exercisesOfModule = (moduleId: number) => EXERCISES.filter((e) => e.moduleId === moduleId);
