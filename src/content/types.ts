import type { CompareOptions } from '../engine/types';

export type Difficulty = 'facil' | 'medio' | 'dificil';

export interface Exercise {
  id: string;
  moduleId: number;
  title: string;
  difficulty: Difficulty;
  /** Situação de chão de fábrica que motiva a consulta. */
  context: string;
  /** O que exatamente a consulta deve retornar. */
  objective: string;
  /** Nomes sugeridos das colunas (aliases são livres; a validação usa o conteúdo). */
  expectedColumns: string[];
  tables: string[];
  /** Dicas progressivas: conceito → estrutura → esqueleto. */
  hints: string[];
  solution: string;
  options?: CompareOptions;
  /** Recurso que o módulo quer exercitar (sugestão, não obrigatório). */
  concept?: { pattern: RegExp; message: string };
  /** Comentário exibido depois que o exercício é resolvido. */
  takeaway: string;
  finalChallenge?: boolean;
}

export interface Module {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  /** Cola rápida de sintaxe — referência curta, não aula. */
  cheatsheet: string;
  conceptLabel: string;
}
