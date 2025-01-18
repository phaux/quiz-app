import { useEffect } from "react";
import { useParams } from "react-router";
import { useLocalStorage } from "./useLocalStorage.ts";
import { useRoom } from "./useRoom.tsx";

export function RoomPage() {
  const { roomId } = useParams();

  const [name] = useLocalStorage("name");
  const [room, sendCommand] = useRoom(roomId!);

  useEffect(() => {
    sendCommand({ type: "joinRoom", player: name! });
  }, [roomId, name]);

  const isHost = room?.players[name!]?.isHost ?? false;

  return (
    <>
      <h1>Room {roomId}</h1>

      <section>
        <h2>Players</h2>
        <ul>
          {Object.entries(room?.players ?? {}).map(([playerId, player]) => (
            <li key={playerId}>
              {playerId} {player.isHost ? "(host)" : ""} - {player.score} points{" "}
              {isHost ? (
                <button
                  onClick={() => {
                    sendCommand({ type: "makeHost", player: playerId });
                  }}
                >
                  Make host
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {room?.question != null ? (
        <section>
          <h2>{room.question.category}</h2>
          <p>{room.question.question}</p>
          {isHost ? (
            <>
              <p>Correct answer: {room.question.answer}</p>
              <p>Info: {room.question.info}</p>
            </>
          ) : null}
        </section>
      ) : null}

      {!isHost &&
      room?.question != null &&
      room.question.answeringPlayer == null ? (
        <button
          onClick={() => {
            sendCommand({ type: "assignQuestion", player: name! });
          }}
        >
          Answer
        </button>
      ) : null}

      {room?.question?.answeringPlayer != null ? (
        <p>{room.question.answeringPlayer} is answering the question.</p>
      ) : null}

      {isHost &&
      room?.question != null &&
      room.question.answeringPlayer != null &&
      room.question.answerIsCorrect == null ? (
        <section>
          <h2>Rate player's answer</h2>
          <div>
            <button
              onClick={() => {
                sendCommand({ type: "rateAnswer", correct: true });
              }}
            >
              Correct
            </button>
            <button
              onClick={() => {
                sendCommand({ type: "rateAnswer", correct: false });
              }}
            >
              Incorrect
            </button>
          </div>
        </section>
      ) : null}

      {room?.question?.answerIsCorrect != null ? (
        <p>
          {room.question.answeringPlayer} answered the question{" "}
          {room.question.answerIsCorrect ? "correctly" : "incorrectly"}
        </p>
      ) : null}

      {/* <pre>
        <code>{JSON.stringify(room, null, 2)}</code>
      </pre> */}

      {isHost ? (
        <div>
          <button
            onClick={() => {
              sendCommand({ type: "nextQuestion" });
            }}
          >
            Next question
          </button>
          <button
            onClick={() => {
              sendCommand({ type: "resetPoints" });
            }}
          >
            Reset points
          </button>
        </div>
      ) : null}
    </>
  );
}
