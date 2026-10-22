import os
from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

class Person(BaseModel):
    id: int
    name: str
    age: int

DB: List[Person] =[
    Person(id=1, name="Gabriel", age=20),
    Person(id=2, name="Garcia", age=21),
    Person(id=3, name="Felipe", age=4),
]

@app.get("/api01")
def read_root():
    return DB


def buscar_partidas_champions():
    """Busca as partidas na football-data e converte falhas em erros HTTP claros."""
    token = os.getenv("Futebol_API_Token")
    if not token:
        raise HTTPException(status_code=500, detail="Token da football-data não configurado (variável Futebol_API_Token).")

    url = "https://api.football-data.org/v4/competitions/CL/matches?season=2025"
    headers = {
        "X-Auth-Token": token
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="A football-data não respondeu a tempo.")
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Não foi possível conectar à football-data.")

    if response.status_code in (401, 403):
        raise HTTPException(status_code=502, detail="A football-data recusou o token. Confira a variável Futebol_API_Token.")
    if response.status_code == 429:
        raise HTTPException(status_code=503, detail="Limite de requisições da football-data atingido. Tente de novo em um minuto.")
    if not response.ok:
        raise HTTPException(status_code=502, detail=f"A football-data respondeu com o status {response.status_code}.")

    return response.json()["matches"]


def gols_sem_penaltis(score, lado):
    """O fullTime da football-data soma os gols da disputa de pênaltis; aqui eles são descontados."""
    gols = score["fullTime"][lado]
    penaltis = (score.get("penalties") or {}).get(lado)
    if gols is not None and penaltis is not None:
        gols -= penaltis
    return gols


@app.get("/api02")
def get_champions_matches():
    jogos_filtrados = []

    for match in buscar_partidas_champions():

        mandante = match["homeTeam"]["name"]
        visitante = match["awayTeam"]["name"]

        nome_curto_mandante = match["homeTeam"].get("shortName") or mandante
        nome_curto_visitante = match["awayTeam"].get("shortName") or visitante

        # A sigla (tla) é só para exibição: pode faltar e não é única (Bayern e Barcelona são "FCB").
        sigla_mandante = match["homeTeam"].get("tla") or nome_curto_mandante
        sigla_visitante = match["awayTeam"].get("tla") or nome_curto_visitante

        escudo_mandante = match["homeTeam"].get("crest")
        escudo_visitante = match["awayTeam"].get("crest")

        score = match["score"]
        gols_mandante = gols_sem_penaltis(score, "home")
        gols_visitante = gols_sem_penaltis(score, "away")

        penaltis = score.get("penalties") or {}
        penaltis_mandante = penaltis.get("home")
        penaltis_visitante = penaltis.get("away")

        status = match["status"]

        # score.winner já considera prorrogação e pênaltis (um 1x1 pode ter vencedor).
        vencedores = {
            "HOME_TEAM": mandante,
            "AWAY_TEAM": visitante,
            "DRAW": "Empate",
        }
        vencedor = vencedores.get(score.get("winner"), "Jogo não finalizado")

        if status == "FINISHED":
            status = "Encerrado"

        jogos_filtrados.append({
            "data": match["utcDate"],
            "fase": match["stage"],
            "rodada": match["matchday"],
            "mandante": mandante,
            "visitante": visitante,
            "nome_curto_mandante": nome_curto_mandante,
            "nome_curto_visitante": nome_curto_visitante,
            "sigla_mandante": sigla_mandante,
            "sigla_visitante": sigla_visitante,
            "escudo_mandante": escudo_mandante,
            "escudo_visitante": escudo_visitante,
            "gols_mandante": gols_mandante,
            "gols_visitante": gols_visitante,
            "penaltis_mandante": penaltis_mandante,
            "penaltis_visitante": penaltis_visitante,
            "status": status,
            "vencedor": vencedor
        })

    return jogos_filtrados
