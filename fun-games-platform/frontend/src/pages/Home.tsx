import GameCard from '../components/GameCard';

const Home: React.FC = () => {
  const games = [
    { title: 'Chess', path: '/chess', image: '/chess.png' },
    { title: 'Ludo', path: '/ludo', image: '/ludo.png' },
    { title: 'Angry Birds', path: '/angrybirds', image: '/angry.png' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {games.map((game) => (
        <GameCard key={game.title} {...game} />
      ))}
    </div>
  );
};

export default Home;
