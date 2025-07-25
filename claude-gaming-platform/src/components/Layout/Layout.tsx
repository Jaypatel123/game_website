import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            GameHub
          </Link>
          <div className="space-x-4">
            <Link 
              to="/chess" 
              className={`px-3 py-2 rounded ${location.pathname === '/chess' ? 'bg-blue-800' : 'hover:bg-blue-500'}`}
            >
              Chess
            </Link>
            <Link 
              to="/ludo" 
              className={`px-3 py-2 rounded ${location.pathname === '/ludo' ? 'bg-blue-800' : 'hover:bg-blue-500'}`}
            >
              Ludo
            </Link>
            <Link 
              to="/angry-bird" 
              className={`px-3 py-2 rounded ${location.pathname === '/angry-bird' ? 'bg-blue-800' : 'hover:bg-blue-500'}`}
            >
              Angry Birds
            </Link>
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;