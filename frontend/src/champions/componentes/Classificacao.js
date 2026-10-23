import Escudo from './Escudo';

/** Classificação da fase de liga, calculada a partir dos jogos. */
export default function Classificacao({ tabela, timeSelecionado, aoEscolherTime }) {
  if (!tabela.length) {
    return <p className="estado">A fase de liga ainda não tem jogos encerrados.</p>;
  }

  return (
    <>
      <table className="classificacao">
        <caption className="visually-hidden">
          Classificação da fase de liga por pontos, saldo de gols e gols marcados
        </caption>
        <thead>
          <tr>
            <th scope="col" className="num"><abbr title="Posição">#</abbr></th>
            <th scope="col">Time</th>
            <th scope="col" className="num"><abbr title="Jogos">J</abbr></th>
            <th scope="col" className="num"><abbr title="Saldo de gols">SG</abbr></th>
            <th scope="col" className="num"><abbr title="Pontos">Pts</abbr></th>
          </tr>
        </thead>
        <tbody>
          {tabela.map((t) => (
            <tr key={t.nome} className={`zona--${t.zona}${timeSelecionado === t.nome ? ' linha--selecionada' : ''}`}>
              <td className="num pos">{t.posicao}</td>
              <th scope="row">
                <button
                  type="button"
                  className="tabela__time"
                  onClick={() => aoEscolherTime(t.nome)}
                  aria-label={`${t.nome}: ver campanha`}
                  title={t.nome}
                >
                  <Escudo time={t} />
                  <span>{t.sigla}</span>
                </button>
              </th>
              <td className="num">{t.jogos}</td>
              <td className="num">{t.saldo > 0 ? `+${t.saldo}` : t.saldo}</td>
              <td className="num pts">{t.pontos}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="legenda">
        <li className="legenda__item zona--direto">1º ao 8º vão direto às oitavas</li>
        <li className="legenda__item zona--playoff">9º ao 24º disputam os playoffs</li>
        <li className="legenda__item zona--fora">25º ao 36º são eliminados</li>
      </ul>
    </>
  );
}
