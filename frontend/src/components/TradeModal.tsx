// frontend/src/components/TradeModal.tsx
import type { TradeOffer } from '../types';

interface Props {
    offer: TradeOffer;
    onResolve: (tradeId: string, accepted: boolean) => void;
}

export const TradeModal = ({ offer, onResolve }: Props) => {
    const formatPayload = (payload: { coins: number, items: { [key: string]: number } }) => {
        const coinStr = payload.coins > 0 ? `${payload.coins} coins` : '';
        const itemStr = Object.entries(payload.items).map(([name, qty]) => `${qty} ${name}`).join(', ');
        return [coinStr, itemStr].filter(Boolean).join(' and ') || 'nothing';
    };

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
                    <button onClick={() => onResolve(offer.id, true)} className="flex-1 font-bold py-3 px-4 rounded-lg shadow-sm text-white bg-green-500 hover:bg-green-600 hover:-translate-y-0.5 active:scale-95 transform transition-all duration-150 ease-in-out">
                        Accept
                    </button>
                    <button onClick={() => onResolve(offer.id, false)} className="flex-1 font-bold py-3 px-4 rounded-lg shadow-sm text-white bg-red-500 hover:bg-red-600 hover:-translate-y-0.5 active:scale-95 transform transition-all duration-150 ease-in-out">
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
};