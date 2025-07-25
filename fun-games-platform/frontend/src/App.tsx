import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Chess from './pages/Chess';
import Ludo from './pages/Ludo';
import AngryBirds from './pages/AngryBirds';
import Lobby from './pages/Lobby';

const App = () => (
  <Router>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/chess" element={<Chess />} />
      <Route path="/ludo" element={<Ludo />} />
      <Route path="/angrybirds" element={<AngryBirds />} />
    </Routes>
  </Router>
);

export default App;
