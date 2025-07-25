import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import ChessGame from './pages/ChessGame';
import LudoGame from './pages/LudoGame';
import AngryBirdGame from './pages/AngryBirdGame';
// import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chess" element={<ChessGame />} />
          <Route path="/ludo" element={<LudoGame />} />
          <Route path="/angry-bird" element={<AngryBirdGame />} />
        </Routes>
      </Layout>
    </Router>
  );
}
export default App;