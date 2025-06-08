// frontend/src/types.ts
export interface Player {
    id: string;
    name: string;
    coins: number;
    inventory: { [key: string]: number };
    gadget: string | null;
}

export interface GameConstants {
    COMPLEX_COMPONENTS: { [key: string]: { [key: string]: number } };
    // ... any other constants you want the frontend to know
}


export interface TradeOfferPayload {
    coins: number;
    items: { [key: string]: number };
}

export interface TradeOffer {
    id: string;
    fromId: string;
    fromName: string;
    toId: string;
    offering: TradeOfferPayload;
    requesting: TradeOfferPayload;
}

export interface PriceModifier {
    id: string;
    item: string;
    delta: number;
    title: string;
    turnApplied: number;
}

export interface GameState {
    players: { [key: string]: Player };
    hostId: string | null;
    marketPrices: { [key: string]: number }; // This is still the final calculated price
    turnNumber: number;
    gamePhase: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED' | 'CALCULATING_TURN';
    currentEvent: { title: string; description: string };
    gadgetRecipes: { [key: string]: string[] };
    winner?: Player;
    constants: GameConstants;
    readyPlayers: string[];
    pendingTrades: { [key: string]: TradeOffer };
    // NEW: The list of active modifiers
    activePriceModifiers: PriceModifier[];
    config: {
        turnTimer: {
            deductionIntervalSeconds: number;
            deductionAmount: number;
        },
        // NEW: Base prices for display
        baseMarketPrices: { [key: string]: number };
    };
}