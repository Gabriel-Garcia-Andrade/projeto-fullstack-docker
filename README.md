# Projeto Fullstack com FastAPI, React e Docker

Aplicação fullstack desenvolvida com **FastAPI** no backend e **React** no frontend, com integração a uma **API externa de futebol**. O projeto foi construído com o objetivo de demonstrar a comunicação entre frontend e backend, a separação de responsabilidades entre as camadas da aplicação e a execução do ambiente por meio de **containers Docker**.

---

## Visão Geral

A aplicação possui duas funcionalidades principais:

- **`/api01`**: retorna uma lista estática de usuários cadastrados no backend.
- **`/api02`**: consome a API externa **football-data** e retorna partidas da Champions League com os dados tratados para exibição no frontend.

No frontend, os dados são exibidos em páginas separadas de acordo com a rota acessada.

---

## Tecnologias Utilizadas

### Backend
- Python
- FastAPI
- Uvicorn
- Requests
- Pydantic
- Python-dotenv

### Frontend
- React
- Axios
- CSS

### Containerização
- Docker

---

## Estrutura do Projeto

```bash
backend/
├── main.py
├── requirements.txt
├── Dockerfile
├── .dockerignore
└── .env

frontend/
├── public/
├── src/
├── package.json
├── package-lock.json
├── Dockerfile
├── .dockerignore
└── .gitignore
```

---

## Funcionalidades

- Disponibilização de dados locais por meio da rota **`/api01`**
- Consumo de uma API externa de futebol por meio da rota **`/api02`**
- Exibição separada dos dados no frontend conforme a rota acessada
- Apresentação visual das partidas com:
  - data da partida
  - nome dos times
  - escudos
  - placar
  - status da partida
  - vencedor
- Execução da aplicação com **containers separados** para backend e frontend
- Comunicação entre os serviços por meio de uma **rede Docker compartilhada**

---

## Endpoints da Aplicação

### Backend

- **`GET /api01`**  
  Retorna uma lista estática de usuários cadastrados no backend.

- **`GET /api02`**  
  Consome a API externa **football-data** e retorna partidas da Champions League com informações formatadas para o frontend.

---

## Integração com API Externa

A rota **`/api02`** depende de um token da API **football-data**.

### Como obter o token

1. Acesse o site **[football-data.org](https://www.football-data.org/)**  
2. Crie uma conta na plataforma  
3. Gere ou copie o token disponibilizado  
4. Utilize esse token na execução do projeto  

---

## Variáveis de Ambiente

O backend utiliza a biblioteca **python-dotenv** para carregar variáveis de ambiente a partir de um arquivo `.env`.

Essa abordagem foi adotada para armazenar o token da API externa de forma mais segura, evitando deixá-lo fixo diretamente no código.

Exemplo de configuração no arquivo `.env`:

```env
Futebol_API_Token=seu_token_aqui
```

Durante a execução com Docker, essa variável também pode ser informada diretamente no comando de inicialização do container.

---

## Comunicação entre os Containers

Como o frontend e o backend são executados em containers separados, a comunicação entre eles dentro da rede Docker não acontece por `localhost`, mas sim pelo **nome do container do backend**.

Neste projeto, o container do backend foi nomeado como **`backend`**. Por isso, o frontend deve utilizar esse mesmo nome no proxy ou na URL das requisições internas.

Exemplo:

```json
"proxy": "http://backend:8000"
```

Dessa forma, o container do frontend consegue localizar corretamente o container do backend dentro da rede Docker compartilhada.

---

## Pré-requisitos

Antes de executar o projeto, é necessário ter as seguintes ferramentas instaladas na máquina:

- [Git](https://git-scm.com/) para clonar o repositório
- [Docker](https://www.docker.com/products/docker-desktop/) para criar e executar os containers da aplicação

Além disso, para que a rota **`/api02`** funcione corretamente, é necessário possuir uma conta e um **token de API** válido gerado na plataforma [football-data.org](https://www.football-data.org/).

### Execução local sem Docker (opcional)

Caso deseje executar o projeto localmente, sem utilizar Docker, também será necessário ter instalado:

- [Python 3.10+](https://www.python.org/)
- [Node.js](https://nodejs.org/)

---

## Como Executar o Projeto

Para rodar a aplicação, é necessário ter o **Docker** instalado na máquina.

### 1. Entrar na pasta do backend

Primeiro, acesse a pasta `backend`, onde estão os arquivos necessários para criar a imagem do servidor da aplicação.

```bash
cd backend
```

### 2. Criar a imagem Docker do backend

Com o terminal já dentro da pasta `backend`, execute o comando abaixo para gerar a imagem do backend.

```bash
docker build -t backend_atividade .
```

### 3. Voltar para a raiz do projeto

Depois de criar a imagem do backend, volte para a pasta principal do projeto para seguir para a próxima etapa.

```bash
cd ..
```

### 4. Entrar na pasta do frontend

Agora, acesse a pasta `frontend`, que contém os arquivos necessários para criar a imagem da interface da aplicação.

```bash
cd frontend
```

### 5. Criar a imagem Docker do frontend

Com o terminal dentro da pasta `frontend`, execute o comando abaixo para gerar a imagem do frontend.

```bash
docker build -t frontend_atividade .
```

### 6. Voltar para a raiz do projeto

Depois de criar a imagem do frontend, volte novamente para a pasta principal do projeto.

```bash
cd ..
```

### 7. Criar a rede Docker

Crie uma rede Docker para permitir a comunicação entre os containers do frontend e do backend.

```bash
docker network create fullstack
```

### 8. Rodar o container do backend

Substitua **`seu_token_aqui`** pelo token obtido na plataforma **football-data**.

Esse comando cria e executa o container do backend com o nome **`backend`**, que será utilizado pelo frontend para se comunicar com a API dentro da rede Docker.

```bash
docker run -d --name backend --network fullstack -p 8000:8000 -e Futebol_API_Token=seu_token_aqui backend_atividade
```

### 9. Rodar o container do frontend

Esse comando cria e executa o container do frontend, conectando-o à mesma rede do backend.

```bash
docker run -d --name frontend --network fullstack -p 3000:3000 frontend_atividade
```

---

## Fluxo de Execução

O fluxo correto para executar o projeto é:

1. Entrar na pasta do backend  
2. Criar a imagem do backend  
3. Voltar para a raiz do projeto  
4. Entrar na pasta do frontend  
5. Criar a imagem do frontend  
6. Voltar para a raiz do projeto  
7. Criar a rede Docker  
8. Rodar o container do backend  
9. Rodar o container do frontend  

Seguindo essa sequência, os containers serão criados corretamente e a comunicação entre frontend e backend funcionará da forma esperada.

---

## Como Acessar a Aplicação

### Frontend
- **http://localhost:3000/api01**
- **http://localhost:3000/api02**

### Backend
- **http://localhost:8000/api01**
- **http://localhost:8000/api02**

---

## Arquitetura da Aplicação

### Backend
Responsável por:

- disponibilizar as rotas da aplicação
- retornar dados locais na rota **`/api01`**
- consumir a API externa de futebol na rota **`/api02`**
- tratar e organizar os dados antes de enviá-los ao frontend

### Frontend
Responsável por:

- consumir as rotas do backend
- exibir os dados em páginas separadas
- apresentar visualmente as informações das partidas

### Docker
A aplicação utiliza:

- **1 container para o backend**
- **1 container para o frontend**
- **1 rede Docker compartilhada** para permitir a comunicação entre os serviços

---

## Observações

- O backend precisa estar em execução para que o frontend consiga consumir as rotas corretamente.
- A rota **`/api02`** depende de conexão com a internet e de um token válido da API externa.
- O projeto foi desenvolvido com foco em aprendizado de integração entre frontend e backend, consumo de API externa e containerização com Docker.