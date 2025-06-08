// backend/game/state.js
const config = require('../config.json');

const GameConstants = {
    BASE_INGREDIENTS: Object.keys(config.economy.baseMarketPrices),
    COMPLEX_COMPONENTS: config.economy.complexComponentRecipes,
    INVENTORY_LIMIT: config.gameplay.inventoryLimit,
    STARTING_COINS: config.gameplay.startingCoins,
    STARTING_INGREDIENTS_COUNT: config.gameplay.startingIngredientsCount,
};

const createInitialState = () => ({
    id: null,
    players: {},
    hostId: null,
    marketPrices: { ...config.economy.baseMarketPrices },
    turnNumber: 0,
    gamePhase: 'LOBBY',
    currentEvent: { title: "Welcome!", description: "Waiting for players to join." },
    gadgetRecipes: {},
    winner: null,
    readyPlayers: [],
    pendingTrades: {},
    activePriceModifiers: [],
});

module.exports = {
    GameConstants,
    createInitialState,
    config
};