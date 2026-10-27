/**
 * Regras de domínio: transforma a lista do backend (/api02) em uma temporada
 * estruturada (fases, rodadas, agregados, classificação).
 *
 * Tudo aqui são funções puras: recebem dados e devolvem dados novos, sem
 * tocar no DOM nem no React. Isso facilita testar e reaproveitar.
 */

/**
 * Trilha fixa de fases, na ordem da competição. O `id` é o valor de `stage`
 * da football-data, que o backend repassa no campo `fase`.
 */
export const FASES = [
  { id: 'LEAGUE_STAGE', slug: 'liga', nome: 'Fase de liga' },
  { id: 'PLAYOFFS', slug: 'playoffs', nome: 'Playoffs' },
  { id: 'LAST_16', slug: 'oitavas', nome: 'Oitavas' },
  { id: 'QUARTER_FINALS', slug: 'quartas', nome: 'Quartas' },
  { id: 'SEMI_FINALS', slug: 'semis', nome: 'Semifinais' },
  { id: 'FINAL', slug: 'final', nome: 'Final' },
];

const FASE_DE_LIGA = 'LEAGUE_STAGE';
const FASE_FINAL = 'FINAL';

/** Diferença mínima de gols para um jogo contar como goleada. */
export const DIFERENCA_GOLEADA = 3;

/** Converte um item da API no formato usado pela interface. */
export function normalizarJogo(bruto, indice) {
  const time = (lado) => ({
    nome: bruto[lado],
    curto: bruto[`nome_curto_${lado}`] || bruto[lado],
    sigla: bruto[`sigla_${lado}`] || bruto[`nome_curto_${lado}`] || bruto[lado],
    escudo: bruto[`escudo_${lado}`] || null,
    gols: bruto[`gols_${lado}`],
    penaltis: bruto[`penaltis_${lado}`] ?? null,
  });

  const mandante = time('mandante');
  const visitante = time('visitante');

  // O vencedor vem do backend, que já considera prorrogação e pênaltis.
  let resultado = null;
  if (bruto.vencedor === mandante.nome) resultado = 'mandante';
  else if (bruto.vencedor === visitante.nome) resultado = 'visitante';
  else if (bruto.vencedor === 'Empate') resultado = 'empate';

  return {
    id: `j${indice}`,
    data: new Date(bruto.data),
    fase: bruto.fase,
    rodada: bruto.rodada ?? null,
    encerrado: bruto.status === 'Encerrado',
    status: bruto.status,
    resultado,
    mandante,
    visitante,
    agregado: null,
  };
}

/**
 * A sigla (tla) não é única: Bayern e Barcelona são "FCB". Quando duas
 * equipes diferentes dividem a mesma sigla, as duas passam a exibir o
 * nome curto. O nome completo continua sendo a chave de identificação.
 */
export function desambiguarSiglas(jogos) {
  const nomesPorSigla = new Map();
  for (const jogo of jogos) {
    for (const time of [jogo.mandante, jogo.visitante]) {
      if (!nomesPorSigla.has(time.sigla)) nomesPorSigla.set(time.sigla, new Set());
      nomesPorSigla.get(time.sigla).add(time.nome);
    }
  }

  const exibir = (time) => ({
    ...time,
    sigla: nomesPorSigla.get(time.sigla).size > 1 ? time.curto : time.sigla,
  });

  return jogos.map((jogo) => ({ ...jogo, mandante: exibir(jogo.mandante), visitante: exibir(jogo.visitante) }));
}

/** Nome de quem venceu o jogo (inclui prorrogação e pênaltis), ou null. */
export function nomeDoVencedor(jogo) {
  if (jogo.resultado === 'mandante') return jogo.mandante.nome;
  if (jogo.resultado === 'visitante') return jogo.visitante.nome;
  return null;
}

/**
 * Soma ida e volta de um confronto eliminatório e anexa o agregado ao jogo
 * de volta. O par é identificado pelos times invertidos. Se o agregado
 * empatar (o placar já inclui a prorrogação), quem avança é o vencedor da
 * volta, decidido nos pênaltis.
 */
export function calcularAgregados(jogosIda, jogosVolta) {
  return jogosVolta.map((volta) => {
    const ida = jogosIda.find(
      (j) => j.mandante.nome === volta.visitante.nome && j.visitante.nome === volta.mandante.nome,
    );
    if (!ida || !ida.encerrado || !volta.encerrado) return volta;

    const golsMandante = volta.mandante.gols + ida.visitante.gols;
    const golsVisitante = volta.visitante.gols + ida.mandante.gols;

    let classificado = nomeDoVencedor(volta);
    let decisao = 'penaltis';
    if (golsMandante !== golsVisitante) {
      classificado = golsMandante > golsVisitante ? volta.mandante.nome : volta.visitante.nome;
      decisao = 'agregado';
    }

    return { ...volta, agregado: { mandante: golsMandante, visitante: golsVisitante, classificado, decisao } };
  });
}

function tituloDoGrupo(faseId, rodada) {
  if (faseId === FASE_FINAL) return 'Jogo único';
  if (rodada == null) return 'Jogos';
  if (faseId === FASE_DE_LIGA) return `Rodada ${rodada}`;
  if (rodada === 1) return 'Ida';
  if (rodada === 2) return 'Volta';
  return `Jogo ${rodada}`;
}

/** Agrupa os jogos de uma fase por rodada, em ordem crescente. */
function agruparPorRodada(faseId, jogos) {
  const porRodada = new Map();
  for (const jogo of jogos) {
    if (!porRodada.has(jogo.rodada)) porRodada.set(jogo.rodada, []);
    porRodada.get(jogo.rodada).push(jogo);
  }

  return [...porRodada.entries()]
    .sort(([a], [b]) => (a ?? Infinity) - (b ?? Infinity))
    .map(([rodada, jogosDaRodada]) => ({ rodada, titulo: tituloDoGrupo(faseId, rodada), jogos: jogosDaRodada }));
}

/**
 * Classificação da fase de liga. Critérios: pontos, saldo, gols marcados.
 * (O regulamento da UEFA tem desempates extras que a API não fornece.)
 */
export function calcularClassificacao(jogos) {
  const tabela = new Map();

  const linha = (time) => {
    if (!tabela.has(time.nome)) {
      tabela.set(time.nome, {
        nome: time.nome, sigla: time.sigla, escudo: time.escudo,
        jogos: 0, vitorias: 0, empates: 0, derrotas: 0,
        golsPro: 0, golsContra: 0, pontos: 0,
      });
    }
    return tabela.get(time.nome);
  };

  for (const jogo of jogos.filter((j) => j.encerrado && j.fase === FASE_DE_LIGA)) {
    const casa = linha(jogo.mandante);
    const fora = linha(jogo.visitante);

    casa.jogos += 1; fora.jogos += 1;
    casa.golsPro += jogo.mandante.gols; casa.golsContra += jogo.visitante.gols;
    fora.golsPro += jogo.visitante.gols; fora.golsContra += jogo.mandante.gols;

    if (jogo.resultado === 'mandante') { casa.vitorias += 1; casa.pontos += 3; fora.derrotas += 1; }
    if (jogo.resultado === 'visitante') { fora.vitorias += 1; fora.pontos += 3; casa.derrotas += 1; }
    if (jogo.resultado === 'empate') { casa.empates += 1; fora.empates += 1; casa.pontos += 1; fora.pontos += 1; }
  }

  return [...tabela.values()]
    .map((t) => ({ ...t, saldo: t.golsPro - t.golsContra }))
    .sort((a, b) => b.pontos - a.pontos || b.saldo - a.saldo || b.golsPro - a.golsPro || a.nome.localeCompare(b.nome))
    .map((t, i) => ({ ...t, posicao: i + 1, zona: zonaDaPosicao(i + 1) }));
}

/** Zonas da fase de liga: 1-8 direto às oitavas, 9-24 playoffs, 25-36 eliminados. */
export function zonaDaPosicao(posicao) {
  if (posicao <= 8) return 'direto';
  if (posicao <= 24) return 'playoff';
  return 'fora';
}

/** Monta a temporada inteira a partir da resposta do backend. */
export function montarTemporada(dadosBrutos) {
  const jogosOrdenados = desambiguarSiglas(
    dadosBrutos.map(normalizarJogo).sort((a, b) => a.data - b.data),
  );

  const porFase = new Map();
  for (const jogo of jogosOrdenados) {
    if (!porFase.has(jogo.fase)) porFase.set(jogo.fase, []);
    porFase.get(jogo.fase).push(jogo);
  }

  // Fases que a trilha não conhece (mudança de formato) vão para o fim, com o código cru.
  const desconhecidas = [...porFase.keys()]
    .filter((id) => !FASES.some((f) => f.id === id))
    .map((id) => ({ id, slug: String(id).toLowerCase(), nome: String(id) }));

  const fases = [...FASES, ...desconhecidas].map((fase) => {
    let grupos = agruparPorRodada(fase.id, porFase.get(fase.id) ?? []);

    const ida = grupos.find((g) => g.rodada === 1);
    const volta = grupos.find((g) => g.rodada === 2);
    if (fase.id !== FASE_DE_LIGA && ida && volta) {
      grupos = grupos.map((g) => (g === volta ? { ...g, jogos: calcularAgregados(ida.jogos, volta.jogos) } : g));
    }

    return { ...fase, grupos, total: grupos.reduce((s, g) => s + g.jogos.length, 0) };
  });

  // Lista plana já com os agregados, na ordem cronológica.
  const jogos = fases.flatMap((f) => f.grupos.flatMap((g) => g.jogos)).sort((a, b) => a.data - b.data);
  const encerrados = jogos.filter((j) => j.encerrado);
  const final = encerrados.find((j) => j.fase === FASE_FINAL);

  return {
    jogos,
    fases,
    classificacao: calcularClassificacao(jogos),
    destaque: final ?? encerrados.at(-1) ?? null,
    temFinal: Boolean(final),
  };
}

/** Remove acentos e caixa para buscas tolerantes ("munchen" encontra "München"). */
export function normalizarTexto(texto) {
  return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export const empatouNoPlacar = (jogo) => jogo.encerrado && jogo.mandante.gols === jogo.visitante.gols;
export const foiGoleada = (jogo) =>
  jogo.encerrado && Math.abs(jogo.mandante.gols - jogo.visitante.gols) >= DIFERENCA_GOLEADA;

/** Diz se o jogo passa pelos filtros atuais da tela. */
export function jogoPassaNoFiltro(jogo, { busca, tipo, time }) {
  const times = [jogo.mandante, jogo.visitante];

  if (time && !times.some((t) => t.nome === time)) return false;
  if (busca) {
    const termo = normalizarTexto(busca.trim());
    const encontrou = times.some((t) => [t.nome, t.curto, t.sigla].some((n) => normalizarTexto(n).includes(termo)));
    if (!encontrou) return false;
  }
  if (tipo === 'empates' && !empatouNoPlacar(jogo)) return false;
  if (tipo === 'goleadas' && !foiGoleada(jogo)) return false;
  return true;
}

/** Sequência de resultados (V/E/D) de um time ao longo da temporada. */
export function campanhaDoTime(jogos, nome) {
  return jogos
    .filter((j) => j.encerrado && (j.mandante.nome === nome || j.visitante.nome === nome))
    .map((j) => {
      const emCasa = j.mandante.nome === nome;
      const proprio = emCasa ? j.mandante : j.visitante;
      const rival = emCasa ? j.visitante : j.mandante;
      const vencedor = nomeDoVencedor(j);

      let resultado = 'E';
      if (vencedor === nome) resultado = 'V';
      else if (vencedor) resultado = 'D';

      return {
        id: j.id,
        fase: j.fase,
        resultado,
        pro: proprio.gols,
        contra: rival.gols,
        penaltis: proprio.penaltis != null ? { pro: proprio.penaltis, contra: rival.penaltis } : null,
        adversario: rival.nome,
        emCasa,
      };
    });
}
