import { allPacks } from "../../content";
import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";

export function PacksScreen() {
  const session = useSession();
  const dispatch = useDispatch();

  const visible = allPacks.filter((pack) => pack.tier === "family" || session.friendsUnlocked);

  return (
    <section className="screen">
      <h2>{strings.packs}</h2>

      {session.selectedPackIds.length === 0 && <p className="notice">{strings.needOnePack}</p>}

      <ul className="stack">
        {visible.map((pack) => (
          <li key={pack.id}>
            <label className="row">
              <input
                type="checkbox"
                checked={session.selectedPackIds.includes(pack.id)}
                onChange={() => dispatch({ type: "togglePack", id: pack.id })}
              />
              <span>
                {pack.emoji} {pack.name}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {!session.friendsUnlocked && (
        <div className="stack">
          <p className="notice">{strings.friendsWarning}</p>
          <Button variant="ghost" onClick={() => dispatch({ type: "unlockFriends" })}>
            {strings.unlockFriends}
          </Button>
        </div>
      )}

      <Button variant="ghost" onClick={() => dispatch({ type: "navigate", to: "home" })}>
        {strings.back}
      </Button>
    </section>
  );
}
