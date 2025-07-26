import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

interface RoomData {
  players: string[]; // socket IDs
}

const rooms: Record<string, RoomData> = {};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('joinGameRoom', (roomId: string) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [] };
    }

    const room = rooms[roomId];

    if (room.players.length >= 2) {
      socket.emit('roomNotFound'); // room full
      return;
    }

    room.players.push(socket.id);
    socket.join(roomId);

    const color = room.players.length === 1 ? 'white' : 'black';

    socket.emit('playerInfo', {
      playerId: socket.id,
      color,
    });

    io.to(roomId).emit('playerJoined', room.players.length);
  });

  socket.on('makeMove', ({ room, fen }) => {
    socket.to(room).emit('gameStateUpdate', fen);
  });

  socket.on('leaveGameRoom', (roomId: string) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId].players = rooms[roomId].players.filter(id => id !== socket.id);
      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId]; // cleanup
      }
    }
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(id => id !== socket.id);
      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId];
      }
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

server.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
