
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const Lobby: React.FC = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const createRoom = () => {
    const newRoomId = uuidv4().slice(0, 6); // Shorter room code
    navigate(`/chess?room=${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      navigate(`/chess?room=${roomId.trim()}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 gap-4">
      <h1 className="text-3xl font-bold">♟ Welcome to Chess Lobby</h1>

      <button onClick={createRoom} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
        Create Game Room
      </button>

      <div className="flex items-center gap-2">
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID"
          className="border px-3 py-2 rounded"
        />
        <button onClick={joinRoom} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Join Room
        </button>
      </div>
    </div>
  );
};

export default Lobby;
