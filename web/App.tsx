import { Route, Routes } from "react-router";
import { HomePage } from "./HomePage.tsx";
import { RoomPage } from "./RoomPage.tsx";

export function App() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="rooms/:roomId" element={<RoomPage />} />
    </Routes>
  );
}
