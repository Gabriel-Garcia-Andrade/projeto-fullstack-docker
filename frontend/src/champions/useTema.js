import { useEffect, useState } from 'react';

const CHAVE = 'champions:tema';

/** localStorage pode falhar (aba anônima, cookies bloqueados): nunca deixa a tela quebrar. */
function lerTemaSalvo() {
  try {
    const salvo = window.localStorage.getItem(CHAVE);
    return salvo === 'claro' || salvo === 'escuro' ? salvo : null;
  } catch {
    return null;
  }
}

function salvarTema(tema) {
  try {
    window.localStorage.setItem(CHAVE, tema);
  } catch {
    // Sem persistência: o tema vale só para esta visita.
  }
}

const sistemaEscuro = () => Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);

/**
 * Tema claro/escuro. Sem escolha salva, segue o sistema (o CSS resolve via
 * prefers-color-scheme). Com escolha, grava em <html data-theme="...">.
 */
export default function useTema() {
  const [escolhido, setEscolhido] = useState(lerTemaSalvo);
  const efetivo = escolhido ?? (sistemaEscuro() ? 'escuro' : 'claro');

  useEffect(() => {
    const raiz = document.documentElement;
    if (escolhido) raiz.dataset.theme = escolhido === 'escuro' ? 'dark' : 'light';
    return () => { delete raiz.dataset.theme; };
  }, [escolhido]);

  const alternar = () => {
    const proximo = efetivo === 'escuro' ? 'claro' : 'escuro';
    salvarTema(proximo);
    setEscolhido(proximo);
  };

  return { tema: efetivo, alternar };
}
