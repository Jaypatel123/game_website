// const Navbar: React.FC = () => (
//   <nav className="bg-purple-600 text-white text-2xl p-4 text-center">
//     🎮 FunTime Games
//   </nav>
// );

// export default Navbar;

import React from 'react';

const Navbar: React.FC = () => (
  <nav className="bg-purple-600 text-white p-4">
    <div className="flex items-center justify-between">
      <div className="text-xl">
        <a href="/" className="hover:underline">Home</a>
      </div>
      <div className="text-2xl text-center flex-1">
        🎮 FunTime Games
      </div>
      <div className="w-16">{/* Spacer to balance layout */}</div>
    </div>
  </nav>
);

export default Navbar;
