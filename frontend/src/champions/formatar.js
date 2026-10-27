/** Formatação para exibição. Usa o fuso e o idioma de quem está vendo a página. */

const diaCompleto = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const diaCurto = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const diaMes = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });

const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

export const formatarDiaCompleto = (data) => capitalizar(diaCompleto.format(data));
export const formatarDiaCurto = (data) => capitalizar(diaCurto.format(data).replace(/\./g, ''));
export const formatarHora = (data) => hora.format(data).replace(':', 'h');

/** "16 set a 18 set" para o intervalo de uma rodada. */
export function formatarPeriodo(jogos) {
  if (!jogos.length) return '';
  const inicio = diaMes.format(jogos[0].data).replace('.', '');
  const fim = diaMes.format(jogos.at(-1).data).replace('.', '');
  return inicio === fim ? inicio : `${inicio} a ${fim}`;
}

/** Abreviação usada quando o escudo não carrega: "Real Madrid CF" vira "RM". */
export function iniciais(nome) {
  const ignorar = new Set(['fc', 'cf', 'sk', 'fk', 'afc', 'bc', 'kv', 'sc', 'ssc', 'as', 'pae', 'sfp', 'de', 'e', 'club', 'clube']);
  const palavras = nome.split(/\s+/).filter((p) => !ignorar.has(p.toLowerCase()) && /\p{L}/u.test(p));
  return (palavras.length ? palavras : nome.split(/\s+/)).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

/** Lê a preferência do sistema; matchMedia não existe em todo ambiente (ex.: testes). */
export const reduzirMovimento = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

export const comportamentoDeRolagem = () => (reduzirMovimento() ? 'auto' : 'smooth');
