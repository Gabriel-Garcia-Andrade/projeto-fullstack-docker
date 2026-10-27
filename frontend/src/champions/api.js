/**
 * Acesso a dados. É o único arquivo que sabe de onde os jogos vêm.
 * A URL é relativa: em desenvolvimento o proxy do package.json repassa
 * /api02 para o container do backend.
 */

export const URL_JOGOS = '/api02';
export const TIMEOUT_MS = 8000;

/** Erro com mensagem pronta para a interface. */
export class ErroDeCarregamento extends Error {
  constructor(mensagem, { causa } = {}) {
    super(mensagem);
    this.name = 'ErroDeCarregamento';
    this.cause = causa;
  }
}

/** O FastAPI devolve erros como {"detail": "..."}; o proxy do React devolve texto. */
async function lerDetalhe(resposta) {
  try {
    const corpo = await resposta.json();
    return typeof corpo?.detail === 'string' ? corpo.detail : null;
  } catch {
    return null;
  }
}

/**
 * Busca JSON com tempo limite. Sem o AbortController, um backend travado
 * deixaria a tela em "carregando" para sempre. O `signal` externo permite
 * cancelar a busca quando o componente sai da tela.
 */
async function buscarJson(url, { timeoutMs, signal }) {
  const controle = new AbortController();
  let estourouTempo = false;
  const timer = setTimeout(() => { estourouTempo = true; controle.abort(); }, timeoutMs);
  const cancelar = () => controle.abort();
  signal?.addEventListener('abort', cancelar);

  try {
    const resposta = await fetch(url, { signal: controle.signal, headers: { Accept: 'application/json' } });
    if (!resposta.ok) {
      const detalhe = await lerDetalhe(resposta);
      throw new ErroDeCarregamento(
        detalhe ?? `O backend respondeu com o status ${resposta.status}. Confira se o container "backend" está rodando.`,
      );
    }
    return await resposta.json();
  } catch (erro) {
    if (erro instanceof ErroDeCarregamento) throw erro;
    if (erro.name === 'AbortError') {
      if (!estourouTempo) throw erro; // cancelado por quem chamou: não é falha
      throw new ErroDeCarregamento(`O backend não respondeu em ${timeoutMs / 1000} segundos.`, { causa: erro });
    }
    throw new ErroDeCarregamento('Não foi possível conectar ao backend. Confira se o container "backend" está rodando.', { causa: erro });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancelar);
  }
}

const CAMPOS_OBRIGATORIOS = ['data', 'fase', 'mandante', 'visitante', 'gols_mandante', 'gols_visitante', 'status'];

/** Valida o mínimo necessário para a tela não quebrar com dados inesperados. */
export function validarJogos(dados) {
  if (!Array.isArray(dados)) {
    throw new ErroDeCarregamento('O backend devolveu um formato inesperado (era esperada uma lista de jogos).');
  }
  const invalido = dados.find((jogo) => CAMPOS_OBRIGATORIOS.some((campo) => !(campo in jogo)));
  if (invalido) {
    const faltando = CAMPOS_OBRIGATORIOS.filter((campo) => !(campo in invalido));
    throw new ErroDeCarregamento(
      `Algum jogo veio sem os campos: ${faltando.join(', ')}. Se o backend foi atualizado, refaça o build da imagem.`,
    );
  }
  return dados;
}

export async function carregarJogos({ url = URL_JOGOS, timeoutMs = TIMEOUT_MS, signal } = {}) {
  const dados = await buscarJson(url, { timeoutMs, signal });
  return validarJogos(dados);
}
