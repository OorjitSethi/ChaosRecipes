// frontend/src/components/Crafting.tsx
import type { GameState } from '../types';

interface Props {
    gameState: GameState;
    onAction: (type: string, payload: any) => void;
}

export const Crafting = ({ gameState, onAction }: Props) => {
    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4 hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
            <h3 className="text-xl font-bold border-b border-gray-200 pb-2 mb-4">🛠️ Crafting</h3>
            <ul className="space-y-3">
                {Object.entries(gameState.constants.COMPLEX_COMPONENTS).map(([component, recipe]) => (
                    <li key={component} className="p-3 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold">{component}</p>
                                <p className="text-xs text-gray-500">Requires: {Object.entries(recipe).map(([ing, qty]) => `${qty} ${ing}`).join(', ')}</p>
                            </div>
                            <button onClick={() => onAction('craft', { componentName: component })} className="px-4 py-2 text-sm font-bold bg-indigo-100 text-indigo-800 rounded-lg shadow-sm hover:bg-indigo-200 hover:-translate-y-0.5 active:scale-95 transform transition-all duration-150">
                                Craft
                            </button>
                        </div>
                    </li>
                ))}
                <li className="p-3 bg-green-50 rounded-md">
                    <div className="flex justify-between items-center">
                        <p className="font-bold text-green-800">Build Your Gadget!</p>
                        <button onClick={() => onAction('build', {})} className="px-4 py-2 font-bold bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600 hover:-translate-y-0.5 active:scale-95 transform transition-all duration-150">
                            BUILD!
                        </button>
                    </div>
                </li>
            </ul>
        </div>
    );
};