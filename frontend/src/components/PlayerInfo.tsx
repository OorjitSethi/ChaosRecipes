// frontend/src/components/PlayerInfo.tsx
import type { Player, GameState } from '../types';

interface Props {
    player: Player;
    gameState: GameState;
    gadgetRecipe: string[] | null;
}

export const PlayerInfo = ({ player, gameState, gadgetRecipe }: Props) => {
    const isThinking = gameState.gamePhase === 'IN_PROGRESS' && !gameState.readyPlayers.includes(player.id);
    const timerConfig = gameState.config.turnTimer;

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <h3 className="text-xl font-bold border-b border-gray-200 pb-2">{player.name} (You)</h3>
            
            <div className="text-3xl font-bold text-indigo-700">
                💰 {player.coins}
            </div>

            {isThinking && (
                <p className="text-sm text-red-600 animate-pulse">
                    Thinking... (-{timerConfig.deductionAmount} coins every {timerConfig.deductionIntervalSeconds}s)
                </p>
            )}

            {player.gadget && (
                <div className="p-3 bg-indigo-50 rounded-md text-center">
                    <p className="text-sm text-indigo-900">Your Goal</p>
                    <p className="font-bold text-indigo-700">{player.gadget}</p>
                    {gadgetRecipe && <p className="text-xs text-indigo-900">({gadgetRecipe.join(' + ')})</p>}
                </div>
            )}
            
            <div>
                <h4 className="font-bold mb-2">Inventory:</h4>
                <ul className="space-y-1 text-gray-700">
                    {Object.entries(player.inventory).filter(([, count]) => count > 0).length > 0 ? (
                        Object.entries(player.inventory).map(([item, count]) => count > 0 && (
                            <li key={item} className="flex justify-between">
                                <span>{item}:</span>
                                <span className="font-mono font-bold">{count}</span>
                            </li>
                        ))
                    ) : (
                        <li className="text-gray-500 italic">Empty</li>
                    )}
                </ul>
            </div>
        </div>
    );
};