// frontend/src/components/Crafting.tsx
import type { GameState, Player } from '../types'; // <-- Add Player

interface Props {
    gameState: GameState;
    me: Player; // <-- Add me
    onAction: (type: string, payload: any) => void;
}

export const Crafting = ({ gameState, me, onAction }: Props) => {
    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4 hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
            <h3 className="text-xl font-bold border-b border-gray-200 pb-2 mb-4">🛠️ Crafting</h3>
            <ul className="space-y-3">
                {Object.entries(gameState.constants.COMPLEX_COMPONENTS).map(([component, recipe]) => {
                    // --- THIS IS THE NEW LOGIC ---
                    const missingIngredients: string[] = [];
                    let canCraft = true;
                    for (const ingredient in recipe) {
                        if ((me.inventory[ingredient] || 0) < recipe[ingredient]) {
                            canCraft = false;
                            const needed = recipe[ingredient] - (me.inventory[ingredient] || 0);
                            missingIngredients.push(`${needed} ${ingredient}`);
                        }
                    }
                    const tooltipText = canCraft ? '' : `Missing: ${missingIngredients.join(', ')}`;
                    // --- END OF NEW LOGIC ---

                    return (
                        <li key={component} className="p-3 bg-gray-50 rounded-md">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{component}</p>
                                    <p className="text-xs text-gray-500">
                                        Requires: {Object.entries(recipe).map(([ing, qty]) => `${qty} ${ing}`).join(', ')}
                                    </p>
                                </div>
                                {/* The 'group' and 'group-hover' classes create the tooltip */}
                                <div className="relative group">
                                    <button 
                                        onClick={() => onAction('craft', { componentName: component })} 
                                        disabled={!canCraft}
                                        className="px-4 py-2 text-sm font-bold bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Craft
                                    </button>
                                    {!canCraft && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            {tooltipText}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
                {/* ... The "Build Your Gadget!" part is unchanged ... */}
                {me.gadget && (
                    <li className="p-3 bg-green-100 border border-green-200 rounded-md">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold text-green-800">Build Your Final Gadget!</p>
                                <p className="text-xs text-gray-600">Requires: {gameState.gadgetRecipes[me.gadget]?.join(', ') || '...'}</p>
                            </div>
                            
                            <div className="relative group">
                                <button 
                                    onClick={() => onAction('build', {})} 
                                    // --- THIS IS THE FIX ---
                                    // 1. Check if the button should be disabled
                                    disabled={!gameState.gadgetRecipes[me.gadget]?.every(comp => (me.inventory[comp] || 0) >= 1)}
                                    // 2. Add specific classes for the disabled state to override defaults
                                    className="px-4 py-2 font-bold bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    BUILD!
                                </button>
                                { !gameState.gadgetRecipes[me.gadget]?.every(comp => (me.inventory[comp] || 0) >= 1) &&
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        You are missing a required component.
                                    </div>
                                }
                            </div>
                        </div>
                    </li>
                )}
            </ul>
        </div>
    );
};