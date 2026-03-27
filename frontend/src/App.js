import "./App.css";
import axios from "axios";
import { useEffect, useState } from "react";

function App() {
  const [people, setPeople] = useState([]);
  const [jogos, setJogos] = useState([]);

  useEffect(() => {
    const path = window.location.pathname

    if (path === "/api01"){
    axios
      .get("/api01")
      .then((res) => {
        setPeople(res.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar dados da api01:", error);
      });
    }

    if (path === "/api02"){
    axios
      .get("/api02")
      .then((res) => {
        setJogos(res.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar dados da api02:", error);
      });
    }
  }, []);

  if(window.location.pathname === "/api01") {
    return (
      <div>
        <h1>API 01 - Pessoas</h1>

        {people.map((p) => (
          <p key={p.id}>
            {p.id} {p.name} {p.age}
          </p>
        ))}
      </div>
    );
  }

    if(window.location.pathname === "/api02") {
      return (
      <div className="container">
        <h1 className="titulo">RESULTADOS DOS JOGOS</h1>

        {jogos.map((jogo, index) => (
          <div className="card-jogo" key={index}>
            <div className="info-data">
              <p>{jogo.data}</p>
              <p>{jogo.hora}</p>
            </div>

            <div className="info-times">
              <div className="time">
                <img
                  src={jogo.escudo_mandante}
                  alt={jogo.mandante}
                  className="escudo"
                />
                <span>{jogo.mandante}</span>
              </div>

              <div className="placar">
                <span className="gol">{jogo.gols_mandante}</span>
                <span className="separador">x</span>
                <span className="gol">{jogo.gols_visitante}</span>
              </div>

              <div className="time">
                <img
                  src={jogo.escudo_visitante}
                  alt={jogo.visitante}
                  className="escudo"
                />
                <span>{jogo.visitante}</span>
              </div>
            </div>

            <div className="info-extra">
              <p className="vencedor"><strong>Vencedor:</strong> {jogo.vencedor}</p>
              <span className="status">{jogo.status}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
export default App;