import { useEffect, useState } from 'react';
import Escudo from './Escudo';
import { formatarDiaCompleto, reduzirMovimento } from '../formatar';
import { nomeDoVencedor } from '../temporada';

const PASSO_MS = 140;

/**
 * Conta de 0 até o placar final, uma única vez ao montar.
 * Com prefers-reduced-motion, mostra o valor final direto.
 */
function useContagem(alvo, atrasoMs) {
  const [atual, setAtual] = useState(() => (reduzirMovimento() ? alvo : 0));

  useEffect(() => {
    if (reduzirMovimento()) {
      setAtual(alvo);
      return undefined;
    }
    setAtual(0);
    let valor = 0;
    let timer = setTimeout(function passo() {
      if (valor >= alvo) return;
      valor += 1;
      setAtual(valor);
      timer = setTimeout(passo, PASSO_MS);
    }, atrasoMs);
    return () => clearTimeout(timer);
  }, [alvo, atrasoMs]);

  return atual;
}

/** Cada dígito vira uma "plaqueta" do placar eletrônico. */
function Digitos({ valor }) {
  return (
    <span className="placa__numero">
      {String(valor).split('').map((d, i) => (
        // A key muda a cada número: o React recria o span e a animação CSS roda de novo.
        <span key={`${i}-${valor}`} className="placa__digito placa__digito--vira">{d}</span>
      ))}
    </span>
  );
}

function LadoDoPlacar({ time, posicao, perdeu, aoEscolherTime }) {
  return (
    <button
      type="button"
      className={`placa__time placa__time--${posicao}${perdeu ? ' placa__time--perdeu' : ''}`}
      onClick={() => aoEscolherTime(time.nome)}
      aria-label={`Ver campanha de ${time.nome}`}
    >
      <Escudo time={time} tamanho="g" />
      <span className="placa__sigla">{time.sigla}</span>
      <span className="placa__nome">{time.curto}</span>
    </button>
  );
}

function legendaDoJogo(jogo, ehFinal) {
  const vencedor = nomeDoVencedor(jogo);
  const { mandante, visitante } = jogo;
  const nosPenaltis = mandante.penaltis != null
    ? ` nos pênaltis (${mandante.penaltis} a ${visitante.penaltis})`
    : '';

  if (!vencedor) return ehFinal ? 'A final terminou empatada.' : 'Terminou empatado.';
  if (ehFinal) return `${vencedor} é campeão da Europa${nosPenaltis}.`;
  return `Vitória de ${vencedor}${nosPenaltis}.`;
}

/** Placar em destaque: a final (ou o último jogo encerrado) em estilo de placar de estádio. */
export default function Placar({ jogo, ehFinal, aoEscolherTime }) {
  const golsMandante = useContagem(jogo.mandante.gols, 500);
  const golsVisitante = useContagem(jogo.visitante.gols, 720);

  const vencedor = nomeDoVencedor(jogo);
  const { mandante, visitante } = jogo;
  const temPenaltis = mandante.penaltis != null;

  const descricao = `${mandante.nome} ${mandante.gols}, ${visitante.nome} ${visitante.gols}`
    + (temPenaltis ? `. Pênaltis: ${mandante.penaltis} a ${visitante.penaltis}` : '');

  return (
    <>
      <p className="placa__contexto">
        <span>{ehFinal ? 'A final' : 'Último jogo'}</span>
        <time dateTime={jogo.data.toISOString()}>{formatarDiaCompleto(jogo.data)}</time>
      </p>

      <div className="placa">
        <LadoDoPlacar time={mandante} posicao="casa" perdeu={vencedor && vencedor !== mandante.nome} aoEscolherTime={aoEscolherTime} />

        <div className="placa__centro">
          {/* O placar visual anima; leitores de tela recebem o resultado final de uma vez. */}
          <p className="visually-hidden">{descricao}</p>
          <div className="placa__placar" aria-hidden="true">
            <Digitos valor={golsMandante} />
            <span className="placa__separador" />
            <Digitos valor={golsVisitante} />
          </div>
          {temPenaltis && (
            <p className="placa__penaltis" aria-hidden="true">
              Pênaltis <strong>{mandante.penaltis}</strong> – <strong>{visitante.penaltis}</strong>
            </p>
          )}
        </div>

        <LadoDoPlacar time={visitante} posicao="fora" perdeu={vencedor && vencedor !== visitante.nome} aoEscolherTime={aoEscolherTime} />
      </div>

      <p className="placa__legenda">{legendaDoJogo(jogo, ehFinal)}</p>
    </>
  );
}
