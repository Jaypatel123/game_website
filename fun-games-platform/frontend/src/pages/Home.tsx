import GameCard from '../components/GameCard';

const Home: React.FC = () => {
  const games = [
    { title: 'Chess', path: '/chess', image: 'static/chess.jpg' },
    { title: 'Ludo', path: '/ludo', image: 'static/ludo.webp' },
    { title: 'Angry Birds', path: '/angrybirds', image: 'static/angry.png' },
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
