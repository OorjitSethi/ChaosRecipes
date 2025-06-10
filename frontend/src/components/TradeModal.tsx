// frontend/src/components/TradeModal.tsx
import type { TradeOffer, Player } from '../types'; // <-- Add Player

interface Props {
    offer: TradeOffer;
    me: Player; // <-- Add your player data
    onResolve: (tradeId: string, accepted: boolean) => void;
}

export const TradeModal = ({ offer, me, onResolve }: Props) => {
    const formatPayload = (payload: { coins: number, items: { [key: string]: number } }) => {
        const coinStr = payload.coins > 0 ? `${payload.coins} coins` : '';
        const itemStr = Object.entries(payload.items).map(([name, qty]) => `${qty} ${name}`).join(', ');
        return [coinStr, itemStr].filter(Boolean).join(' and ') || 'nothing';
    };

    const validation = {
        canAfford: true,
        reason: ''
    };

    // Check if I can afford the coins they are requesting
    if (me.coins < offer.requesting.coins) {
        validation.canAfford = false;
        validation.reason = `You need ${offer.requesting.coins} coins, but only have ${me.coins}.`;
    }

    // Check if I have the items they are requesting
    if (validation.canAfford) { // Only check items if coins are affordable
        for (const item in offer.requesting.items) {
            const needed = offer.requesting.items[item];
            const owned = me.inventory[item] || 0;
            if (owned < needed) {
                validation.canAfford = false;
                validation.reason = `They want ${needed} ${item}, but you only have ${owned}.`;
                break; // Stop checking once we find a single reason
            }
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full text-center space-y-4">
                <h3 className="text-2xl font-bold text-indigo-700">New Trade Offer!</h3>
                <p className="text-lg">
                    <strong>{offer.fromName}</strong> wants to trade.
                </p>
                <div className="space-y-2 text-left">
                    <p className="p-3 bg-green-50 rounded-md">They give you: <strong>{formatPayload(offer.offering)}</strong></p>
                    <p className="p-3 bg-red-50 rounded-md">You give them: <strong>{formatPayload(offer.requesting)}</strong></p>
                </div>
                <div className="flex gap-4 pt-4">
                <div className="relative group flex-1">
                        <button 
                            onClick={() => onResolve(offer.id, true)} 
                            disabled={!validation.canAfford}
                            className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Accept
                        </button>
                        {!validation.canAfford && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {validation.reason}
                            </div>
                        )}
                    </div>
                    <button onClick={() => onResolve(offer.id, false)} className="flex-1 font-bold py-3 px-4 rounded-lg shadow-sm text-white bg-red-500 hover:bg-red-600 hover:-translate-y-0.5 active:scale-95 transform transition-all duration-150 ease-in-out">
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
};