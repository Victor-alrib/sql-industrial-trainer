# Resultados — SQL Industrial Trainer

Tudo aqui foi produzido pelo próprio código do projeto. Os testes, o resumo do banco e as saídas de consultas foram reexecutados em 17/11/2026 sobre a versão final. Os logs de navegador e as capturas são da sessão de desenvolvimento.

## Arquivos

| Arquivo | O que mostra |
|---|---|
| `testes-vitest.txt` | Saída completa dos 88 testes (88 passaram em 1,55 s) |
| `resumo-banco.md` | Registros por tabela e distribuição de alarmes, ordens e eventos |
| `saidas-solucoes.txt` | Resultado das consultas de referência: 6.3 (equipamentos > 80 °C), 10.1 (MTTR), 10.2 (disponibilidade por linha), 10.4 (relatório de confiabilidade) |
| `e2e-navegador.log` | Teste Playwright: recuperação após timeout, persistência após recarregar, nenhum erro de console |
| `smoke-arquivo-unico-csp.log` | Versão de arquivo único funcionando sob uma CSP restritiva |
| `capturas/` | Telas: exercício resolvido, feedback de erro, dashboard, explorador, trilha (modo claro), celular e etapas do teste e2e |

## Composição dos 88 testes

| Grupo | Quantidade |
|---|---:|
| Soluções de referência executam, retornam linhas e se autovalidam | 47 |
| Consultas alternativas corretas aceitas | 23 |
| Erros típicos rejeitados com o diagnóstico esperado | 12 |
| Sandbox (escrita bloqueada, banco reiniciado, colunas em resultado vazio, determinismo) | 4 |
| Conteúdo (ids únicos, todo módulo com exercícios) | 1 |
| Sem empate na fronteira do Top-5 | 1 |

## Destaque: relatório de confiabilidade (exercício 10.4)

| tag | falhas | horas paradas | MTTR (h) | MTBF (h) | custo (R$) | alarmes críticos |
|---|---:|---:|---:|---:|---:|---:|
| CUS-202 | 7 | 37,97 | 6,33 | 310,00 | 43 661,18 | 19 |
| PRS-302 | 5 | 26,35 | 5,27 | 436,33 | 28 256,19 | 4 |
| CMP-401 | 4 | 13,77 | 3,44 | 548,56 | 23 354,98 | 4 |
| ENV-102 | 3 | 10,27 | 3,42 | 732,58 | 17 509,83 | 0 |
| TRN-201 | 2 | 12,13 | 6,07 | 1 097,93 | 7 739,81 | 1 |
| BMB-101 | 2 | 8,68 | 4,34 | 1 099,66 | 15 953,08 | 0 |
| CLD-402 | 1 | 8,90 | 8,90 | 2 199,10 | 8 816,42 | 1 |
| RBT-301 | 1 | 2,65 | 2,65 | 2 205,35 | 8 254,08 | 0 |

Os dados são sintéticos. Os números mostram que o gerador produziu a história planejada: o CUS-202 é o menos confiável. Eles não representam nenhuma planta real.

## Desempenho do motor SQL

As 47 soluções de referência executadas 4 vezes cada com o mesmo motor (sql.js) no Node.js:
mediana de **0,6 ms**, p95 de **4,1 ms** e máximo de **75 ms** por consulta. Gerar o banco e
inicializar o SQLite levou **119 ms**.

## Próximas validações

- **Aprendizagem:** comparar o desempenho de alunos antes e depois, ou contra um curso tradicional.
- **Usabilidade:** tempo até resolver cada exercício, taxa de abandono e uso de dicas (o app já registra isso por aluno).
- **Qualidade do validador:** taxa de consultas erradas aceitas por coincidência, gerando bancos com sementes diferentes.
- **Acessibilidade:** auditoria com leitor de tela ou Lighthouse.
