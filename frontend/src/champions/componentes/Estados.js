/** Estados da tela que não são a lista de jogos: carregando, erro e filtro vazio. */

export function Carregando() {
  return <p className="estado" role="status">Carregando jogos…</p>;
}

export function Erro({ mensagem, aoTentarDeNovo }) {
  return (
    <div className="estado estado--erro" role="alert">
      <p className="estado__titulo">Os jogos não carregaram.</p>
      <p>{mensagem}</p>
      <ul className="estado__dicas">
        <li>Confira se os containers estão de pé: <code>docker ps</code></li>
        <li>Veja o log do backend: <code>docker logs backend</code></li>
      </ul>
      <div className="estado__acoes">
        <button type="button" className="botao" onClick={aoTentarDeNovo}>Tentar de novo</button>
      </div>
    </div>
  );
}

export function Vazio({ aoLimpar }) {
  return (
    <div className="vazio">
      <p>Nenhum jogo encontrado com esses filtros.</p>
      <button type="button" className="botao" onClick={aoLimpar}>Limpar filtros</button>
    </div>
  );
}
