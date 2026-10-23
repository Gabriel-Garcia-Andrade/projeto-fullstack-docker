import { useEffect, useMemo, useRef, useState } from 'react';
import { carregarJogos, ErroDeCarregamento } from './api';
import { montarTemporada, jogoPassaNoFiltro, campanhaDoTime } from './temporada';
import { comportamentoDeRolagem } from './formatar';
import useTema from './useTema';
import Placar from './componentes/Placar';
import Trilha from './componentes/Trilha';
import ListaJogos from './componentes/ListaJogos';
import Classificacao from './componentes/Classificacao';
import Campanha from './componentes/Campanha';
import { Carregando, Erro, Vazio } from './componentes/Estados';

const FILTRO_INICIAL = { busca: '', tipo: 'todos', time: null };

const TIPOS_DE_FILTRO = [
  { id: 'todos', nome: 'Todos' },
  { id: 'empates', nome: 'Empates' },
  { id: 'goleadas', nome: 'Goleadas' },
];

/** Aplica os filtros e devolve só as fases e rodadas que ainda têm jogos visíveis. */
function filtrarFases(fases, filtro) {
  return fases
    .map((fase) => ({
      ...fase,
      grupos: fase.grupos
        .map((grupo) => ({ ...grupo, visiveis: grupo.jogos.filter((j) => jogoPassaNoFiltro(j, filtro)) }))
        .filter((grupo) => grupo.visiveis.length),
    }))
    .filter((fase) => fase.grupos.length);
}

/** Página /api02: resultados da Champions League 2025/26. */
export default function Champions() {
  const [carga, setCarga] = useState({ estado: 'carregando' });
  const [tentativa, setTentativa] = useState(0);
  const [filtro, setFiltro] = useState(FILTRO_INICIAL);
  const [faseAtual, setFaseAtual] = useState(null);
  const [faseAlvo, setFaseAlvo] = useState(null);
  const { tema, alternar: alternarTema } = useTema();

  const buscaRef = useRef(null);
  const campanhaRef = useRef(null);
  const listaRef = useRef(null);

  /* ---------- Carregamento ---------- */

  useEffect(() => {
    // Cancela a busca se o componente sair da tela (ou no remonte do StrictMode).
    const controle = new AbortController();
    setCarga({ estado: 'carregando' });

    carregarJogos({ signal: controle.signal })
      .then((dados) => setCarga({ estado: 'pronto', temporada: montarTemporada(dados) }))
      .catch((erro) => {
        if (controle.signal.aborted) return;
        console.error(erro);
        const mensagem = erro instanceof ErroDeCarregamento
          ? erro.message
          : 'Os dados chegaram, mas não foi possível montar a tela.';
        setCarga({ estado: 'erro', mensagem });
      });

    return () => controle.abort();
  }, [tentativa]);

  const { temporada } = carga;

  const fasesVisiveis = useMemo(
    () => (temporada ? filtrarFases(temporada.fases, filtro) : []),
    [temporada, filtro],
  );
  const totalVisivel = fasesVisiveis.reduce(
    (soma, fase) => soma + fase.grupos.reduce((s, g) => s + g.visiveis.length, 0), 0,
  );
  const campanha = useMemo(
    () => (temporada && filtro.time ? campanhaDoTime(temporada.jogos, filtro.time) : []),
    [temporada, filtro.time],
  );

  /* ---------- Ações ---------- */

  const escolherTime = (nome) => {
    setFiltro((atual) => ({ ...atual, busca: '', time: atual.time === nome ? null : nome }));
  };

  const fecharCampanha = () => {
    setFiltro((atual) => ({ ...atual, time: null }));
    buscaRef.current?.focus();
  };

  const limparFiltros = () => setFiltro(FILTRO_INICIAL);

  const navegarParaFase = (slug) => {
    // Se o filtro escondeu a fase, limpa os filtros e rola depois de renderizar.
    if (!fasesVisiveis.some((f) => f.slug === slug)) setFiltro(FILTRO_INICIAL);
    setFaseAlvo(slug);
  };

  /* ---------- Efeitos de rolagem e foco ---------- */

  // Ao escolher um time, leva a pessoa (e o foco do teclado) até a campanha.
  useEffect(() => {
    if (!filtro.time) return;
    campanhaRef.current?.scrollIntoView?.({ behavior: comportamentoDeRolagem(), block: 'start' });
    campanhaRef.current?.focus({ preventScroll: true });
  }, [filtro.time]);

  useEffect(() => {
    if (!faseAlvo) return;
    const secao = document.getElementById(`fase-${faseAlvo}`);
    if (!secao) return;
    secao.scrollIntoView?.({ behavior: comportamentoDeRolagem(), block: 'start' });
    document.getElementById(`titulo-${faseAlvo}`)?.focus({ preventScroll: true });
    setFaseAlvo(null);
  }, [faseAlvo, fasesVisiveis]);

  // Marca na trilha a fase que está visível enquanto a pessoa rola.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !listaRef.current) return undefined;

    const observador = new IntersectionObserver((entradas) => {
      const visivel = entradas
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visivel) setFaseAtual(visivel.target.dataset.fase);
    }, { rootMargin: '-30% 0px -60% 0px' });

    listaRef.current.querySelectorAll('.fase').forEach((secao) => observador.observe(secao));
    return () => observador.disconnect();
  }, [fasesVisiveis]);

  /* ---------- Tela ---------- */

  const pronto = carga.estado === 'pronto';
  const filtrando = filtro.busca || filtro.tipo !== 'todos' || filtro.time;

  return (
    <div className="champions" data-estado={carga.estado}>
      <a className="pular" href="#lista-jogos">Pular para os jogos</a>

      <header className="topo">
        <div className="topo__interno">
          <p className="topo__marca">Champions League 2025/26</p>
          <button
            type="button"
            className="topo__tema"
            onClick={alternarTema}
            aria-pressed={tema === 'escuro'}
          >
            <span aria-hidden="true">{tema === 'escuro' ? '☾' : '☀'}</span> Modo escuro
          </button>
        </div>
      </header>

      {carga.estado !== 'erro' && (
        <section className="destaque" aria-label={temporada?.temFinal ? 'A final' : 'Jogo em destaque'}>
          {temporada?.destaque && (
            <Placar key={temporada.destaque.id} jogo={temporada.destaque} ehFinal={temporada.temFinal} aoEscolherTime={escolherTime} />
          )}
        </section>
      )}

      {pronto && <Trilha fases={temporada.fases} faseAtual={faseAtual} aoNavegar={navegarParaFase} />}

      <main className="painel">
        <section className="jogos" aria-labelledby="jogos-titulo">
          <h1 id="jogos-titulo" className="visually-hidden">Jogos da Champions League 2025/26</h1>

          {pronto && (
            <div className="filtros">
              <label className="busca">
                <span className="visually-hidden">Buscar time</span>
                <svg className="busca__icone" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M13 13l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  ref={buscaRef}
                  type="search"
                  placeholder="Buscar time"
                  autoComplete="off"
                  value={filtro.busca}
                  onChange={(e) => setFiltro((atual) => ({ ...atual, busca: e.target.value, time: null }))}
                />
              </label>

              <div className="segmentado" role="group" aria-label="Tipo de resultado">
                {TIPOS_DE_FILTRO.map((tipo) => (
                  <button
                    key={tipo.id}
                    type="button"
                    aria-pressed={filtro.tipo === tipo.id}
                    onClick={() => setFiltro((atual) => ({ ...atual, tipo: tipo.id }))}
                  >
                    {tipo.nome}
                  </button>
                ))}
              </div>

              <p className="contagem" aria-live="polite">
                {filtrando ? `${totalVisivel} de ${temporada.jogos.length} jogos` : `${temporada.jogos.length} jogos`}
              </p>
            </div>
          )}

          {pronto && filtro.time && (
            <Campanha ref={campanhaRef} time={filtro.time} campanha={campanha} aoFechar={fecharCampanha} />
          )}

          <div id="lista-jogos" ref={listaRef} tabIndex={-1}>
            {carga.estado === 'carregando' && <Carregando />}
            {carga.estado === 'erro' && <Erro mensagem={carga.mensagem} aoTentarDeNovo={() => setTentativa((n) => n + 1)} />}
            {pronto && (totalVisivel
              ? <ListaJogos fases={fasesVisiveis} timeSelecionado={filtro.time} aoEscolherTime={escolherTime} />
              : <Vazio aoLimpar={limparFiltros} />)}
          </div>
        </section>

        {pronto && (
          <aside className="lateral" aria-labelledby="tabela-titulo">
            <h2 className="lateral__titulo" id="tabela-titulo">Fase de liga</h2>
            <Classificacao tabela={temporada.classificacao} timeSelecionado={filtro.time} aoEscolherTime={escolherTime} />
          </aside>
        )}
      </main>

      <footer className="rodape">
        <p>Resultados de football-data.org, servidos pela API do projeto.</p>
      </footer>
    </div>
  );
}
