import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createClient } from 'redis';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// --------------------
// ✅ Redis setup
// --------------------
const redisClient = createClient();
redisClient.connect().catch(console.error);

// Room tracking
const rooms = new Map(); // roomId => [socketId1, socketId2]

io.on('connection', (socket) => {
  console.log(`🟢 New socket connected: ${socket.id}`);

  // 🎯 Join room
  socket.on('joinGameRoom', async (roomId) => {
    const players = rooms.get(roomId) || [];

    if (players.length >= 2) {
      socket.emit('roomNotFound');
      return;
    }

    socket.join(roomId);
    const color = players.length === 1 ? 'white' : 'black';

    socket.emit('playerInfo', {
      playerId: socket.id,
      color,
    });

    rooms.set(roomId, [...players, socket.id]);
    io.to(roomId).emit('playerJoined', rooms.get(roomId).length);

    console.log(`📥 ${socket.id} joined room ${roomId}`);

    // ✅ Send latest FEN if available
    const savedFen = await redisClient.get(`fen:${roomId}`);
    if (savedFen) {
      socket.emit('gameStateUpdate', savedFen);
      console.log(`♻️ Restored FEN for room ${roomId}:`, savedFen);
    }
  });

  // 🎯 Move made
  socket.on('makeMove', async ({ room, fen }) => {
    // ✅ Store FEN in Redis
    await redisClient.set(`fen:${room}`, fen);
    socket.to(room).emit('gameStateUpdate', fen);
    console.log(`📤 Move stored for room ${room}:`, fen);
  });

  // 🎯 Leave room
  socket.on('leaveGameRoom', (roomId) => {
    const players = rooms.get(roomId) || [];
    const updatedPlayers = players.filter((id) => id !== socket.id);

    if (updatedPlayers.length === 0) {
      rooms.delete(roomId);
    } else {
      rooms.set(roomId, updatedPlayers);
    }

    socket.leave(roomId);
    console.log(`🚪 ${socket.id} left room ${roomId}`);
  });

  // 🎯 Disconnect
  socket.on('disconnect', () => {
    for (const [roomId, players] of rooms.entries()) {
      if (players.includes(socket.id)) {
        const updatedPlayers = players.filter((id) => id !== socket.id);
        if (updatedPlayers.length === 0) {
          rooms.delete(roomId);
        } else {
          rooms.set(roomId, updatedPlayers);
          io.to(roomId).emit('playerJoined', updatedPlayers.length);
        }
        break;
      }
    }
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

// Basic route
app.get('/', (req, res) => {
  res.send('♟ Chess server running with Redis...');
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
