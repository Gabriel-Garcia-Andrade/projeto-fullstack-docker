/** Trilha fixa de fases: sempre as mesmas, na ordem da competição. */
export default function Trilha({ fases, faseAtual, aoNavegar }) {
  return (
    <nav className="trilha" aria-label="Fases da competição">
      <ol className="trilha__lista">
        {fases.map((fase) => {
          const rotulo = fase.total === 1 ? '1 jogo' : `${fase.total} jogos`;

          // Fase ainda sem jogos: aparece na trilha, mas não é um link.
          if (!fase.total) {
            return (
              <li key={fase.id} className="trilha__item">
                <span className="trilha__link trilha__link--vazia">
                  <span className="trilha__nome">{fase.nome}</span>
                  <span className="trilha__total">sem jogos</span>
                </span>
              </li>
            );
          }

          return (
            <li key={fase.id} className="trilha__item">
              <a
                href={`#fase-${fase.slug}`}
                className="trilha__link"
                aria-current={faseAtual === fase.slug ? 'step' : undefined}
                onClick={(evento) => { evento.preventDefault(); aoNavegar(fase.slug); }}
              >
                <span className="trilha__nome">{fase.nome}</span>
                <span className="trilha__total">{rotulo}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
