// frontend/src/components/Game.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import type { GameState } from '../types';

import { EventNotification } from './EventNotification';
import { PlayerInfo } from './PlayerInfo';
import { Market } from './Market';
import { Crafting } from './Crafting';
import { Trade } from './Trade';
import { TradeModal } from './TradeModal';

export const Game = () => {
    const { lobbyId } = useParams<{ lobbyId: string }>();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [notification, setNotification] = useState<{ title: string; description: string } | null>(null);
    const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
    const [gameOver, setGameOver] = useState<{ winnerName: string; winningGadget: string } | null>(null);

    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }
        const username = sessionStorage.getItem('username');
        if (!username || !lobbyId) {
            navigate('/');
            return;
        }
        socket.emit('joinLobby', { lobbyId: lobbyId.toUpperCase(), username });

        const onGameStateUpdate = (newState: GameState) => {
            console.log("%c--- DEBUG: GameState received from server ---", "color: lightblue; font-size: 14px;");
            console.log(newState);
            setGameState(newState);
        };
        const onNewTurn = (turnData: { event: { title: string, description: string } }) => setNotification(turnData.event);
        const onGameOver = (data: { winnerName: string; winningGadget: string }) => setGameOver(data);
        const onGameError = ({ message }: { message: string }) => { alert(`Error: ${message}`); navigate('/'); };
        const onActionFeedback = (data: { success: boolean; message: string }) => {
            setFeedback(data);
            setTimeout(() => setFeedback(null), 3000);
        };

        socket.on('gameStateUpdate', onGameStateUpdate);
        socket.on('newTurn', onNewTurn);
        socket.on('gameOver', onGameOver);
        socket.on('gameError', onGameError);
        socket.on('actionFeedback', onActionFeedback);

        return () => {
            socket.off('gameStateUpdate', onGameStateUpdate);
            socket.off('newTurn', onNewTurn);
            socket.off('gameOver', onGameOver);
            socket.off('gameError', onGameError);
            socket.off('actionFeedback', onActionFeedback);
        };
    }, [lobbyId, navigate]);

    const handlePlayerAction = (type: string, payload: any) => {
        socket.emit('playerAction', { lobbyId, action: { type, payload } });
    };

    const handleResolveTrade = (tradeId: string, accepted: boolean) => {
        handlePlayerAction('resolveTrade', { tradeId, accepted });
    };

    const handleStartGame = () => {
        socket.emit('startGame', { lobbyId });
    };

    if (gameOver) {
        return (
            <div className="game-container" style={{color: 'var(--light-green)'}}>
                <h1>GAME OVER</h1>
                <h2>{gameOver.winnerName} wins by building the {gameOver.winningGadget}!</h2>
                <button onClick={() => {
                    sessionStorage.removeItem('username');
                    if (socket.connected) socket.disconnect();
                    navigate('/');
                }}>Return to Main Menu</button>
            </div>
        );
    }

    if (!gameState) {
        return <div>Joining lobby...</div>;
    }

    const me = socket.id ? gameState.players[socket.id] : undefined;
    if (!me) {
        return <div>Syncing with server...</div>;
    }

    const myId = me.id;
    const pendingTrades = gameState.pendingTrades || {};
    const myIncomingTrade = Object.values(pendingTrades).find(trade => trade.toId === myId);
    const myOutgoingTrade = Object.values(pendingTrades).find(trade => trade.fromId === myId);

    const myGadgetRecipe = me.gadget ? gameState.gadgetRecipes[me.gadget] : null;
    const isMeReady = gameState.readyPlayers.includes(myId);
    const isTurnCalculating = gameState.gamePhase === 'CALCULATING_TURN';

    return (
        <div className="w-full space-y-6">
            {myIncomingTrade && <TradeModal offer={myIncomingTrade} onResolve={handleResolveTrade} />}
            {feedback && <div className={`fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-bold z-50 ${feedback.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{feedback.message}</div>}

            <header className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-indigo-800">Lobby: {lobbyId?.toUpperCase()}</h1>
                    <p className="text-gray-500">
                        <span className="font-bold">Turn {gameState.turnNumber}</span> - 
                        <span className="ml-2 font-semibold capitalize">
                            {isTurnCalculating ? 'Calculating...' : gameState.gamePhase.replace('_', ' ')}
                        </span>
                    </p>
                </div>
                {gameState.gamePhase === 'IN_PROGRESS' && (
                    <button
                        onClick={() => handlePlayerAction('endTurn', {})}
                        disabled={isMeReady || isTurnCalculating}
                        className="px-6 py-3 font-bold text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isMeReady ? 'Waiting...' : 'End Turn'}
                    </button>
                )}
            </header>

            {notification && <EventNotification title={notification.title} description={notification.description} />}

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {gameState.gamePhase === 'IN_PROGRESS' || isTurnCalculating ? (
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${isTurnCalculating ? 'opacity-50 pointer-events-none' : ''}`}>
                            <PlayerInfo player={me} gameState={gameState} gadgetRecipe={myGadgetRecipe} />
                            <Market gameState={gameState} onAction={handlePlayerAction} />
                            <Crafting gameState={gameState} onAction={handlePlayerAction} />
                            <Trade me={me} gameState={gameState} myOutgoingTrade={myOutgoingTrade} onAction={handlePlayerAction} />
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center shadow-sm">
                            <h2 className="text-3xl font-bold text-indigo-700">Waiting in the Lobby</h2>
                            <p className="mt-2 text-gray-600">The game will begin once the host starts and there are enough players.</p>
                            <div className="mt-6 text-left">
                                <p className="font-semibold">Share this Lobby ID with your friends:</p>
                                <div className="mt-2 p-3 bg-gray-100 rounded-md font-mono text-xl text-center tracking-widest">
                                    {lobbyId?.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 lg:col-span-1">
                    <h3 className="text-xl font-bold mb-4">Player Status</h3>
                    <ul className="space-y-3">
                        {Object.values(gameState.players).map(p => {
                            let statusText = 'In Lobby';
                            let statusColor = 'bg-gray-100 text-gray-800';
                            if (gameState.gamePhase === 'IN_PROGRESS' || isTurnCalculating) {
                                if (gameState.readyPlayers.includes(p.id)) {
                                    statusText = 'Ready';
                                    statusColor = 'bg-green-100 text-green-800';
                                } else {
                                    statusText = 'Thinking';
                                    statusColor = 'bg-red-100 text-red-800';
                                }
                            }
                            return (
                                <li key={p.id} className="flex justify-between items-center text-lg">
                                    <span className="font-semibold">{p.name} {p.id === gameState.hostId && '👑'}</span>
                                    <span className={`font-bold px-3 py-1 text-sm rounded-full ${statusColor}`}>
                                        {statusText}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                    {gameState.gamePhase === 'LOBBY' && gameState.hostId === myId && (
                        <button onClick={handleStartGame} className="mt-6 w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors">
                            Start Game
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};
