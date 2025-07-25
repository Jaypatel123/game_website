import io from 'socket.io-client';

// Define the Socket.IO server URL.
// It tries to get it from environment variables (e.g., .env file in Vite/Create React App)
// If not found, it defaults to 'http://localhost:3001', which is the default port for the Node.js server.
// const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';
const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:4000';

// Initialize the Socket.IO client instance
export const socket = io(SOCKET_SERVER_URL);

// --- Socket.IO Event Listeners for Connection Status ---

// Event listener for successful connection
socket.on('connect', () => {
  console.log('Connected to Socket.IO server!');
});

// Event listener for disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from Socket.IO server!');
});

// Event listener for connection errors
socket.on('connect_error', (err: { message: any; }) => {
  console.error('Socket.IO connection error:', err.message);
});

// You can add more global socket listeners here if needed,
// but game-specific listeners should be in the respective game components.