export interface GameRoom {
  id: string;
  players: Player[];
  gameType: 'chess' | 'ludo' | 'angry-bird';
  status: 'waiting' | 'active' | 'finished';
  createdAt: Date;
}

export interface Player {
  id: string;
  name: string;
  color?: 'white' | 'black' | 'red' | 'blue' | 'green' | 'yellow';
  isReady: boolean;
}

export interface GameMove {
  playerId: string;
  moveData: any;
  timestamp: Date;
}