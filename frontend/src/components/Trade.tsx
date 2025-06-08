// frontend/src/components/Trade.tsx
import { useState } from 'react';
import type { Player, GameState, TradeOffer } from '../types';

interface Props {
    me: Player;
    gameState: GameState;
    myOutgoingTrade: TradeOffer | undefined;
    onAction: (type: string, payload: any) => void;
}

const ALL_ITEMS = ['Carbon', 'Silicon', 'Polymer', 'Microchip', 'Casing', 'FuelCell'];

export const Trade = ({ me, gameState, myOutgoingTrade, onAction }: Props) => {
    const [targetPlayerId, setTargetPlayerId] = useState('');
    const [offerCoins, setOfferCoins] = useState(0);
    const [requestCoins, setRequestCoins] = useState(0);
    const [offerItem, setOfferItem] = useState('Carbon');
    const [offerQty, setOfferQty] = useState(0);
    const [requestItem, setRequestItem] = useState('Carbon');
    const [requestQty, setRequestQty] = useState(0);

    const otherPlayers = Object.values(gameState.players).filter(p => p.id !== me.id);

    const handleSendOffer = () => {
        if (!targetPlayerId) { alert('Please select a player to trade with.'); return; }
        const payload = {
            toPlayerId: targetPlayerId,
            offering: { coins: offerCoins, items: offerQty > 0 ? { [offerItem]: offerQty } : {} },
            requesting: { coins: requestCoins, items: requestQty > 0 ? { [requestItem]: requestQty } : {} },
        };
        onAction('offerTrade', payload);
    };

    if (myOutgoingTrade) {
        const targetName = gameState.players[myOutgoingTrade.toId]?.name || 'player';
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                <h3 className="text-xl font-bold border-b border-gray-200 pb-2 mb-4">🤝 Trading Post</h3>
                <p className="text-gray-500 italic">Offer sent to <strong>{targetName}</strong>.</p>
                <p className="text-gray-500 italic">Waiting for response...</p>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <h3 className="text-xl font-bold border-b border-gray-200 pb-2">🤝 Trading Post</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trade with:</label>
                <select value={targetPlayerId} onChange={e => setTargetPlayerId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">-- Select Player --</option>
                    {otherPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-2">
                    <h4 className="font-bold text-red-800">You Give</h4>
                    <div>
                        <input type="number" value={offerCoins} onChange={e => setOfferCoins(Math.max(0, parseInt(e.target.value) || 0))} className="w-full p-1 border border-gray-300 rounded-md"/>
                        <span className="text-sm text-gray-600"> Coins</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="number" value={offerQty} onChange={e => setOfferQty(Math.max(0, parseInt(e.target.value) || 0))} className="w-1/3 p-1 border border-gray-300 rounded-md" />
                        <select value={offerItem} onChange={e => setOfferItem(e.target.value)} className="w-2/3 p-1 border border-gray-300 rounded-md text-sm">
                            {ALL_ITEMS.map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-md space-y-2">
                    <h4 className="font-bold text-green-800">You Get</h4>
                    <div>
                        <input type="number" value={requestCoins} onChange={e => setRequestCoins(Math.max(0, parseInt(e.target.value) || 0))} className="w-full p-1 border border-gray-300 rounded-md"/>
                        <span className="text-sm text-gray-600"> Coins</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="number" value={requestQty} onChange={e => setRequestQty(Math.max(0, parseInt(e.target.value) || 0))} className="w-1/3 p-1 border border-gray-300 rounded-md" />
                        <select value={requestItem} onChange={e => setRequestItem(e.target.value)} className="w-2/3 p-1 border border-gray-300 rounded-md text-sm">
                            {ALL_ITEMS.map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <button onClick={handleSendOffer} className="w-full font-bold py-2 px-4 rounded-lg shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5 active:scale-95 transform transition-all duration-150 ease-in-out">
                Send Offer
            </button>
        </div>
    );
};