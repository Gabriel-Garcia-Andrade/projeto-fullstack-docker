import { useState } from 'react';
import { iniciais } from '../formatar';

/** Escudo do time; se a imagem não existir ou falhar, mostra as iniciais. */
export default function Escudo({ time, tamanho = 'p' }) {
  const [falhou, setFalhou] = useState(false);

  if (!time.escudo || falhou) {
    return (
      <span className={`escudo escudo--${tamanho} escudo--reserva`} aria-hidden="true">
        {iniciais(time.nome)}
      </span>
    );
  }

  const lado = tamanho === 'g' ? 72 : 24;
  return (
    <img
      className={`escudo escudo--${tamanho}`}
      src={time.escudo}
      alt=""
      width={lado}
      height={lado}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFalhou(true)}
    />
  );
}
