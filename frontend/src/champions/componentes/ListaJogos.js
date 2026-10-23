import Escudo from './Escudo';
import { formatarDiaCurto, formatarHora, formatarPeriodo } from '../formatar';

function TimeDoJogo({ time, posicao, venceu, perdeu, selecionado, aoEscolherTime }) {
  const classes = [
    'jogo__time', `jogo__time--${posicao}`,
    venceu && 'jogo__time--venceu',
    perdeu && 'jogo__time--perdeu',
    selecionado && 'jogo__time--selecionado',
  ].filter(Boolean).join(' ');

  return (
    <button type="button" className={classes} onClick={() => aoEscolherTime(time.nome)} aria-label={`Ver campanha de ${time.nome}`}>
      <Escudo time={time} />
      {/* No desktop aparece o nome; no mobile, a sigla (o CSS troca). */}
      <span className="jogo__nome jogo__nome--completo">{time.nome}</span>
      <span className="jogo__nome jogo__nome--sigla">{time.sigla}</span>
    </button>
  );
}

function textoDoAgregado({ mandante, visitante, classificado, decisao }, jogo) {
  const placar = `Agregado ${mandante} a ${visitante}`;
  if (!classificado) return `${placar}.`;
  const curto = classificado === jogo.mandante.nome ? jogo.mandante.curto : jogo.visitante.curto;
  return decisao === 'penaltis' ? `${placar}, ${curto} avança nos pênaltis.` : `${placar}, ${curto} avança.`;
}

function LinhaJogo({ jogo, timeSelecionado, aoEscolherTime }) {
  const { mandante, visitante, resultado, agregado } = jogo;
  const temPenaltis = mandante.penaltis != null;

  return (
    <li className={`jogo${resultado ? ` jogo--${resultado}` : ''}`}>
      <time className="jogo__hora" dateTime={jogo.data.toISOString()}>
        <span>{formatarDiaCurto(jogo.data)}</span>
        <span>{formatarHora(jogo.data)}</span>
      </time>

      <TimeDoJogo
        time={mandante} posicao="casa"
        venceu={resultado === 'mandante'} perdeu={resultado === 'visitante'}
        selecionado={timeSelecionado === mandante.nome} aoEscolherTime={aoEscolherTime}
      />

      <span className="jogo__placar">
        {jogo.encerrado ? (
          <>
            <span className="visually-hidden">{`${mandante.gols} a ${visitante.gols}`}</span>
            <span aria-hidden="true">{mandante.gols}</span>
            <span className="jogo__x" aria-hidden="true">–</span>
            <span aria-hidden="true">{visitante.gols}</span>
          </>
        ) : (
          <span className="jogo__x">x</span>
        )}
      </span>

      <TimeDoJogo
        time={visitante} posicao="fora"
        venceu={resultado === 'visitante'} perdeu={resultado === 'mandante'}
        selecionado={timeSelecionado === visitante.nome} aoEscolherTime={aoEscolherTime}
      />

      {!jogo.encerrado && <span className="jogo__status">{jogo.status}</span>}
      {temPenaltis && (
        <p className="jogo__extra">{`Pênaltis: ${mandante.penaltis} a ${visitante.penaltis}`}</p>
      )}
      {agregado && <p className="jogo__extra">{textoDoAgregado(agregado, jogo)}</p>}
    </li>
  );
}

/** Jogos agrupados por fase e rodada, já filtrados. Devolve nada se o filtro esvaziou tudo. */
export default function ListaJogos({ fases, timeSelecionado, aoEscolherTime }) {
  return fases.map((fase) => (
    <section key={fase.id} className="fase" id={`fase-${fase.slug}`} data-fase={fase.slug} aria-labelledby={`titulo-${fase.slug}`}>
      <h2 className="fase__titulo" id={`titulo-${fase.slug}`} tabIndex={-1}>{fase.nome}</h2>
      {fase.grupos.map((grupo) => (
        <div key={grupo.titulo} className="rodada">
          <h3 className="rodada__titulo">
            <span>{grupo.titulo}</span>
            <span className="rodada__periodo">{formatarPeriodo(grupo.jogos)}</span>
          </h3>
          <ul className="rodada__jogos">
            {grupo.visiveis.map((jogo) => (
              <LinhaJogo key={jogo.id} jogo={jogo} timeSelecionado={timeSelecionado} aoEscolherTime={aoEscolherTime} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  ));
}
