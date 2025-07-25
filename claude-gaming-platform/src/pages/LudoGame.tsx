import React from 'react';

const LudoGame: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Ludo Game</h1>
        <p className="text-gray-600">Coming soon! Classic board game for 2-4 players</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="text-8xl mb-6">🎲</div>
          <h3 className="text-2xl font-semibold mb-4">Under Development</h3>
          <p className="text-gray-600 mb-6">
            We're working hard to bring you an amazing Ludo experience with real-time multiplayer support.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="font-semibold mb-3">Planned Features:</h4>
            <ul className="text-left space-y-2 text-gray-600">
              <li>• 2-4 player support</li>
              <li>• Real-time dice rolling</li>
              <li>• Interactive board with animations</li>
              <li>• Room creation and joining</li>
              <li>• Chat system for players</li>
              <li>• Game statistics tracking</li>
            </ul>
          </div>
          
          <button
            disabled
            className="bg-gray-300 text-gray-500 py-2 px-6 rounded cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
};

export default LudoGame;
