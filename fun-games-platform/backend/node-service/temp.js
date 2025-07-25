import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["*", "http://localhost:3000"], // allow frontend dev server (localhost:3000)
    methods: ['GET', 'POST']
  }
});

// Room data
const rooms = new Map(); // roomId => [socketId1, socketId2]

io.on('connection', (socket) => {
  console.log(`🟢 New socket connected: ${socket.id}`);

  // Handle join room
  socket.on('joinGameRoom', (roomId) => {
    const players = rooms.get(roomId) || [];

    if (players.length >= 2) {
      socket.emit('roomNotFound');
      return;
    }

    socket.join(roomId);
    rooms.set(roomId, [...players, socket.id]);
    io.to(roomId).emit('playerJoined', rooms.get(roomId).length);

    console.log(`📥 ${socket.id} joined room ${roomId}`);
  });

  // Handle move made
  socket.on('makeMove', ({ room, fen, move }) => {
    socket.to(room).emit('gameStateUpdate', fen);
  });

  // Handle leave room
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

  // On disconnect
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
  res.send('Chess server running...');
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
