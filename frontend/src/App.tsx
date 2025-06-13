// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { socket } from './socket';

import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { WakeUpBackend } from './components/WakeUpBackend';

function App() {
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        // We only want to connect once when the app loads.
        // We do this here instead of in each component.
        if (!socket.connected) {
            socket.connect();
        }

        function onConnect() {
            setIsConnected(true);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        // Cleanup function
        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);


    return (
        <div className="bg-white text-gray-900 font-sans min-h-screen flex items-center justify-center">
            <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* --- THIS IS THE NEW LOGIC --- */}
                {isConnected ? (
                    // If we are connected, show the normal game routes
                    <Routes>
                        <Route path="/" element={<Lobby />} />
                        <Route path="/lobby/:lobbyId" element={<Game />} />
                    </Routes>
                ) : (
                    // If we are not connected, show the wake-up screen
                    <WakeUpBackend />
                )}
            </div>
        </div>
    );
}

export default App;