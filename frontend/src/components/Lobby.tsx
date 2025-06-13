// frontend/src/components/Lobby.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { TutorialPopup } from './TutorialPopup';

export const Lobby = () => {
    const [username, setUsername] = useState('');
    const [lobbyIdToJoin, setLobbyIdToJoin] = useState('');
    const [showTutorial, setShowTutorial] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const onLobbyCreated = ({ lobbyId }: { lobbyId: string }) => {
            navigate(`/lobby/${lobbyId}`);
        };
        socket.on('lobbyCreated', onLobbyCreated);
        return () => {
            socket.off('lobbyCreated', onLobbyCreated);
        };
    }, [navigate]);

    const handleCreateLobby = () => {
        if (username.trim()) {
            sessionStorage.setItem('username', username);
            socket.emit('createLobby', { username });
        } else {
            alert('Please enter a username.');
        }
    };

    const handleJoinLobby = () => {
        if (username.trim() && lobbyIdToJoin.trim()) {
            sessionStorage.setItem('username', username);
            navigate(`/lobby/${lobbyIdToJoin.toUpperCase()}`);
        } else {
            alert('Please enter a username and Lobby ID.');
        }
    };

    return (
        <> {/* Use a Fragment to render the popup alongside the lobby */}
            {showTutorial && <TutorialPopup onClose={() => setShowTutorial(false)} />}
        
            <div className="max-w-md mx-auto text-center">
                <h1 className="text-5xl font-bold text-indigo-700">Recipe for Chaos</h1>
                <p className="mt-2 text-lg text-gray-600">The chaotic economic racing game.</p>
                
                {/* --- ADD THIS BUTTON HERE --- */}
                <div className="mt-6">
                    <button 
                        onClick={() => setShowTutorial(true)}
                        className="text-indigo-600 font-semibold hover:text-indigo-800 transition"
                    >
                        How to Play
                    </button>
                </div>
                {/* --- END OF NEW BUTTON --- */}
                
                <div className="mt-4 space-y-4"> {/* Changed from mt-8 to mt-4 */}
                    <input
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        onKeyUp={(e) => e.key === 'Enter' && (lobbyIdToJoin ? handleJoinLobby() : handleCreateLobby())}
                    />
                    
                    <div className="bg-indigo-50 p-6 rounded-lg space-y-4">
                        <button 
                            onClick={handleCreateLobby}
                            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:opacity-50"
                            disabled={!username.trim()}
                        >
                            Create New Game
                        </button>
                        
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-indigo-50 text-gray-500">OR</span></div>
                        </div>
                        
                        <input
                            type="text"
                            placeholder="Enter Lobby ID to Join"
                            value={lobbyIdToJoin}
                            onChange={(e) => setLobbyIdToJoin(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            onKeyUp={(e) => e.key === 'Enter' && handleJoinLobby()}
                        />
                        <button 
                            onClick={handleJoinLobby}
                            className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-300 disabled:opacity-50"
                            disabled={!username.trim() || !lobbyIdToJoin.trim()}
                        >
                            Join Game
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

