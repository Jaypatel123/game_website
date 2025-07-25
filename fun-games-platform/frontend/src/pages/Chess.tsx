// const Chess: React.FC = () => <div className="p-6 text-center">♟ Chess Game Coming Soon!</div>;
// export default Chess;
import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard, PieceDropHandlerArgs } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { socket } from '../services/socket'; // Assuming socket.ts is in the same directory or a services folder
import { useSearchParams, useNavigate } from 'react-router-dom'; // For room management

interface Move {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n'; // promotion type is optional
}

const ChessGame: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState(game.fen());
  const [gameStatus, setGameStatus] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white'); // 'white' or 'black'
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room'); // Get room ID from URL query params
  const [messages, setMessages] = useState<string[]>([]); // To display game messages/logs
  const [showLobby, setShowLobby] = useState(!roomId);
  const [inputRoomId, setInputRoomId] = useState('');

  // This function ensures game state updates are immutable and handled correctly
  const updateGame = useCallback((modifyFn: (gameInstance: Chess) => void) => {
    setGame((oldGame) => {
      const newGame = new Chess(oldGame.fen()); // Create a new instance from the old FEN
      modifyFn(newGame);
      return newGame;
    });
  }, []);

  // Effect for Socket.IO event listeners
  useEffect(() => {
    if (!roomId) {
      setMessages(prev => [...prev, 'No room ID found. Please create or join a room from the Lobby.']);
      return;
    }

    // Attempt to join the game room on the server
    socket.emit('joinGameRoom', roomId);
    setMessages(prev => [...prev, `Attempting to join Chess room: ${roomId}`]);

    // --- Socket Event Listeners ---

    // Listen for updated game state from the server (opponent's move)
    socket.on('gameStateUpdate', (fen: string) => {
      updateGame((gameInstance) => gameInstance.load(fen));
      setGamePosition(fen); // Update the position for the board
      setMessages(prev => [...prev, `Opponent made a move.`]);
      updateGameStatus(new Chess(fen)); // Update status based on new FEN
    });

    // Listen for when players join the room
    socket.on('playerJoined', (playerCount: number) => {
      setMessages(prev => [...prev, `Player joined! Total players: ${playerCount}`]);
      // Set board orientation based on join order (first player is white, second is black)
      if (playerCount === 1) {
        setBoardOrientation('white');
        setMessages(prev => [...prev, 'You are White. Waiting for opponent...']);
      } else if (playerCount === 2) {
        setBoardOrientation('black');
        setMessages(prev => [...prev, 'You are Black. Game starting!']);
      }
    });

    // Handle room not found errors
    socket.on('roomNotFound', () => {
      setMessages(prev => [...prev, 'Room not found or full. Redirecting to Lobby.']);
      setTimeout(() => navigate('/lobby'), 3000); // Redirect after a short delay
    });

    socket.on('roomError', (error: string) => {
      setMessages(prev => [...prev, `Room Error: ${error}`]);
    });

    socket.on('chatMessage', (msg: string) => { // Example: If you add a chat
      setMessages(prev => [...prev, msg]);
    });

    // Clean up socket listeners when component unmounts
    return () => {
      socket.off('gameStateUpdate');
      socket.off('playerJoined');
      socket.off('roomNotFound');
      socket.off('roomError');
      socket.off('chatMessage');
      if (roomId) {
        socket.emit('leaveGameRoom', roomId); // Notify server about leaving
      }
    };
  }, [roomId, navigate, updateGame]); // Dependencies for useEffect

  // Effect to update game status whenever the game state changes
  useEffect(() => {
    updateGameStatus(game);
    setCurrentPlayer(game.turn() === 'w' ? 'white' : 'black');
  }, [game]); // Depend on the 'game' object

  const updateGameStatus = (currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      setGameStatus(`Checkmate! ${currentGame.turn() === 'w' ? 'Black' : 'White'} wins!`);
    } else if (currentGame.isDraw()) {
      setGameStatus('Draw!');
    } else if (currentGame.isCheck()) {
      setGameStatus(`${currentGame.turn() === 'w' ? 'White' : 'Black'} is in check`);
    } else {
      setGameStatus(`${currentGame.turn() === 'w' ? 'White' : 'Black'} to move`);
    }
  };

  const onDrop = ({ sourceSquare, targetSquare, piece }: PieceDropHandlerArgs) => {
    if (game.isGameOver()) return false; // Prevent moves if game is over

    // Ensure it's the player's turn to move their color
    const turnColor = game.turn() === 'w' ? 'white' : 'black';
    if (turnColor !== boardOrientation) {
      setMessages(prev => [...prev, "It's not your turn!"]);
      return false;
    }

    let move: Move | null = null;
    const gameCopy = new Chess(game.fen()); // Work with a copy for local validation

    try {
      let move = gameCopy.move({
        from: sourceSquare as Square,
        to: targetSquare as Square,
        promotion: 'q' // Always promote to queen for simplicity
      })
      
      // let move: Move;

      if (move) {
        // Local state update immediately for smooth UI, but the server will be the source of truth.
        // If the server rejects the move, the 'gameStateUpdate' from server will correct it.
        setGame(gameCopy);
        setGamePosition(gameCopy.fen());
        setCurrentPlayer(gameCopy.turn() === 'w' ? 'white' : 'black');
        updateGameStatus(gameCopy);

        // --- Send move to server ---
        if (roomId) {
          socket.emit('makeMove', { room: roomId, fen: gameCopy.fen(), move: move });
          setMessages(prev => [...prev, `You moved: ${move.san || move.from + move.to}`]);
          return true;
        } else {
          setMessages(prev => [...prev, 'No active room to send move.']);
          return false;
        }
      }
    } 
    catch (error) {
      const err = error as Error;
      setMessages(prev => [...prev, `Invalid move: ${err.message || 'Unknown error'}`]);
      return false;
    }
    return false;
  };

  const resetGame = () => {
    // For online multiplayer, resetting the game should ideally be a server-side action.
    // For now, if no room, reset locally. If in a room, you'd emit 'resetGame' to the server.
    if (roomId) {
      setMessages(prev => [...prev, 'Resetting game is a server action in multiplayer.']);
      // socket.emit('resetGame', roomId); // You would implement this on the server
    } else {
      const newGame = new Chess();
      setGame(newGame);
      setGamePosition(newGame.fen());
      setCurrentPlayer('white');
      setGameStatus('White to move');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Multiplayer Chess {roomId && `(Room: ${roomId})`}
        </h1>
        <p className="text-gray-600">Click and drag pieces to make your move</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <Chessboard
              options={{
                position: gamePosition,
                onPieceDrop: onDrop,
                boardOrientation: boardOrientation, // Set orientation based on player
                allowDragging: !game.isGameOver()
              }}
              // arePiecesDraggable= {
              //     !game.isGameOver() && // Not draggable if game is over
              //     game.turn() === (boardOrientation === 'white' ? 'w' : 'b') // Only draggable on your turn
              // }
            />
          </div>
        </div>

        <div className="lg:w-80">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Game Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Your Color:</span>
                <span className={`font-semibold ${boardOrientation === 'white' ? 'text-gray-800' : 'text-gray-600'}`}>
                  {boardOrientation === 'white' ? 'White' : 'Black'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Current Turn:</span>
                <span className={`font-semibold ${currentPlayer === 'white' ? 'text-gray-800' : 'text-gray-600'}`}>
                  {game.turn() === 'w' ? 'White' : 'Black'}
                </span>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 mb-2">Status:</p>
                <p className="font-medium">{gameStatus}</p>
              </div>
              <button
                onClick={resetGame}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                New Game
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-xl font-semibold mb-4">Game Log / Messages</h3>
            <div className="bg-gray-100 h-48 overflow-y-auto p-2 rounded">
              {messages.map((msg, index) => (
                <p key={index} className="text-xs text-gray-700 mb-1">{msg}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showLobby && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-center">Join or Create a Chess Room</h2>
            <input
              type="text"
              placeholder="Enter room name..."
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />
            <button
              onClick={() => {
                if (inputRoomId.trim()) {
                  navigate(`/chess?room=${inputRoomId.trim()}`);
                  setShowLobby(false);
                }
              }}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Enter Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessGame;