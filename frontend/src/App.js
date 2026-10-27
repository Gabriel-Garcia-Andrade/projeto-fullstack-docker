import "./App.css";
import axios from "axios";
import { useEffect, useState } from "react";
import Champions from "./champions/Champions";

function App() {
  const [people, setPeople] = useState([]);

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
    return <Champions />;
  }
}
export default App;
