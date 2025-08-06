import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { socket } from '../services/socket'; // Assuming socket.ts is in the same directory or a services folder
import { useSearchParams, useNavigate } from 'react-router-dom'; // For room management
import { initEngine, setPosition, getBestMove } from '../engine/stockFishEngine';



const ChessGame: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState(game.fen());
  const [gameStatus, setGameStatus] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white'); // 'white' or 'black'
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room'); // Get room ID from URL query params
  const [messages, setMessages] = useState<string[]>([]); // To display game messages/logs
  const [showLobby, setShowLobby] = useState(!roomId);
  const [inputRoomId, setInputRoomId] = useState('');
  const isPlayerTurn = playerColor && game.turn() === (playerColor === 'white' ? 'w' : 'b');
  const [highlightedSquares, setHighlightedSquares] = useState<Square[]>([]);
  const [checkSquare, setCheckSquare] = useState<string | null>(null);
  const isVsComputer = searchParams.get('vs') === 'computer';


  // This function ensures game state updates are immutable and handled correctly
  const updateGame = useCallback((modifyFn: (gameInstance: Chess) => void) => {
    setGame((oldGame) => {
      const newGame = new Chess(oldGame.fen()); // Create a new instance from the old FEN
      modifyFn(newGame);
      return newGame;
    });
  }, []);
  const updateGameStatus = (currentGame: Chess) => {
    if (currentGame.inCheck()) {
      const square = getCheckedKingSquare(currentGame);
      setCheckSquare(square); // trigger board highlight
      setGameStatus('King is in check!');
    } else {
      setCheckSquare(null);
    }

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
  useEffect(() => {
    if (isVsComputer) {
      initEngine();
    }
  }, [isVsComputer]);
  // Effect for Socket.IO event listeners
  useEffect(() => {
    if (!roomId) {
      setMessages(prev => [...prev, 'No room ID found. Please create or join a room from the Lobby.']);
      return;
    }
    
    socket.on('playerInfo', ({ playerId, color }: { playerId: string; color: 'white' | 'black' }) => {
      setPlayerId(playerId);
      setPlayerColor(color);
      setBoardOrientation(color);
      setMessages(prev => [...prev, `You are connected as ${playerId}, playing as ${color}.`]);

      localStorage.setItem('chess-playerId', playerId);
      localStorage.setItem('chess-playerColor', color);
    });
    // Attempt to join the game room on the server
    socket.emit('joinGameRoom', roomId);
    setMessages(prev => [...prev, `Attempting to join Chess room: ${roomId}`]);

    // --- Socket Event Listeners ---

    // Listen for when players join the room
    socket.on('playerJoined', (playerCount: number) => {
      setMessages(prev => [...prev, `Player joined! Total players: ${playerCount}`]);
      // Set board orientation based on join order (first player is white, second is black)
    });

    // Listen for updated game state from the server (opponent's move)
    socket.on('gameStateUpdate', (fen: string) => {
      updateGame((gameInstance) => gameInstance.load(fen));
      setGamePosition(fen); // Update the position for the board
      setMessages(prev => [...prev, `Opponent made a move.`]);
      updateGameStatus(new Chess(fen)); // Update status based on new FEN
    });

    // Handle room not found errors
    socket.on('roomNotFound', () => {
      localStorage.removeItem('chess-playerId');
      localStorage.removeItem('chess-playerColor');
      setMessages(prev => [...prev, 'Room not found or full. Redirecting to Lobby.']);
      setTimeout(() => navigate('/chess'), 3000); // Redirect after a short delay
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
  
  const getCheckedKingSquare = (game: Chess): string | null => {
    if (!game.inCheck()) return null;

    const kingMoves = game.moves({ verbose: true }).filter(move => move.piece === 'k');

    // The king is in check and has legal moves — pick its from-square
    if (kingMoves.length > 0) {
      return kingMoves[0].from; // this is the king's square
    }

    // Fallback: No king moves? Game might be in checkmate. Try this trick:
    const allMoves = game.moves({ verbose: true });
    const kingFrom = allMoves.find(m => m.piece === 'k')?.from;
    return kingFrom || null;
  };
  const onDrop = ({ sourceSquare, targetSquare, piece }: PieceDropHandlerArgs) => {
    if (game.isGameOver()) return false;

    const turnColor = game.turn() === 'w' ? 'white' : 'black';
    if (turnColor !== boardOrientation) {
      setMessages(prev => [...prev, "It's not your turn!"]);
      return false;
    }

    const gameCopy = new Chess(game.fen());
    
    const move = gameCopy.move({
      from: sourceSquare as Square,
      to: targetSquare as Square,
      promotion: 'q',
    });
    if (isVsComputer) {
      const playerTurn = gameCopy.turn();
      setPosition(gameCopy.fen());

      getBestMove(10, (move) => {
        const from = move.substring(0, 2);
        const to = move.substring(2, 4);
        const computerGame = new Chess(gameCopy.fen());
        const moveResult = computerGame.move({ from, to, promotion: 'q' });

        if (moveResult) {
          setGame(computerGame);
          setGamePosition(computerGame.fen());
          updateGameStatus(computerGame);
          setMessages(prev => [...prev, `Computer moved: ${move}`]);
        }
      });
    }
    if (!move) return false;

    setGame(gameCopy);
    setGamePosition(gameCopy.fen());
    updateGameStatus(gameCopy);
    setCurrentPlayer(gameCopy.turn() === 'w' ? 'white' : 'black');

    if (roomId) {
      socket.emit('makeMove', { room: roomId, fen: gameCopy.fen(), move });
      setMessages(prev => [...prev, `You moved: ${move.san}`]);
    } else {
      setMessages(prev => [...prev, `You moved: ${move.san}`]);
      // 🎯 Make computer move (randomly)
      setTimeout(() => {
        const compGame = new Chess(gameCopy.fen());
        const moves = compGame.moves();
        if (moves.length > 0) {
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          compGame.move(randomMove);
          setGame(compGame);
          setGamePosition(compGame.fen());
          updateGameStatus(compGame);
          setMessages(prev => [...prev, `Computer moved: ${randomMove}`]);
        }
      }, 500);
    }

    return true;
  };


  const handleSquareClick = ({ square }: SquareHandlerArgs) => {
    if (!playerColor || game.isGameOver()) return;
  
    const piece = game.get(square as Square);
    const isMyTurn = game.turn() === (playerColor === 'white' ? 'w' : 'b');
  
    // If a piece is selected and the clicked square is in highlighted destinations
    if (selectedSquare && highlightedSquares.includes(square as Square)) {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: selectedSquare,
        to: square as Square,
        promotion: 'q',
      });
  
      if (move) {
        setGame(gameCopy);
        setGamePosition(gameCopy.fen());
        updateGameStatus(gameCopy);
        setHighlightedSquares([]);
        setSelectedSquare(null);
  
        if (roomId) {
          socket.emit('makeMove', {
            room: roomId,
            fen: gameCopy.fen(),
            move,
          });
        }
      }
      return;
    }
  
    // If clicking your own piece on your turn
    if (piece && piece.color === (playerColor === 'white' ? 'w' : 'b') && isMyTurn) {
      const moves = game.moves({ square: square as Square, verbose: true });
      const destinations = moves.map((m) => m.to as Square);
      setSelectedSquare(square as Square);
      setHighlightedSquares(destinations);
    } else {
      // Invalid click - clear state
      setSelectedSquare(null);
      setHighlightedSquares([]);
    }
  }

  const getCustomSquareStyles = () => {
    const styles: { [square: string]: React.CSSProperties } = {};
    highlightedSquares.forEach((sq) => {
      styles[sq] = {
        background: 'radial-gradient(circle, rgba(2, 60, 143, 0.9) 8%, transparent 0%)',
        borderRadius: '100%'
      };
    });
    if (checkSquare) {
      styles[checkSquare] = {
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
        boxShadow: '0 0 10px red inset'
      };
    }
    return styles;
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
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Multiplayer Chess <pre>{roomId && `room:${roomId}`}</pre>
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1">
          <div className={`bg-white rounded-lg shadow-md p-4 transition-shadow duration-300 ${
            isPlayerTurn ? 'ring-4 ring-green-400' : ''
            }`}
          >
            <Chessboard
              options={{
                position: gamePosition,
                onPieceDrop: onDrop,
                boardOrientation: boardOrientation, // Set orientation based on player
                onSquareClick: handleSquareClick,
                squareStyles: getCustomSquareStyles(),
                allowDragging: false
              }}
              // allowDragging: !game.isGameOver(),
            />
            {isPlayerTurn && (
              <div className="text-center text-green-600 font-semibold mt-4">
                Your Turn!
              </div>
            )}
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
          {playerId && playerColor && (
            <div className="text-sm text-center text-gray-500 mt-2">
              Player ID: <span className="font-mono">{playerId}</span> | Color: <span className="capitalize">{playerColor}</span>
            </div>
          )}

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
            <h2 className="text-xl font-bold mb-4 text-center">Choose Game Mode</h2>

            {/* Play with Computer */}
            <button
              onClick={() => {
                const randomId = `cpu-${Math.floor(1000 + Math.random() * 9000)}`;
                setPlayerColor('white'); // Player always white against computer
                navigate(`/chess?room=${randomId}&vs=computer`);
                setBoardOrientation('white');
                setShowLobby(false);
                setMessages(prev => [...prev, 'Playing against computer (local mode).']);
              }}
              className="w-full bg-green-600 text-white py-2 mt-2 rounded hover:bg-green-700 transition"
            >
              Play vs Computer
            </button>

            {/* OR Join/Create Room */}
            <input
              type="text"
              placeholder="Enter room name or leave blank to auto-generate..."
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-3"
            />
            <button
              onClick={() => {
                const roomToJoin = inputRoomId.trim() || Math.floor(1000 + Math.random() * 9000).toString();
                navigate(`/chess?room=${roomToJoin}`);
                setShowLobby(false);
              }}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Join/Create Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessGame;