// frontend/src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';

function App() {
  return (
    // Sets the white background, black text, and system font for the whole app
    <div className="bg-white text-gray-900 font-sans min-h-screen flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/lobby/:lobbyId" element={<Game />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;