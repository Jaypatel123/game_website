import io from 'socket.io-client';

class SocketService {
  private socket: any;
  
  connect(serverUrl: string = 'http://localhost:3001') {
    this.socket = io(serverUrl);
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  joinRoom(roomId: string, playerName: string) {
    this.socket.emit('join-room', { roomId, playerName });
  }

  makeMove(roomId: string, moveData: any) {
    this.socket.emit('make-move', { roomId, moveData });
  }

  onGameUpdate(callback: (data: any) => void) {
    this.socket.on('game-update', callback);
  }

  onPlayerJoined(callback: (data: any) => void) {
    this.socket.on('player-joined', callback);
  }

  onPlayerLeft(callback: (data: any) => void) {
    this.socket.on('player-left', callback);
  }
}

export default new SocketService();