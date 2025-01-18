import questions from "./questions/pl.json" with { type: "json" }
import { RoomState } from "./rooms.ts";
import { Tkv } from "jsr:@smol/tkv";
import * as v from "npm:valibot";

const db = await Deno.openKv();

const rooms = new Tkv<["rooms", string], RoomState>(db);

export function serveApi(request: Request) {
  const url = new URL(request.url);

  const roomId = url.searchParams.get("roomId");

  if (!roomId) {
    return new Response("roomId is required", { status: 400 });
  }

  if (request.headers.get("upgrade") != "websocket") {
    return new Response("Must be a websocket request", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(request);

  const { writable, readable } = websocketToStream(socket);

  const ac = new AbortController();

  rooms
    .watch([["rooms", roomId]])
    .pipeThrough<string>(
      new TransformStream({
        transform(entries, controller) {
          for (const { value } of entries) {
            console.log("Room", roomId, "update", value);
            controller.enqueue(JSON.stringify(value));
          }
        },
      })
    )
    .pipeTo(writable, { signal: ac.signal })
    .catch((err) => console.error("Writing to WS failed:", err));

  handleRoomCommands(roomId, readable)
    .catch((err) => console.error("Reading from WS failed:", err))
    .finally(() => ac.abort());

  return response;
}

const RoomCommand = v.variant("type", [
  v.object({ type: v.literal("joinRoom"), player: v.string() }),
  v.object({ type: v.literal("nextQuestion") }),
  v.object({ type: v.literal("assignQuestion"), player: v.string() }),
  v.object({ type: v.literal("rateAnswer"), correct: v.boolean() }),
  v.object({ type: v.literal("leaveRoom"), player: v.string() }),
  v.object({ type: v.literal("makeHost"), player: v.string() }),
  v.object({ type: v.literal("resetPoints") }),
]);

export type RoomCommand = v.InferOutput<typeof RoomCommand>;

const expireIn = 1000 * 60 * 60 * 24;

async function handleRoomCommands(
  roomId: string,
  stream: ReadableStream<string>
) {
  for await (const message of stream) {
    const command = v.parse(RoomCommand, JSON.parse(message));
    console.log("Room", roomId, "command", command);
    switch (command.type) {
      case "joinRoom": {
        await rooms.atomicUpdate(
          ["rooms", roomId],
          (room) => {
            if (room == null) {
              room = { players: {}, question: null };
            }
            if (!(command.player in room.players)) {
              const isHost = Object.keys(room.players).length == 0;
              room.players[command.player] = { isHost, score: 0 };
            }
            return room;
          },
          { expireIn }
        );
        break;
      }
      case "leaveRoom": {
        await rooms.atomicUpdate(
          ["rooms", roomId],
          (room) => {
            if (room) {
              delete room.players[command.player];
              if (Object.keys(room.players).length === 0) {
                return undefined;
              }
            }
            return room;
          },
          { expireIn }
        );
        break;
      }
      case "makeHost": {
        await rooms.atomicUpdate(["rooms", roomId], (room) => {
          if (room) {
            for (const player in room.players) {
              room.players[player]!.isHost = player === command.player;
            }
          }
          return room;
        });
        break;
      }
      case "resetPoints": {
        await rooms.atomicUpdate(["rooms", roomId], (room) => {
          if (room) {
            for (const player in room.players) {
              room.players[player]!.score = 0;
            }
          }
          return room;
        });
        break;
      }
      case "nextQuestion": {
        await rooms.atomicUpdate(
          ["rooms", roomId],
          (room) => {
            if (room) {
              const question =
                questions[
                  Math.floor(Math.random() * questions.length)
                ]!;
              room.question = {
                ...question,
                answeringPlayer: null,
                answerIsCorrect: null,
              };
            }
            return room;
          },
          { expireIn }
        );
        break;
      }
      case "assignQuestion": {
        await rooms.atomicUpdate(
          ["rooms", roomId],
          (room) => {
            if (room?.question) {
              room.question.answeringPlayer = command.player;
            }
            return room;
          },
          { expireIn }
        );
        break;
      }
      case "rateAnswer": {
        await rooms.atomicUpdate(
          ["rooms", roomId],
          (room) => {
            if (room?.question) {
              const player = room.question.answeringPlayer;
              if (player) {
                room.players[player]!.score += command.correct ? 1 : 0;
                room.question.answerIsCorrect = command.correct;
              }
            }
            return room;
          },
          { expireIn }
        );
        break;
      }
      default: {
        const _: never = command;
        throw new Error(`Unknown command type`);
      }
    }
  }
}

function websocketToStream(socket: WebSocket) {
  return {
    readable: new ReadableStream<string>({
      start(controller) {
        socket.addEventListener("message", (ev) => {
          controller.enqueue(ev.data);
        });
        socket.addEventListener("close", () => {
          controller.close();
        });
        socket.addEventListener("error", (ev) => {
          controller.error(ev);
        });
        if (socket.readyState !== WebSocket.OPEN) {
          return new Promise((resolve) => {
            socket.addEventListener("open", resolve, { once: true });
          });
        }
      },
    }),
    writable: new WritableStream<string>({
      start() {
        console.log("Writing to WS started");
        if (socket.readyState !== WebSocket.OPEN) {
          return new Promise((resolve) => {
            socket.addEventListener("open", resolve, { once: true });
          });
        }
      },
      write(chunk) {
        socket.send(chunk);
      },
      close() {
        socket.close();
      },
    }),
  };
}
