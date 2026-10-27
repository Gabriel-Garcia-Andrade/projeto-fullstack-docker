import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// O axios 1.x é ESM e o Jest do CRA não o transforma; com uma fábrica, o módulo real nem é carregado.
jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn(() => Promise.resolve({ data: [] })) } }));

function jogo(casa, fora, golsCasa, golsFora, extra = {}) {
  return {
    data: extra.data ?? '2025-09-16T19:00:00Z',
    fase: extra.fase ?? 'LEAGUE_STAGE',
    rodada: extra.rodada === undefined ? 1 : extra.rodada,
    mandante: casa,
    visitante: fora,
    nome_curto_mandante: casa,
    nome_curto_visitante: fora,
    sigla_mandante: casa.slice(0, 3).toUpperCase(),
    sigla_visitante: fora.slice(0, 3).toUpperCase(),
    escudo_mandante: null,
    escudo_visitante: null,
    gols_mandante: golsCasa,
    gols_visitante: golsFora,
    penaltis_mandante: extra.penaltis?.[0] ?? null,
    penaltis_visitante: extra.penaltis?.[1] ?? null,
    status: 'Encerrado',
    vencedor: extra.vencedor ?? (golsCasa > golsFora ? casa : golsFora > golsCasa ? fora : 'Empate'),
  };
}

const DADOS = [
  jogo('FC Bayern München', 'Paris Saint-Germain FC', 2, 1),
  jogo('Arsenal FC', 'FC Barcelona', 4, 0, { data: '2025-09-17T19:00:00Z' }),
  jogo('Paris Saint-Germain FC', 'Arsenal FC', 1, 1, {
    fase: 'FINAL', rodada: null, data: '2026-05-30T16:00:00Z', penaltis: [4, 3], vencedor: 'Paris Saint-Germain FC',
  }),
];

const respostaJson = (corpo, status = 200) => Promise.resolve({
  ok: status < 400,
  status,
  json: () => Promise.resolve(corpo),
});

beforeEach(() => {
  window.history.pushState({}, '', '/api02');
  global.fetch = jest.fn(() => respostaJson(DADOS));
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

test('/api02 mostra a final em destaque com os pênaltis', async () => {
  render(<App />);
  expect(await screen.findByText(/é campeão da Europa nos pênaltis \(4 a 3\)/)).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith('/api02', expect.anything());
});

test('a trilha mostra todas as fases, inclusive as sem jogos', async () => {
  render(<App />);
  const trilha = await screen.findByRole('navigation', { name: 'Fases da competição' });
  expect(within(trilha).getAllByRole('listitem')).toHaveLength(6);
  expect(within(trilha).getAllByText('sem jogos')).toHaveLength(4);
});

// user-event instalado é a v13: as ações são chamadas direto (a v14 usaria userEvent.setup()).
test('busca sem acento e filtro de goleadas atualizam a contagem', async () => {
  render(<App />);
  await screen.findByText('3 jogos');

  userEvent.type(screen.getByRole('searchbox', { name: 'Buscar time' }), 'munchen');
  expect(screen.getByText('1 de 3 jogos')).toBeInTheDocument();

  userEvent.clear(screen.getByRole('searchbox', { name: 'Buscar time' }));
  userEvent.click(screen.getByRole('button', { name: 'Goleadas' }));
  expect(screen.getByText('1 de 3 jogos')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Goleadas' })).toHaveAttribute('aria-pressed', 'true');
});

test('clicar no time abre a campanha dele', async () => {
  render(<App />);
  await screen.findByText('3 jogos');

  userEvent.click(screen.getByRole('button', { name: 'Arsenal FC: ver campanha' }));
  expect(screen.getByRole('heading', { name: 'Arsenal FC' })).toBeInTheDocument();
  expect(screen.getByText(/2 jogos: 1 vitória, 0 empates e 1 derrota/)).toBeInTheDocument();
});

test('erro do backend aparece com a mensagem do FastAPI e permite tentar de novo', async () => {
  global.fetch = jest.fn()
    .mockImplementationOnce(() => respostaJson({ detail: 'A football-data recusou o token.' }, 502))
    .mockImplementation(() => respostaJson(DADOS));
  render(<App />);

  expect(await screen.findByRole('alert')).toHaveTextContent('A football-data recusou o token.');
  userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
  expect(await screen.findByText('3 jogos')).toBeInTheDocument();
});

test('backend fora do ar mostra uma mensagem útil', async () => {
  global.fetch = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar ao backend');
});

test('texto vindo da API é exibido como texto, nunca como HTML', async () => {
  const malicioso = '<img src=x onerror="alert(1)">';
  global.fetch = jest.fn(() => respostaJson([jogo(malicioso, 'Arsenal FC', 1, 0)]));
  render(<App />);

  expect(await screen.findAllByText(malicioso)).not.toHaveLength(0);
  // Se o texto tivesse virado HTML, existiria um <img> sem alt (papel "img") na página.
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});
