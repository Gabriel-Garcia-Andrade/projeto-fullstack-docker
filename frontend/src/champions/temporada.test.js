import {
  FASES,
  montarTemporada,
  normalizarJogo,
  desambiguarSiglas,
  jogoPassaNoFiltro,
  campanhaDoTime,
  zonaDaPosicao,
} from './temporada';

const TIMES = {
  bayern: { nome: 'FC Bayern München', curto: 'Bayern', sigla: 'FCB' },
  barca: { nome: 'FC Barcelona', curto: 'Barça', sigla: 'FCB' },
  psg: { nome: 'Paris Saint-Germain FC', curto: 'PSG', sigla: 'PSG' },
  ars: { nome: 'Arsenal FC', curto: 'Arsenal', sigla: 'ARS' },
};

/** Monta um item no formato que o backend devolve em /api02. */
function jogo(casa, fora, golsCasa, golsFora, extra = {}) {
  const penaltis = extra.penaltis ?? [null, null];
  let vencedor = 'Empate';
  if (golsCasa > golsFora || (penaltis[0] ?? -1) > (penaltis[1] ?? -1)) vencedor = casa.nome;
  if (golsFora > golsCasa || (penaltis[1] ?? -1) > (penaltis[0] ?? -1)) vencedor = fora.nome;

  return {
    data: extra.data ?? '2025-09-16T19:00:00Z',
    fase: extra.fase ?? 'LEAGUE_STAGE',
    rodada: extra.rodada === undefined ? 1 : extra.rodada,
    mandante: casa.nome,
    visitante: fora.nome,
    nome_curto_mandante: casa.curto,
    nome_curto_visitante: fora.curto,
    sigla_mandante: casa.sigla,
    sigla_visitante: fora.sigla,
    escudo_mandante: null,
    escudo_visitante: null,
    gols_mandante: golsCasa,
    gols_visitante: golsFora,
    penaltis_mandante: penaltis[0],
    penaltis_visitante: penaltis[1],
    status: 'Encerrado',
    vencedor,
  };
}

const DADOS = [
  jogo(TIMES.bayern, TIMES.psg, 2, 1, { rodada: 1, data: '2025-09-16T19:00:00Z' }),
  jogo(TIMES.barca, TIMES.ars, 1, 1, { rodada: 1, data: '2025-09-17T19:00:00Z' }),
  jogo(TIMES.psg, TIMES.barca, 4, 0, { rodada: 2, data: '2025-09-30T19:00:00Z' }),
  // Oitavas: agregado decidido no placar (Bayern 3 x 2) e outro empatado, decidido nos pênaltis.
  jogo(TIMES.psg, TIMES.bayern, 1, 1, { fase: 'LAST_16', rodada: 1, data: '2026-03-10T20:00:00Z' }),
  jogo(TIMES.bayern, TIMES.psg, 2, 1, { fase: 'LAST_16', rodada: 2, data: '2026-03-17T20:00:00Z' }),
  jogo(TIMES.barca, TIMES.ars, 2, 1, { fase: 'LAST_16', rodada: 1, data: '2026-03-11T20:00:00Z' }),
  jogo(TIMES.ars, TIMES.barca, 1, 0, { fase: 'LAST_16', rodada: 2, data: '2026-03-18T20:00:00Z', penaltis: [5, 4] }),
  // Final: 1 x 1 com pênaltis (o backend já desconta os pênaltis dos gols).
  jogo(TIMES.psg, TIMES.ars, 1, 1, { fase: 'FINAL', rodada: null, data: '2026-05-30T16:00:00Z', penaltis: [4, 3] }),
];

describe('normalizarJogo', () => {
  test('usa o vencedor do backend, inclusive em jogo decidido nos pênaltis', () => {
    const final = normalizarJogo(DADOS.at(-1), 0);
    expect(final.resultado).toBe('mandante');
    expect(final.mandante).toMatchObject({ gols: 1, penaltis: 4, sigla: 'PSG' });
  });

  test('sem sigla, cai para o nome curto', () => {
    const semSigla = { ...DADOS[0], sigla_mandante: null };
    expect(normalizarJogo(semSigla, 0).mandante.sigla).toBe('Bayern');
  });
});

describe('desambiguarSiglas', () => {
  test('siglas repetidas por times diferentes viram o nome curto', () => {
    const jogos = desambiguarSiglas(DADOS.map(normalizarJogo));
    const siglas = new Map(jogos.flatMap((j) => [j.mandante, j.visitante]).map((t) => [t.nome, t.sigla]));
    expect(siglas.get('FC Bayern München')).toBe('Bayern');
    expect(siglas.get('FC Barcelona')).toBe('Barça');
    expect(siglas.get('Paris Saint-Germain FC')).toBe('PSG');
  });
});

describe('montarTemporada', () => {
  const temporada = montarTemporada(DADOS);
  const fase = (id) => temporada.fases.find((f) => f.id === id);

  test('a trilha tem sempre as mesmas fases, na ordem, mesmo sem jogos', () => {
    expect(temporada.fases.map((f) => f.id)).toEqual(FASES.map((f) => f.id));
    expect(fase('PLAYOFFS').total).toBe(0);
    expect(fase('LEAGUE_STAGE').total).toBe(3);
  });

  test('agrupa pelos campos fase e rodada do backend', () => {
    expect(fase('LEAGUE_STAGE').grupos.map((g) => g.titulo)).toEqual(['Rodada 1', 'Rodada 2']);
    expect(fase('LAST_16').grupos.map((g) => g.titulo)).toEqual(['Ida', 'Volta']);
    expect(fase('FINAL').grupos.map((g) => g.titulo)).toEqual(['Jogo único']);
  });

  test('calcula o agregado só nos jogos de volta', () => {
    const [ida, volta] = fase('LAST_16').grupos;
    expect(ida.jogos.every((j) => j.agregado === null)).toBe(true);

    const bayern = volta.jogos.find((j) => j.mandante.nome === TIMES.bayern.nome);
    expect(bayern.agregado).toEqual({ mandante: 3, visitante: 2, classificado: TIMES.bayern.nome, decisao: 'agregado' });

    const arsenal = volta.jogos.find((j) => j.mandante.nome === TIMES.ars.nome);
    expect(arsenal.agregado).toEqual({ mandante: 2, visitante: 2, classificado: TIMES.ars.nome, decisao: 'penaltis' });
  });

  test('classificação usa só a fase de liga, ordenada por pontos e saldo', () => {
    expect(temporada.classificacao.map((t) => [t.nome, t.pontos, t.saldo])).toEqual([
      ['Paris Saint-Germain FC', 3, 3],
      ['FC Bayern München', 3, 1],
      ['Arsenal FC', 1, 0],
      ['FC Barcelona', 1, -4],
    ]);
    expect(temporada.classificacao[0]).toMatchObject({ posicao: 1, zona: 'direto' });
  });

  test('o destaque é a final', () => {
    expect(temporada.temFinal).toBe(true);
    expect(temporada.destaque.fase).toBe('FINAL');
  });
});

describe('zonaDaPosicao', () => {
  test.each([[1, 'direto'], [8, 'direto'], [9, 'playoff'], [24, 'playoff'], [25, 'fora'], [36, 'fora']])(
    'posição %i fica na zona %s',
    (posicao, zona) => expect(zonaDaPosicao(posicao)).toBe(zona),
  );
});

describe('jogoPassaNoFiltro', () => {
  const { jogos } = montarTemporada(DADOS);
  const filtrar = (filtro) => jogos.filter((j) => jogoPassaNoFiltro(j, { busca: '', tipo: 'todos', time: null, ...filtro }));

  test('busca ignora acentos e caixa', () => {
    expect(filtrar({ busca: 'MUNCHEN' })).toHaveLength(3);
    expect(filtrar({ busca: 'barca' })).toHaveLength(4);
  });

  test('busca também encontra pela sigla', () => {
    expect(filtrar({ busca: 'ars' })).toHaveLength(4);
  });

  test('empates consideram o placar, mesmo quando houve pênaltis', () => {
    expect(filtrar({ tipo: 'empates' })).toHaveLength(3);
  });

  test('goleadas têm 3 ou mais gols de diferença', () => {
    expect(filtrar({ tipo: 'goleadas' }).map((j) => j.mandante.nome)).toEqual(['Paris Saint-Germain FC']);
  });

  test('o time escolhido filtra pelo nome completo, não pela sigla', () => {
    expect(filtrar({ time: TIMES.barca.nome })).toHaveLength(4);
  });
});

describe('campanhaDoTime', () => {
  test('vitória nos pênaltis conta como V, com o placar dos pênaltis', () => {
    const { jogos } = montarTemporada(DADOS);
    const campanha = campanhaDoTime(jogos, TIMES.psg.nome);
    expect(campanha.map((c) => c.resultado)).toEqual(['D', 'V', 'E', 'D', 'V']);
    expect(campanha.at(-1).penaltis).toEqual({ pro: 4, contra: 3 });
  });
});
