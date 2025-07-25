import React, { useState, useEffect } from 'react';
import { Chessboard, PieceDropHandlerArgs } from 'react-chessboard';
import { Chess, Square } from 'chess.js';

const ChessGame: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState(game.fen());
  const [gameStatus, setGameStatus] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');

  useEffect(() => {
    updateGameStatus();
  }, [game]);

  const updateGameStatus = () => {
    if (game.isCheckmate()) {
      setGameStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
    } else if (game.isDraw()) {
      setGameStatus('Draw!');
    } else if (game.isCheck()) {
      setGameStatus(`${game.turn() === 'w' ? 'White' : 'Black'} is in check`);
    } else {
      setGameStatus(`${game.turn() === 'w' ? 'White' : 'Black'} to move`);
    }
  };

  const onDrop = ({ sourceSquare, targetSquare, piece }: PieceDropHandlerArgs) => {
  const gameCopy = new Chess(game.fen());
  
  try {
    const move = gameCopy.move({
      from: sourceSquare as Square,
      to: targetSquare as Square,
      promotion: 'q' // Always promote to queen for simplicity
    });

    if (move) {
      setGame(gameCopy);
      setGamePosition(gameCopy.fen());
      setCurrentPlayer(gameCopy.turn() === 'w' ? 'white' : 'black');
      return true;
    }
  } catch (error) {
    return false;
  }
  
  return false;
};

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setGamePosition(newGame.fen());
    setCurrentPlayer('white');
    setGameStatus('White to move');
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Chess Game</h1>
        <p className="text-gray-600">Click and drag pieces to make your move</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-4" style={{ width: '400px', height: '400px' }}>
            <Chessboard 
              // boardWidth={400}
              options={{
                position: gamePosition,
                onPieceDrop: onDrop,
                allowDragging: !game.isGameOver(),
              }}
            />
          </div>
        </div>

        <div className="lg:w-80">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Game Status</h3>
            <div className="space-y-3">
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
            <h3 className="text-xl font-semibold mb-4">Features Coming Soon</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Online multiplayer</li>
              <li>• Room creation</li>
              <li>• Game history</li>
              <li>• Timer controls</li>
              <li>• Spectator mode</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessGame;
