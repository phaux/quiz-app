import { useNavigate } from "react-router";
import { getRandomName } from "./getRandomName.tsx";
import { useLocalStorage } from "./useLocalStorage.ts";

export function HomePage() {
  const navigate = useNavigate();
  const [name, setName] = useLocalStorage("name", getRandomName());
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const room = formData.get("room") as string;
    navigate(`rooms/${room}`);
  }

  return (
    <main className="self-center m-auto w-full max-w-screen-sm flex flex-col items-stretch gap-4 p-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-lg">
      <h1>Home</h1>

      <form onSubmit={handleSubmit}>
        <label className="floating-label">
          <span>Your name</span>
          <input
            className="input"
            type="text"
            name="name"
            required
            value={name ?? ""}
            onChange={(ev) => setName(ev.target.value)}
            placeholder="Your name"
          />
        </label>
        <label>
          <span>Room name</span>
          <input type="text" name="room" required />
        </label>
        {/* <label>
          <input type="checkbox" />
          Test
        </label> */}
        <button className="btn btn-primary" type="submit">
          Join room
        </button>
      </form>
    </main>
  );
}
