import os
from typing import List
from fastapi import FastAPI
from pydantic import BaseModel
import requests
import json
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


@app.get("/api02")
def get_champions_matches():
    token = os.getenv("Futebol_API_Token")
    url = "https://api.football-data.org/v4/competitions/CL/matches?season=2025"
    headers = {
        "X-Auth-Token": token
    }

    response = requests.get(url, headers=headers)
    data = response.json()

    jogos_filtrados = []

    for match in data["matches"]:
        
        mandante = match["homeTeam"]["name"]
        visitante = match["awayTeam"]["name"]

        escudo_mandante = match["homeTeam"].get("crest")
        escudo_visitante = match["awayTeam"].get("crest")

        gols_mandante = match["score"]["fullTime"]["home"]
        gols_visitante = match["score"]["fullTime"]["away"]

        status = match["status"]

        if (gols_mandante is not None) and (gols_visitante is not None):
            if (gols_mandante > gols_visitante):
                vencedor = mandante
            elif (gols_visitante > gols_mandante):
                vencedor = visitante
            else:
                vencedor = "Empate"
        else:
            vencedor = "Jogo não finalizado"

        if status == "FINISHED":
            status = "Encerrado"

        jogos_filtrados.append({
            "data": match["utcDate"],
            "mandante": mandante,
            "visitante": visitante,
            "escudo_mandante": escudo_mandante,
            "escudo_visitante": escudo_visitante,
            "gols_mandante": gols_mandante,
            "gols_visitante": gols_visitante,
            "status": status,
            "vencedor": vencedor
        })

    return jogos_filtrados