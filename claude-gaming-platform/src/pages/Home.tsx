import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'chess',
      title: 'Chess',
      description: 'Classic strategy game for two players',
      image: '♟️',
      route: '/chess',
      status: 'Available'
    },
    {
      id: 'ludo',
      title: 'Ludo',
      description: 'Fun board game for 2-4 players',
      image: '🎲',
      route: '/ludo',
      status: 'Coming Soon'
    },
    {
      id: 'angry-bird',
      title: 'Angry Birds',
      description: 'Physics-based puzzle game',
      image: '🐦',
      route: '/angry-bird',
      status: 'Coming Soon'
    }
  ];

  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to GameHub
        </h1>
        <p className="text-xl text-gray-600">
          Choose your game and start playing!
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {games.map(game => (
          <div 
            key={game.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">{game.image}</div>
              <h3 className="text-xl font-semibold mb-2">{game.title}</h3>
              <p className="text-gray-600 mb-4">{game.description}</p>
              <div className="mb-4">
                <span className={`px-2 py-1 rounded text-sm ${
                  game.status === 'Available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {game.status}
                </span>
              </div>
              <button
                onClick={() => navigate(game.route)}
                disabled={game.status !== 'Available'}
                className={`w-full py-2 px-4 rounded font-semibold ${
                  game.status === 'Available'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {game.status === 'Available' ? 'Play Now' : 'Coming Soon'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
