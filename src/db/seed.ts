/**
 * Gerador determinístico do banco industrial fictício.
 *
 * Planta: "Indústria Vale do Aço — Unidade Contagem" (fictícia), 4 linhas,
 * 16 equipamentos, 27 sensores, 3º trimestre de 2026.
 *
 * Tudo é gerado a partir de uma semente fixa: o banco é idêntico em toda
 * execução, então a resposta de referência e a consulta do aluno sempre
 * enxergam exatamente os mesmos dados.
 */
import type { Database, SqlJsStatic } from 'sql.js';

export const SCHEMA_SQL = `
CREATE TABLE linhas_producao (
  id              INTEGER PRIMARY KEY,
  nome            TEXT    NOT NULL,
  area            TEXT    NOT NULL,
  capacidade_hora INTEGER,            -- unidades/hora (NULL para utilidades)
  gerente         TEXT    NOT NULL
);

CREATE TABLE equipamentos (
  id               INTEGER PRIMARY KEY,
  tag              TEXT    NOT NULL UNIQUE,
  nome             TEXT    NOT NULL,
  tipo             TEXT    NOT NULL,
  fabricante       TEXT    NOT NULL,
  linha_id         INTEGER NOT NULL REFERENCES linhas_producao(id),
  data_instalacao  TEXT    NOT NULL,   -- 'AAAA-MM-DD'
  criticidade      TEXT    NOT NULL CHECK (criticidade IN ('A','B','C')),
  status           TEXT    NOT NULL CHECK (status IN ('operando','parado','manutencao'))
);

CREATE TABLE sensores (
  id              INTEGER PRIMARY KEY,
  tag             TEXT    NOT NULL UNIQUE,
  equipamento_id  INTEGER NOT NULL REFERENCES equipamentos(id),
  tipo            TEXT    NOT NULL CHECK (tipo IN ('temperatura','vibracao','pressao','corrente')),
  unidade         TEXT    NOT NULL,
  limite_min      REAL    NOT NULL,
  limite_max      REAL    NOT NULL
);

CREATE TABLE leituras (
  id         INTEGER PRIMARY KEY,
  sensor_id  INTEGER NOT NULL REFERENCES sensores(id),
  data_hora  TEXT    NOT NULL,         -- 'AAAA-MM-DD HH:MM:SS'
  valor      REAL    NOT NULL
);

CREATE TABLE operadores (
  id             INTEGER PRIMARY KEY,
  nome           TEXT    NOT NULL,
  matricula      TEXT    NOT NULL UNIQUE,
  funcao         TEXT    NOT NULL,
  turno          TEXT    NOT NULL CHECK (turno IN ('A','B','C')),  -- A 06-14h, B 14-22h, C 22-06h
  linha_id       INTEGER REFERENCES linhas_producao(id),           -- NULL = atende toda a planta
  data_admissao  TEXT    NOT NULL
);

CREATE TABLE alarmes (
  id                  INTEGER PRIMARY KEY,
  sensor_id           INTEGER NOT NULL REFERENCES sensores(id),
  equipamento_id      INTEGER NOT NULL REFERENCES equipamentos(id),
  data_hora           TEXT    NOT NULL,
  severidade          TEXT    NOT NULL CHECK (severidade IN ('baixa','media','alta','critica')),
  mensagem            TEXT    NOT NULL,
  reconhecido         INTEGER NOT NULL CHECK (reconhecido IN (0,1)),
  data_reconhecimento TEXT,
  operador_id         INTEGER REFERENCES operadores(id)
);

CREATE TABLE ordens_manutencao (
  id                 INTEGER PRIMARY KEY,
  equipamento_id     INTEGER NOT NULL REFERENCES equipamentos(id),
  tipo               TEXT    NOT NULL CHECK (tipo IN ('corretiva','preventiva','preditiva')),
  prioridade         TEXT    NOT NULL CHECK (prioridade IN ('baixa','media','alta','urgente')),
  status             TEXT    NOT NULL CHECK (status IN ('aberta','em_andamento','concluida','cancelada')),
  data_abertura      TEXT    NOT NULL,
  data_inicio        TEXT,
  data_conclusao     TEXT,
  tecnico_id         INTEGER REFERENCES operadores(id),
  descricao          TEXT    NOT NULL,
  horas_trabalhadas  REAL,
  custo              REAL    NOT NULL   -- R$ (mão de obra + peças)
);

CREATE TABLE eventos_operacionais (
  id              INTEGER PRIMARY KEY,
  linha_id        INTEGER NOT NULL REFERENCES linhas_producao(id),
  equipamento_id  INTEGER REFERENCES equipamentos(id),   -- NULL = evento da linha inteira (ex.: setup)
  tipo            TEXT    NOT NULL CHECK (tipo IN ('parada_nao_programada','parada_programada','setup','microparada')),
  data_inicio     TEXT    NOT NULL,
  data_fim        TEXT,                                  -- NULL = evento ainda em aberto
  duracao_min     INTEGER,
  operador_id     INTEGER REFERENCES operadores(id),
  descricao       TEXT    NOT NULL
);

CREATE INDEX idx_leituras_sensor_data ON leituras(sensor_id, data_hora);
CREATE INDEX idx_alarmes_equip ON alarmes(equipamento_id);
CREATE INDEX idx_ordens_equip ON ordens_manutencao(equipamento_id);
CREATE INDEX idx_eventos_equip ON eventos_operacionais(equipamento_id);
`;

// ---------------------------------------------------------------------------
// Utilidades determinísticas
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const T0 = Date.UTC(2026, 6, 1, 0, 0, 0); // 2026-07-01 00:00 (minuto 0)
const Q_END = Date.UTC(2026, 9, 1, 0, 0, 0); // 2026-10-01 00:00
const SEPT = Date.UTC(2026, 8, 1, 0, 0, 0);
const MIN = 60_000;

function fmt(ms: number): string {
  return new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
}
const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

// ---------------------------------------------------------------------------
// Dados mestres
// ---------------------------------------------------------------------------
const LINHAS: [number, string, string, number | null, string][] = [
  [1, 'Linha 1 - Envase', 'Envase', 1200, 'Mariana Duarte'],
  [2, 'Linha 2 - Usinagem', 'Usinagem', 300, 'Paulo Henrique Reis'],
  [3, 'Linha 3 - Montagem', 'Montagem', 450, 'Renata Campos'],
  [4, 'Linha 4 - Utilidades', 'Utilidades', null, 'Gustavo Pires'],
];

type Equip = [number, string, string, string, string, number, string, 'A' | 'B' | 'C', string];
const EQUIPAMENTOS: Equip[] = [
  [1, 'BMB-101', 'Bomba centrífuga de alimentação', 'Bomba', 'KSB', 1, '2018-03-10', 'A', 'operando'],
  [2, 'ENV-102', 'Envasadora rotativa 24 bicos', 'Envasadora', 'Krones', 1, '2019-06-01', 'A', 'operando'],
  [3, 'ROT-103', 'Rotuladora automática', 'Rotuladora', 'Krones', 1, '2019-06-01', 'B', 'operando'],
  [4, 'ESP-104', 'Esteira de paletização', 'Esteira', 'Rexnord', 1, '2017-11-20', 'C', 'operando'],
  [5, 'TRN-201', 'Torno CNC', 'Torno CNC', 'Romi', 2, '2016-08-15', 'A', 'operando'],
  [6, 'CUS-202', 'Centro de usinagem vertical', 'Centro de Usinagem', 'Romi', 2, '2020-02-12', 'A', 'manutencao'],
  [7, 'FRE-203', 'Fresadora ferramenteira', 'Fresadora', 'Diplomat', 2, '2014-05-03', 'B', 'operando'],
  [8, 'RBT-301', 'Robô de solda MIG', 'Robô', 'ABB', 3, '2021-01-18', 'A', 'operando'],
  [9, 'PRS-302', 'Prensa hidráulica 250 t', 'Prensa', 'Schuler', 3, '2015-09-30', 'A', 'operando'],
  [10, 'PAR-303', 'Parafusadeira automática', 'Parafusadeira', 'Atlas Copco', 3, '2022-04-05', 'B', 'operando'],
  [11, 'EST-304', 'Esteira de montagem final', 'Esteira', 'Rexnord', 3, '2018-07-22', 'C', 'parado'],
  [12, 'CMP-401', 'Compressor de ar parafuso 75 kW', 'Compressor', 'Atlas Copco', 4, '2017-02-14', 'A', 'operando'],
  [13, 'CLD-402', 'Caldeira a vapor flamotubular', 'Caldeira', 'Aalborg', 4, '2013-10-01', 'A', 'operando'],
  [14, 'CHL-403', 'Chiller de água gelada', 'Chiller', 'Carrier', 4, '2019-12-09', 'B', 'operando'],
  [15, 'TRF-404', 'Transformador 13,8 kV / 380 V', 'Transformador', 'WEG', 4, '2012-06-18', 'A', 'operando'],
  [16, 'BMB-405', 'Bomba de água gelada', 'Bomba', 'KSB', 4, '2020-08-25', 'B', 'operando'],
];

type SensorSpec = {
  tag: string; eq: number; tipo: 'temperatura' | 'vibracao' | 'pressao' | 'corrente';
  un: string; min: number; max: number; mean: number; sd: number; drift?: number; dec: number;
};
const SENSORES: SensorSpec[] = [
  { tag: 'TT-101', eq: 1, tipo: 'temperatura', un: '°C', min: 0, max: 85, mean: 62, sd: 3, dec: 1 },
  { tag: 'VT-101', eq: 1, tipo: 'vibracao', un: 'mm/s', min: 0, max: 7.1, mean: 2.8, sd: 0.5, drift: 0.9, dec: 2 },
  { tag: 'IT-101', eq: 1, tipo: 'corrente', un: 'A', min: 0, max: 60, mean: 41, sd: 2, dec: 1 },
  { tag: 'TT-102', eq: 2, tipo: 'temperatura', un: '°C', min: 0, max: 85, mean: 71, sd: 3, dec: 1 },
  { tag: 'IT-102', eq: 2, tipo: 'corrente', un: 'A', min: 0, max: 120, mean: 88, sd: 4, dec: 1 },
  { tag: 'TT-103', eq: 3, tipo: 'temperatura', un: '°C', min: 0, max: 80, mean: 55, sd: 2.5, dec: 1 },
  { tag: 'IT-104', eq: 4, tipo: 'corrente', un: 'A', min: 0, max: 25, mean: 14, sd: 1.2, dec: 1 },
  { tag: 'TT-201', eq: 5, tipo: 'temperatura', un: '°C', min: 0, max: 90, mean: 76, sd: 3.5, dec: 1 },
  { tag: 'VT-201', eq: 5, tipo: 'vibracao', un: 'mm/s', min: 0, max: 4.5, mean: 1.9, sd: 0.35, dec: 2 },
  { tag: 'TT-202', eq: 6, tipo: 'temperatura', un: '°C', min: 0, max: 85, mean: 76.5, sd: 2.5, drift: 11, dec: 1 },
  { tag: 'VT-202', eq: 6, tipo: 'vibracao', un: 'mm/s', min: 0, max: 4.5, mean: 2.3, sd: 0.3, drift: 1.7, dec: 2 },
  { tag: 'VT-203', eq: 7, tipo: 'vibracao', un: 'mm/s', min: 0, max: 7.1, mean: 3.2, sd: 0.6, dec: 2 },
  { tag: 'TT-203', eq: 7, tipo: 'temperatura', un: '°C', min: 0, max: 85, mean: 58, sd: 3, dec: 1 },
  { tag: 'TT-301', eq: 8, tipo: 'temperatura', un: '°C', min: 0, max: 80, mean: 49, sd: 2.5, dec: 1 },
  { tag: 'IT-301', eq: 8, tipo: 'corrente', un: 'A', min: 0, max: 200, mean: 145, sd: 8, dec: 1 },
  { tag: 'PT-302', eq: 9, tipo: 'pressao', un: 'bar', min: 150, max: 210, mean: 185, sd: 6, dec: 1 },
  { tag: 'TT-302', eq: 9, tipo: 'temperatura', un: '°C', min: 0, max: 85, mean: 81.3, sd: 2.6, dec: 1 },
  { tag: 'IT-303', eq: 10, tipo: 'corrente', un: 'A', min: 0, max: 15, mean: 8.2, sd: 0.6, dec: 1 },
  { tag: 'PT-401', eq: 12, tipo: 'pressao', un: 'bar', min: 6.0, max: 8.5, mean: 7.4, sd: 0.25, dec: 2 },
  { tag: 'TT-401', eq: 12, tipo: 'temperatura', un: '°C', min: 0, max: 95, mean: 86, sd: 3.2, dec: 1 },
  { tag: 'VT-401', eq: 12, tipo: 'vibracao', un: 'mm/s', min: 0, max: 7.1, mean: 3.9, sd: 0.7, dec: 2 },
  { tag: 'TT-402', eq: 13, tipo: 'temperatura', un: '°C', min: 0, max: 195, mean: 178, sd: 5, dec: 1 },
  { tag: 'PT-402', eq: 13, tipo: 'pressao', un: 'bar', min: 8, max: 12, mean: 10.4, sd: 0.4, dec: 2 },
  { tag: 'TT-403', eq: 14, tipo: 'temperatura', un: '°C', min: 4, max: 9, mean: 6.5, sd: 0.6, dec: 1 },
  { tag: 'TT-404', eq: 15, tipo: 'temperatura', un: '°C', min: 0, max: 105, mean: 72, sd: 4, dec: 1 },
  { tag: 'VT-405', eq: 16, tipo: 'vibracao', un: 'mm/s', min: 0, max: 7.1, mean: 2.2, sd: 0.4, dec: 2 },
  { tag: 'PT-405', eq: 16, tipo: 'pressao', un: 'bar', min: 2, max: 5, mean: 3.6, sd: 0.25, dec: 2 },
];

type Oper = [number, string, string, string, 'A' | 'B' | 'C', number | null, string];
const OPERADORES: Oper[] = [
  [1, 'Ana Paula Ribeiro', 'OP-1001', 'Operador de produção', 'A', 1, '2019-03-11'],
  [2, 'Carlos Eduardo Lima', 'OP-1002', 'Operador de produção', 'B', 1, '2020-07-01'],
  [3, 'Marcos Vinícius Souza', 'OP-1003', 'Operador de produção', 'C', 1, '2021-02-15'],
  [4, 'Fernanda Alves', 'OP-1004', 'Operador de produção', 'A', 2, '2018-09-03'],
  [5, 'João Pedro Martins', 'OP-1005', 'Operador de produção', 'B', 2, '2022-01-10'],
  [6, 'Rafael Costa', 'OP-1006', 'Operador de produção', 'C', 2, '2017-05-22'],
  [7, 'Juliana Mendes', 'OP-1007', 'Operador de produção', 'A', 3, '2020-11-16'],
  [8, 'Thiago Barbosa', 'OP-1008', 'Operador de produção', 'B', 3, '2023-03-06'],
  [9, 'Luciana Ferreira', 'OP-1009', 'Operador de utilidades', 'A', 4, '2016-04-18'],
  [10, 'Diego Santos', 'OP-1010', 'Operador de utilidades', 'C', 4, '2019-08-26'],
  [11, 'Roberto Nascimento', 'MN-2001', 'Técnico mecânico', 'A', null, '2015-02-02'],
  [12, 'Patrícia Gomes', 'MN-2002', 'Técnica eletricista', 'B', null, '2018-06-11'],
  [13, 'André Oliveira', 'MN-2003', 'Técnico mecânico', 'B', null, '2021-09-20'],
  [14, 'Camila Rocha', 'MN-2004', 'Técnica de instrumentação', 'A', null, '2022-05-09'],
  [15, 'Sérgio Teixeira', 'SP-3001', 'Supervisor de produção', 'A', null, '2012-10-01'],
  [16, 'Beatriz Cardoso', 'EN-4001', 'Engenheira de manutenção', 'A', null, '2020-01-13'],
];
const TECNICOS = { mec: [11, 13], ele: [12], inst: [14] };

/** Falhas (ordens corretivas) por equipamento no trimestre e tempo médio de reparo (h). */
const FALHAS: Record<number, { n: number; mttr: number; area: 'mec' | 'ele' | 'inst' }> = {
  1: { n: 2, mttr: 3.0, area: 'mec' },
  2: { n: 3, mttr: 2.2, area: 'mec' },
  3: { n: 1, mttr: 1.5, area: 'ele' },
  5: { n: 2, mttr: 4.0, area: 'ele' },
  6: { n: 6, mttr: 5.0, area: 'mec' },
  7: { n: 2, mttr: 2.8, area: 'mec' },
  8: { n: 1, mttr: 2.0, area: 'ele' },
  9: { n: 5, mttr: 3.6, area: 'mec' },
  12: { n: 4, mttr: 2.5, area: 'mec' },
  13: { n: 1, mttr: 6.5, area: 'mec' },
  14: { n: 1, mttr: 3.2, area: 'ele' },
  16: { n: 1, mttr: 1.8, area: 'mec' },
};

const DESCR_FALHA: Record<string, string[]> = {
  Bomba: ['Vazamento no selo mecânico', 'Ruído anormal no rolamento', 'Cavitação na sucção'],
  Envasadora: ['Bico de envase travado', 'Falha no sensor de nível', 'Quebra de came do carrossel'],
  Rotuladora: ['Falha no servo de alimentação de rótulos'],
  'Torno CNC': ['Alarme de inversor do eixo-árvore', 'Falha no encoder do eixo Z'],
  'Centro de Usinagem': ['Superaquecimento do spindle', 'Folga excessiva no fuso de esferas', 'Falha na troca automática de ferramentas', 'Vibração elevada no spindle'],
  Fresadora: ['Quebra da correia do cabeçote', 'Folga na mesa'],
  Robô: ['Falha no alimentador de arame'],
  Prensa: ['Vazamento de óleo hidráulico', 'Superaquecimento do óleo hidráulico', 'Falha na válvula proporcional', 'Desalinhamento do martelo'],
  Compressor: ['Alta temperatura de descarga', 'Falha no separador ar/óleo', 'Desarme por sobrecorrente'],
  Caldeira: ['Falha no queimador'],
  Chiller: ['Falha no contator do compressor'],
  Esteira: ['Correia rompida'],
};

// ---------------------------------------------------------------------------
// Construção
// ---------------------------------------------------------------------------
export function populate(db: Database): void {
  const rnd = mulberry32(20260901);
  const uni = (a: number, b: number) => a + (b - a) * rnd();
  const int = (a: number, b: number) => Math.floor(uni(a, b + 1));
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  db.run(SCHEMA_SQL);
  db.run('BEGIN');

  const ins = (sql: string, rows: unknown[][]) => {
    const st = db.prepare(sql);
    for (const r of rows) st.run(r as never);
    st.free();
  };

  ins('INSERT INTO linhas_producao VALUES (?,?,?,?,?)', LINHAS);
  ins('INSERT INTO equipamentos VALUES (?,?,?,?,?,?,?,?,?)', EQUIPAMENTOS);
  ins('INSERT INTO operadores VALUES (?,?,?,?,?,?,?)', OPERADORES);
  ins(
    'INSERT INTO sensores VALUES (?,?,?,?,?,?,?)',
    SENSORES.map((s, i) => [i + 1, s.tag, s.eq, s.tipo, s.un, s.min, s.max]),
  );

  const eqById = new Map(EQUIPAMENTOS.map((e) => [e[0], e]));
  const turnoDe = (ms: number): 'A' | 'B' | 'C' => {
    const h = new Date(ms).getUTCHours();
    return h >= 6 && h < 14 ? 'A' : h >= 14 && h < 22 ? 'B' : 'C';
  };
  const operadorDaLinha = (linha: number, ms: number): number => {
    const t = turnoDe(ms);
    const m = OPERADORES.find((o) => o[5] === linha && o[4] === t) ?? OPERADORES.find((o) => o[5] === linha);
    return m ? m[0] : 15;
  };

  // ---- Leituras (setembro/2026, a cada 4 h) e alarmes derivados ----------
  const leituras: unknown[][] = [];
  type Alarme = { ms: number; sensor: number; eq: number; sev: string; msg: string };
  const alarmes: Alarme[] = [];
  const nSlots = 30 * 6;
  for (let k = 0; k < nSlots; k++) {
    const ms = SEPT + k * 4 * 60 * MIN;
    const hour = new Date(ms).getUTCHours();
    const ambient = Math.sin(((hour - 9) / 24) * 2 * Math.PI); // mais quente à tarde
    SENSORES.forEach((s, i) => {
      const progress = k / (nSlots - 1);
      let v = s.mean + (s.drift ?? 0) * progress + gauss() * s.sd;
      if (s.tipo === 'temperatura') v += ambient * s.sd * 0.6;
      if (rnd() < 0.012) v += s.sd * uni(3.5, 7.5) * (s.tipo === 'pressao' && rnd() < 0.5 ? -1 : 1);
      v = round(Math.max(0, v), s.dec);
      leituras.push([i + 1, fmt(ms), v]);

      const nome = s.tipo === 'temperatura' ? 'Temperatura' : s.tipo === 'vibracao' ? 'Vibração' : s.tipo === 'pressao' ? 'Pressão' : 'Corrente';
      if (v > s.max) {
        const sev = (v - s.max) / (s.max - s.min) > 0.04 ? 'critica' : 'alta';
        alarmes.push({ ms, sensor: i + 1, eq: s.eq, sev, msg: `${nome} acima do limite (${v} ${s.un} > ${s.max} ${s.un})` });
      } else if (s.min > 0 && v < s.min) {
        alarmes.push({ ms, sensor: i + 1, eq: s.eq, sev: 'media', msg: `${nome} abaixo do limite (${v} ${s.un} < ${s.min} ${s.un})` });
      } else if (v > s.max - (s.max - s.min) * 0.03) {
        alarmes.push({ ms, sensor: i + 1, eq: s.eq, sev: 'baixa', msg: `${nome} próxima do limite (${v} ${s.un})` });
      }
    });
  }
  ins('INSERT INTO leituras (sensor_id, data_hora, valor) VALUES (?,?,?)', leituras);

  const ackCfg: Record<string, [number, number, number]> = {
    critica: [0.9, 2, 20], alta: [0.85, 5, 45], media: [0.8, 10, 120], baixa: [0.6, 20, 240],
  };
  const alarmRows = alarmes.map((a) => {
    const [p, lo, hi] = ackCfg[a.sev];
    // alarmes das últimas horas do mês ainda não foram reconhecidos
    const recente = a.ms > Date.UTC(2026, 8, 30, 12);
    const ack = !recente && rnd() < p;
    const ackMs = a.ms + int(lo, hi) * MIN + int(0, 59) * 1000;
    const linha = eqById.get(a.eq)![5];
    return [
      a.sensor, a.eq, fmt(a.ms + int(0, 239) * MIN + int(0, 59) * 1000), a.sev, a.msg,
      ack ? 1 : 0, ack ? fmt(ackMs + 240 * MIN) : null, ack ? operadorDaLinha(linha, ackMs) : null,
    ];
  });
  // data_hora do alarme fica dentro da janela de 4 h da leitura; ordena cronologicamente
  alarmRows.sort((x, y) => String(x[2]).localeCompare(String(y[2])));
  // corrige reconhecimento para sempre ser posterior ao alarme
  for (const r of alarmRows) {
    if (r[6]) {
      const base = Date.parse(String(r[2]).replace(' ', 'T') + 'Z');
      const [, lo, hi] = ackCfg[String(r[3])];
      r[6] = fmt(base + int(lo, hi) * MIN + int(0, 59) * 1000);
    }
  }
  ins(
    'INSERT INTO alarmes (sensor_id, equipamento_id, data_hora, severidade, mensagem, reconhecido, data_reconhecimento, operador_id) VALUES (?,?,?,?,?,?,?,?)',
    alarmRows,
  );

  // ---- Ordens de manutenção ---------------------------------------------
  type Ordem = {
    eq: number; tipo: string; prio: string; status: string; ab: number; ini: number | null;
    fim: number | null; tec: number | null; desc: string; horas: number | null; custo: number;
  };
  const ordens: Ordem[] = [];

  // Preventivas: mensais (criticidade A) e trimestrais (B, exceto PAR-303 — equipamento novo)
  for (const e of EQUIPAMENTOS) {
    const [id, , , tipo, , , , crit] = e;
    const meses = crit === 'A' ? [0, 1, 2] : crit === 'B' && id !== 10 ? [1] : [];
    for (const m of meses) {
      const dia = 4 + ((id * 7 + m * 3) % 20);
      const ab = Date.UTC(2026, 6 + m, dia, 7, 0, 0) - int(2, 5) * 24 * 60 * MIN;
      const ini = Date.UTC(2026, 6 + m, dia, 7, 0, 0);
      const dur = round(uni(2, 5.5), 2);
      const fim = ini + Math.round(dur * 60) * MIN;
      const tec = pick(tipo === 'Transformador' ? TECNICOS.ele : TECNICOS.mec);
      const horas = round(dur * (crit === 'A' ? 2 : 1), 1);
      ordens.push({
        eq: id, tipo: 'preventiva', prio: 'media', status: 'concluida', ab, ini, fim, tec,
        desc: 'Plano de manutenção preventiva ' + (crit === 'A' ? 'mensal' : 'trimestral') + ' — ' + tipo.toLowerCase(),
        horas, custo: round(horas * 165 + uni(150, 1400), 2),
      });
    }
  }

  // Corretivas
  for (const [eqStr, f] of Object.entries(FALHAS)) {
    const id = Number(eqStr);
    const e = eqById.get(id)!;
    const descrs = DESCR_FALHA[e[3]] ?? ['Falha não identificada'];
    const span = (Q_END - T0) / f.n;
    for (let j = 0; j < f.n; j++) {
      const ab = T0 + span * j + uni(0.08, 0.9) * span;
      const abMs = Math.floor(ab / MIN) * MIN;
      const ini = abMs + int(10, 90) * MIN;
      const dur = f.mttr * uni(0.55, 1.5);
      const fim = ini + Math.round(dur * 60) * MIN;
      const tecs = TECNICOS[f.area];
      const horas = round(dur * (rnd() < 0.4 ? 2 : 1), 1);
      const pecas = rnd() < 0.7 ? uni(300, 9000) : uni(0, 250);
      ordens.push({
        eq: id, tipo: 'corretiva', prio: e[7] === 'A' ? (rnd() < 0.5 ? 'urgente' : 'alta') : 'media',
        status: 'concluida', ab: abMs, ini, fim, tec: pick(tecs), desc: descrs[j % descrs.length],
        horas, custo: round(horas * 180 + pecas, 2),
      });
    }
  }
  // CUS-202: a última corretiva ainda está em andamento (equipamento em manutenção)
  {
    const ab = Date.UTC(2026, 8, 29, 15, 42, 0);
    ordens.push({
      eq: 6, tipo: 'corretiva', prio: 'urgente', status: 'em_andamento', ab, ini: ab + 35 * MIN, fim: null,
      tec: 11, desc: 'Superaquecimento do spindle — substituição de rolamentos', horas: null, custo: 6840.0,
    });
  }
  // EST-304: correia rompida, aguardando peça
  ordens.push({
    eq: 11, tipo: 'corretiva', prio: 'alta', status: 'aberta', ab: Date.UTC(2026, 8, 28, 9, 17, 0),
    ini: null, fim: null, tec: null, desc: 'Correia rompida — aguardando peça do fornecedor', horas: null, custo: 0,
  });
  // RBT-301: chamado cancelado (falso alarme)
  ordens.push({
    eq: 8, tipo: 'corretiva', prio: 'media', status: 'cancelada', ab: Date.UTC(2026, 7, 19, 22, 5, 0),
    ini: null, fim: null, tec: null, desc: 'Falha de comunicação com o CLP (falso alarme)', horas: null, custo: 0,
  });
  // Preditivas (análise de vibração / termografia)
  const pred: [number, number, number, string][] = [
    [12, 8, 6, 'Análise de vibração — rolamento do motor principal'],
    [1, 8, 12, 'Análise de vibração — bomba com tendência de alta'],
    [6, 8, 17, 'Termografia do spindle'],
    [9, 7, 21, 'Análise de óleo hidráulico'],
    [15, 7, 9, 'Termografia de conexões do transformador'],
    [6, 8, 24, 'Análise de vibração — spindle'],
  ];
  for (const [eq, mes, dia, desc] of pred) {
    const ab = Date.UTC(2026, mes, dia, 9, int(0, 50), 0);
    const ini = ab + int(60, 600) * MIN;
    const dur = uni(0.8, 2);
    const horas = round(dur, 1);
    ordens.push({
      eq, tipo: 'preditiva', prio: 'media', status: 'concluida', ab, ini, fim: ini + Math.round(dur * 60) * MIN,
      tec: 14, desc, horas, custo: round(horas * 210 + uni(200, 900), 2),
    });
  }
  ordens.sort((a, b) => a.ab - b.ab);
  ins(
    `INSERT INTO ordens_manutencao (equipamento_id, tipo, prioridade, status, data_abertura, data_inicio,
     data_conclusao, tecnico_id, descricao, horas_trabalhadas, custo) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    ordens.map((o) => [
      o.eq, o.tipo, o.prio, o.status, fmt(o.ab), o.ini ? fmt(o.ini) : null, o.fim ? fmt(o.fim) : null,
      o.tec, o.desc, o.horas, o.custo,
    ]),
  );

  // ---- Eventos operacionais --------------------------------------------
  type Ev = { linha: number; eq: number | null; tipo: string; ini: number; fim: number | null; op: number; desc: string };
  const eventos: Ev[] = [];
  for (const o of ordens) {
    const e = eqById.get(o.eq)!;
    if (o.tipo === 'corretiva' && o.status !== 'cancelada') {
      const ini = o.ab - int(3, 25) * MIN;
      eventos.push({ linha: e[5], eq: o.eq, tipo: 'parada_nao_programada', ini, fim: o.fim, op: operadorDaLinha(e[5], ini), desc: o.desc });
    } else if (o.tipo === 'preventiva' && o.ini && o.fim) {
      eventos.push({ linha: e[5], eq: o.eq, tipo: 'parada_programada', ini: o.ini, fim: o.fim, op: operadorDaLinha(e[5], o.ini), desc: 'Parada para manutenção preventiva' });
    }
  }
  // Setups de produto (linhas 1–3, ~2 por semana)
  const produtos: Record<number, string[]> = {
    1: ['garrafa 500 ml', 'garrafa 1 L', 'garrafa 2 L'],
    2: ['eixo 40 mm', 'flange DN100', 'bucha de bronze'],
    3: ['suporte de motor', 'chassi modelo X', 'chassi modelo Y'],
  };
  for (let linha = 1; linha <= 3; linha++) {
    for (let w = 0; w < 13; w++) {
      for (let s = 0; s < 2; s++) {
        const ini = T0 + (w * 7 + int(0, 6)) * 24 * 60 * MIN + int(6, 20) * 60 * MIN;
        const dur = int(25, 95);
        eventos.push({ linha, eq: null, tipo: 'setup', ini, fim: ini + dur * MIN, op: operadorDaLinha(linha, ini), desc: 'Troca de formato para ' + pick(produtos[linha]) });
      }
    }
  }
  // Microparadas
  const eqsProd = EQUIPAMENTOS.filter((e) => e[5] <= 3 && e[0] !== 11);
  const motivos = ['Atolamento de produto', 'Sensor de presença obstruído', 'Falta de material', 'Ajuste de guia', 'Parada por porta de segurança aberta'];
  for (let i = 0; i < 48; i++) {
    const e = pick(eqsProd);
    const ini = T0 + Math.floor(uni(0, (Q_END - T0) / MIN - 60)) * MIN;
    eventos.push({ linha: e[5], eq: e[0], tipo: 'microparada', ini, fim: ini + int(2, 9) * MIN, op: operadorDaLinha(e[5], ini), desc: pick(motivos) });
  }
  eventos.sort((a, b) => a.ini - b.ini);
  ins(
    'INSERT INTO eventos_operacionais (linha_id, equipamento_id, tipo, data_inicio, data_fim, duracao_min, operador_id, descricao) VALUES (?,?,?,?,?,?,?,?)',
    eventos.map((e) => [
      e.linha, e.eq, e.tipo, fmt(e.ini), e.fim ? fmt(e.fim) : null, e.fim ? Math.round((e.fim - e.ini) / MIN) : null, e.op, e.desc,
    ]),
  );

  db.run('COMMIT');
}

export function buildIndustrialDatabase(SQL: SqlJsStatic): Database {
  const db = new SQL.Database();
  populate(db);
  return db;
}

/** Descrição didática de cada tabela (exibida no explorador). */
export const TABLE_DOCS: Record<string, string> = {
  linhas_producao: 'Linhas de produção da planta e sua capacidade nominal.',
  equipamentos: 'Ativos físicos da planta. Criticidade A = parada afeta toda a linha.',
  sensores: 'Instrumentos instalados nos equipamentos, com faixa operacional (limite_min / limite_max).',
  leituras: 'Valores medidos pelos sensores a cada 4 horas em setembro de 2026.',
  alarmes: 'Alarmes gerados pelo supervisório quando uma leitura sai da faixa ou se aproxima do limite.',
  ordens_manutencao: 'Ordens de serviço da manutenção (corretiva, preventiva, preditiva) no 3º trimestre de 2026.',
  operadores: 'Colaboradores: operadores, técnicos, supervisor e engenharia.',
  eventos_operacionais: 'Paradas, setups e microparadas registrados no MES.',
};

export const TABLE_ORDER = [
  'linhas_producao', 'equipamentos', 'sensores', 'leituras', 'alarmes', 'ordens_manutencao', 'operadores', 'eventos_operacionais',
];

export const RELATIONSHIPS: [string, string][] = [
  ['equipamentos.linha_id', 'linhas_producao.id'],
  ['sensores.equipamento_id', 'equipamentos.id'],
  ['leituras.sensor_id', 'sensores.id'],
  ['alarmes.sensor_id', 'sensores.id'],
  ['alarmes.equipamento_id', 'equipamentos.id'],
  ['alarmes.operador_id', 'operadores.id'],
  ['ordens_manutencao.equipamento_id', 'equipamentos.id'],
  ['ordens_manutencao.tecnico_id', 'operadores.id'],
  ['operadores.linha_id', 'linhas_producao.id'],
  ['eventos_operacionais.linha_id', 'linhas_producao.id'],
  ['eventos_operacionais.equipamento_id', 'equipamentos.id'],
  ['eventos_operacionais.operador_id', 'operadores.id'],
];
