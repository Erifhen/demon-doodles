import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import DoodleCodex from './components/DoodleCodex';
import DuelDemo from './components/DuelDemo';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/demo-game" element={<div>Game Scene</div>} />
        <Route path="/duel-demo" element={<DuelDemo/>} />
        <Route path="/doodle-codex" element={<DoodleCodex/>} />
        <Route path="/about-settings" element={<div>Settings Scene</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;