// frontend/src/components/Market.tsx
import type { GameState } from '../types';

interface Props {
    gameState: GameState;
    onAction: (type: string, payload: any) => void;
}

export const Market = ({ gameState, onAction }: Props) => {
    const basePrices = gameState.config.baseMarketPrices;

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-bold border-b border-gray-200 pb-2 mb-4">🛒 Market</h3>
            <ul className="space-y-4">
                {Object.entries(gameState.marketPrices).map(([item, finalPrice]) => {
                    const modifiers = gameState.activePriceModifiers.filter(m => m.item === item);
                    const basePrice = basePrices[item];

                    return (
                        <li key={item} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-lg">{item}</span>
                                    <span className="text-2xl font-bold text-indigo-700">${finalPrice}</span>
                                    <span className="text-sm text-gray-500">(Base: ${basePrice})</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => onAction('buy', { item, quantity: 1 })} className="px-3 py-1 text-sm font-bold bg-green-100 text-green-800 rounded hover:bg-green-200 transition">Buy</button>
                                    <button onClick={() => onAction('sell', { item, quantity: 1 })} className="px-3 py-1 text-sm font-bold bg-red-100 text-red-800 rounded hover:bg-red-200 transition">Sell</button>
                                </div>
                            </div>

                            {modifiers.length > 0 && (
                                <ul className="text-xs text-gray-600 pl-4 border-l-2 border-indigo-200">
                                    {modifiers.map(mod => (
                                        <li key={mod.id}>
                                            {mod.title}: <span className={`font-bold ${mod.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>{mod.delta > 0 ? `+$${mod.delta}`: `-$${Math.abs(mod.delta)}`}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
