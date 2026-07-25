import { useState } from "react";
import { MAX_PLAYERS } from "../../engine/roles";
import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";

export function PlayersScreen() {
  const session = useSession();
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const full = session.players.length >= MAX_PLAYERS;

  function add() {
    if (!name.trim() || full) return;
    dispatch({ type: "addPlayer", name });
    setName("");
  }

  return (
    <section className="screen">
      <h2>{strings.players}</h2>

      <div className="row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && add()}
          placeholder={strings.playerNamePlaceholder}
          maxLength={16}
          disabled={full}
        />
        <Button onClick={add} disabled={full}>
          {strings.addPlayer}
        </Button>
      </div>

      {full && <p className="notice">{strings.tableFull}</p>}

      <ul className="stack">
        {session.players.map((player) => (
          <li key={player.id} className="row">
            <span>{player.name}</span>
            <Button
              variant="danger"
              onClick={() => dispatch({ type: "removePlayer", id: player.id })}
            >
              {strings.removePlayer}
            </Button>
          </li>
        ))}
      </ul>

      <Button variant="ghost" onClick={() => dispatch({ type: "navigate", to: "home" })}>
        {strings.back}
      </Button>
    </section>
  );
}
