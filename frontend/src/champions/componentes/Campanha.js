import { plural } from '../formatar';
import { FASES } from '../temporada';

const NOME_RESULTADO = { V: 'Vitória', E: 'Empate', D: 'Derrota' };
const nomeDaFase = (id) => FASES.find((f) => f.id === id)?.nome ?? id;

function descreverJogo(c) {
  const penaltis = c.penaltis ? `, pênaltis ${c.penaltis.pro} a ${c.penaltis.contra}` : '';
  return `${NOME_RESULTADO[c.resultado]} por ${c.pro} a ${c.contra}${penaltis} ${c.emCasa ? 'em casa' : 'fora'} contra ${c.adversario} (${nomeDaFase(c.fase)})`;
}

/** Campanha do time escolhido: resumo e sequência V/E/D. No React 19, `ref` chega como prop comum. */
export default function Campanha({ time, campanha, aoFechar, ref }) {
  const contar = (r) => campanha.filter((c) => c.resultado === r).length;
  const golsPro = campanha.reduce((s, c) => s + c.pro, 0);
  const golsContra = campanha.reduce((s, c) => s + c.contra, 0);

  return (
    <section className="campanha" aria-labelledby="campanha-titulo" ref={ref} tabIndex={-1}>
      <div className="campanha__topo">
        <h2 className="campanha__time" id="campanha-titulo">{time}</h2>
        <button type="button" className="campanha__fechar" onClick={aoFechar}>Ver todos os times</button>
      </div>
      <p className="campanha__resumo">
        {`${plural(campanha.length, 'jogo', 'jogos')}: ${plural(contar('V'), 'vitória', 'vitórias')}, `
          + `${plural(contar('E'), 'empate', 'empates')} e ${plural(contar('D'), 'derrota', 'derrotas')}. `
          + `${plural(golsPro, 'gol marcado', 'gols marcados')} e ${golsContra} sofridos.`}
      </p>
      <ol className="campanha__sequencia" aria-label="Resultados em ordem cronológica">
        {campanha.map((c) => (
          <li key={c.id} className={`campanha__jogo campanha__jogo--${c.resultado}`} title={descreverJogo(c)}>
            <span className="visually-hidden">{descreverJogo(c)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
