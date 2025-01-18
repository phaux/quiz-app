import { useState, useRef, useEffect } from "react";
import type { RoomCommand } from "../api.ts";
import type { RoomState } from "../rooms.ts";

export function useRoom(roomId: string) {
  const [room, setRoom] = useState<RoomState>();
  const wsRef = useRef<WebSocket>(null);
  useEffect(() => {
    const ws = new WebSocket(`/api/?${new URLSearchParams({ roomId })}`);
    wsRef.current = ws;
    ws.addEventListener("message", (ev) => {
      const room = JSON.parse(ev.data) as RoomState | null;
      console.log("Room", roomId, "message", room);
      setRoom(room ?? undefined);
    });
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [roomId]);
  function sendCommand(command: RoomCommand) {
    setTimeout(() => {
      console.log("Room", roomId, "command", command);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(command));
      }
    }, 250);
  }
  return [room, sendCommand] as const;
}
