import { useNavigate } from 'react-router-dom';

interface GameCardProps {
  title: string;
  path: string;
  image: string;
}

const GameCard: React.FC<GameCardProps> = ({ title, path, image }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(path)}
      className="cursor-pointer border rounded-xl p-4 hover:shadow-lg transition"
    >
      <img src={image} alt={title} className="w-full h-40 object-cover rounded-md" />
      <h2 className="text-center text-lg font-semibold mt-2">{title}</h2>
    </div>
  );
};

export default GameCard;
