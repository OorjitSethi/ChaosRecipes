// backend/game/manager.js

const { GameConstants, createInitialState, config } = require('./state');
const { shuffleArray, createRandomIngredientAssortment } = require('./utils');
const aiService = require('../services/aiService');
const { randomUUID } = require('crypto');

const MIN_PLAYERS = config.gameplay.minPlayers;
const MAX_PLAYERS = config.gameplay.maxPlayers;
const WORLD_EVENT_CHANCE = config.events.worldEventChance;

let originalGameData = {};

function getHoardedResource(gameState) {
    const totals = { Carbon: 0, Silicon: 0, Polymer: 0 };
    Object.values(gameState.players).forEach(player => {
        if (player.inventory) {
            totals.Carbon += player.inventory.Carbon || 0;
            totals.Silicon += player.inventory.Silicon || 0;
            totals.Polymer += player.inventory.Polymer || 0;
        }
    });
    return Object.keys(totals).reduce((a, b) => totals[a] > totals[b] ? a : b, 'Carbon');
}

function backupOriginalData(gameState) {
    originalGameData[gameState.id] = {
        marketPrices: JSON.parse(JSON.stringify(gameState.marketPrices)),
        complexComponents: JSON.parse(JSON.stringify(GameConstants.COMPLEX_COMPONENTS)),
    };
}

function resetTurnEffects(gameState) {
    const originals = originalGameData[gameState.id];
    if (originals) {
        GameConstants.COMPLEX_COMPONENTS = JSON.parse(JSON.stringify(originals.complexComponents));
    }
}

const createNewGameState = () => {
    const gameState = createInitialState();
    gameState.id = Math.random().toString(36).substring(2, 8).toUpperCase();
    return gameState;
};

class GameManager {
    constructor(gameState) {
        this.gameState = gameState;
    }

    calculateCurrentPrices() {
        console.log("--- DEBUG: Starting price calculation ---");
        console.log("DEBUG: Base prices are:", config.economy.baseMarketPrices);
        console.log("DEBUG: Active modifiers are:", this.gameState.activePriceModifiers);

        const currentPrices = { ...config.economy.baseMarketPrices };
        this.gameState.activePriceModifiers.forEach(modifier => {
            if (currentPrices.hasOwnProperty(modifier.item)) {
                currentPrices[modifier.item] += modifier.delta;
            }
        });
        for (const item in currentPrices) {
            currentPrices[item] = Math.max(1, currentPrices[item]);
        }
        
        console.log("DEBUG: Final calculated prices are:", currentPrices);
        this.gameState.marketPrices = currentPrices;
        console.log("--- DEBUG: Finished price calculation ---");
    }
    
    startCoinDeductionTimer(io, activeTimers) {
        const deductionIntervalMs = config.turnTimer.deductionIntervalSeconds * 1000;
        const deductionAmount = config.turnTimer.deductionAmount;
        const newTimerId = setInterval(() => {
            let changed = false;
            Object.values(this.gameState.players).forEach(player => {
                if (!this.gameState.readyPlayers.includes(player.id)) {
                    player.coins = Math.max(0, player.coins - deductionAmount);
                    changed = true;
                }
            });
            if (changed) {
                io.emit('gameStateUpdate', GameManager.getSanitizedGameState(this.gameState));
            }
        }, deductionIntervalMs);
        activeTimers[this.gameState.id] = newTimerId;
    }

    static addNewPlayer(gameState, socket, username) {
        const playerId = socket.id;
        gameState.players[playerId] = {
            id: playerId, name: username, coins: GameConstants.STARTING_COINS,
            inventory: { Carbon: 0, Silicon: 0, Polymer: 0, Microchip: 0, Casing: 0, FuelCell: 0 },
            gadget: null,
        };
    }

    removePlayer(playerId) {
        delete this.gameState.players[playerId];
        if (Object.keys(this.gameState.players).length < MIN_PLAYERS && this.gameState.gamePhase === 'IN_PROGRESS') {
            this.gameState.gamePhase = 'FINISHED';
            this.gameState.currentEvent = { title: "Game Canceled", description: "Not enough players to continue." };
        }
    }

    async startGame(io, activeTimers) {
        const playerCount = Object.keys(this.gameState.players).length;
        if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
            io.emit('gameError', { message: `Game requires ${MIN_PLAYERS}-${MAX_PLAYERS} players.` });
            return;
        }
        this.gameState.gamePhase = 'IN_PROGRESS';
        backupOriginalData(this.gameState);
        const componentList = Object.keys(GameConstants.COMPLEX_COMPONENTS);
        const recipes = await aiService.generateInitialRecipes(playerCount, componentList);
        if (!recipes) {
            this.gameState.gamePhase = 'LOBBY';
            io.emit('gameError', { message: 'The Invention-AI is on strike!' });
            return;
        }
        this.gameState.gadgetRecipes = recipes;
        const availableRecipes = shuffleArray(Object.keys(recipes));
        Object.values(this.gameState.players).forEach((player, index) => {
            player.gadget = availableRecipes[index % availableRecipes.length];
            const startingIngredients = createRandomIngredientAssortment(
                GameConstants.BASE_INGREDIENTS, GameConstants.STARTING_INGREDIENTS_COUNT
            );
            player.inventory = { ...player.inventory, ...startingIngredients };
        });

        this.startTurn(io, activeTimers);
    }

    async startTurn(io, activeTimers) {
        if (activeTimers[this.gameState.id]) {
            clearInterval(activeTimers[this.gameState.id]);
        }
        this.gameState.readyPlayers = [];
        resetTurnEffects(this.gameState);
        this.gameState.turnNumber++;
        
        let turnAnnouncements = [];
        let expiredModifierReasons = [];

        // Step 1: Process expirations for existing modifiers
        const existingModifiers = [...this.gameState.activePriceModifiers];
        const survivingModifiers = [];
        for (const modifier of existingModifiers) {
            if (this.gameState.turnNumber > modifier.turnApplied && Math.random() < 0.5) {
                const reason = await aiService.generateExpirationReason(modifier.title);
                if (reason?.description) {
                    expiredModifierReasons.push(`📉 ${modifier.title} has ended: ${reason.description}`);
                }
            } else {
                survivingModifiers.push(modifier);
            }
        }
        this.gameState.activePriceModifiers = survivingModifiers;

        // Step 2: Generate a new price change event WITH VALIDATION
        let newPriceEvent = await aiService.generatePriceChangeEvent(
            config.economy.baseMarketPrices,
            this.gameState.activePriceModifiers
        );

        // Validate the AI's response. If it's bad, create a fallback event.
        if (!newPriceEvent || !newPriceEvent.item || typeof newPriceEvent.delta !== 'number' || !config.economy.baseMarketPrices.hasOwnProperty(newPriceEvent.item)) {
            console.log("DEBUG: AI price event was invalid or for a non-market item. Creating fallback.");
            newPriceEvent = {
                title: "Minor Market Jitters",
                item: "Polymer", // Always affect a known item
                delta: Math.random() > 0.5 ? 2 : -2, // Random small change
                description: "Unpredictable market forces cause a slight price shift for Polymer."
            };
        }

        // Now we know newPriceEvent is valid. Add it as a new modifier.
        const newModifier = {
            id: randomUUID(),
            item: newPriceEvent.item,
            delta: newPriceEvent.delta,
            title: newPriceEvent.title,
            turnApplied: this.gameState.turnNumber,
        };
        this.gameState.activePriceModifiers.push(newModifier);
        turnAnnouncements.push(`📈 ${newPriceEvent.title}: ${newPriceEvent.description}`);
        
        // Step 3: Ensure at least one modifier is always active (this is a redundant safety net now but good to keep)
        if (this.gameState.activePriceModifiers.length === 0) {
            this.gameState.activePriceModifiers.push({
                id: randomUUID(), item: 'Carbon', delta: 2,
                title: 'Minor Market Fluctuation', turnApplied: this.gameState.turnNumber,
            });
            turnAnnouncements.push('A minor market fluctuation caused Carbon prices to rise slightly.');
        }
        
        // Step 4: Handle major world event (crafting modifier etc.)
        if (Math.random() < WORLD_EVENT_CHANCE) {
            const context = { turn: this.gameState.turnNumber, hoarded: getHoardedResource(this.gameState) };
            const worldEvent = await aiService.generateWorldEvent(context);
            if (worldEvent) { // Safety check
                this.gameState.currentEvent = worldEvent;
                turnAnnouncements.push(`✨ ${worldEvent.title}: ${worldEvent.description}`);
                if (worldEvent.effect.type === 'CRAFTING_MODIFIER') {
                    const { component, ingredient, newAmount } = worldEvent.effect.details;
                    if (GameConstants.COMPLEX_COMPONENTS[component]) {
                        GameConstants.COMPLEX_COMPONENTS[component][ingredient] = newAmount;
                    }
                }
            }
        }

        // Step 5: Calculate final prices based on all active modifiers
        this.calculateCurrentPrices();
        
        // Step 6: Start the coin deduction timer for the new turn
        this.startCoinDeductionTimer(io, activeTimers);

        // Step 7: Assemble and send the turn summary and final game state
        this.gameState.gamePhase = 'IN_PROGRESS';
        const allDescriptions = [...expiredModifierReasons, ...turnAnnouncements];
        const turnData = {
            turnNumber: this.gameState.turnNumber,
            event: {
                title: "Market Update",
                description: allDescriptions.join('\n') || "The market is quiet.",
            }
        };

        const finalGameStateToSend = GameManager.getSanitizedGameState(this.gameState);
        console.log("DEBUG: Final gameState being sent to clients:", JSON.stringify(finalGameStateToSend, null, 2));

        io.emit('gameStateUpdate', finalGameStateToSend);
        io.emit('newTurn', turnData);
    }

    handlePlayerAction(socket, io, action, activeTimers) {
        const { type, payload } = action;
        const playerId = socket.id;

        switch (type) {
            case 'buy': this.emitUpdate(socket, io, this.handleBuy(playerId, payload.item, payload.quantity)); break;
            case 'sell': this.emitUpdate(socket, io, this.handleSell(playerId, payload.item, payload.quantity)); break;
            case 'craft': this.emitUpdate(socket, io, this.handleCraft(playerId, payload.componentName)); break;
            case 'build': this.handleBuild(playerId, io); break;
            case 'endTurn': this.handleEndTurn(playerId, io, activeTimers); break;
            case 'offerTrade': this.handleOfferTrade(playerId, io, payload); break;
            case 'resolveTrade': this.handleResolveTrade(playerId, io, payload); break;
        }
    }
    
    emitUpdate(socket, io, result) {
        socket.emit('actionFeedback', result);
        io.emit('gameStateUpdate', GameManager.getSanitizedGameState(this.gameState));
    }

    handleEndTurn(playerId, io, activeTimers) {
        if (!this.gameState.readyPlayers.includes(playerId)) {
            this.gameState.readyPlayers.push(playerId);
        }

        // Immediately tell all players that this person is now ready.
        io.emit('gameStateUpdate', GameManager.getSanitizedGameState(this.gameState));

        const allPlayersReady = Object.keys(this.gameState.players).every(pId => this.gameState.readyPlayers.includes(pId));

        if (allPlayersReady && Object.keys(this.gameState.players).length > 0) {
            // --- THIS IS THE CORE FIX ---
            // 1. Put the game into a temporary "calculating" state.
            this.gameState.gamePhase = 'CALCULATING_TURN';
            
            // 2. Tell all players we are now calculating, which will lock their UIs.
            io.emit('gameStateUpdate', GameManager.getSanitizedGameState(this.gameState));

            // 3. NOW start the slow, async process.
            this.startTurn(io, activeTimers);
        }
    }

    handleBuy(playerId, item, quantity) {
        const player = this.gameState.players[playerId];
        const price = this.gameState.marketPrices[item];
        if (!player || !price || !Number.isInteger(quantity) || quantity <= 0) {
            return { success: false, message: "Invalid buy request." };
        }
        const totalCost = price * quantity;
        const currentBase = player.inventory.Carbon + player.inventory.Silicon + player.inventory.Polymer;
        if (player.coins < totalCost) return { success: false, message: "Not enough coins." };
        if (currentBase + quantity > GameConstants.INVENTORY_LIMIT) return { success: false, message: "Inventory limit exceeded." };
        player.coins -= totalCost;
        player.inventory[item] += quantity;
        return { success: true, message: `Bought ${quantity} ${item}.` };
    }

    handleSell(playerId, item, quantity) {
        const player = this.gameState.players[playerId];
        const price = this.gameState.marketPrices[item];
        if (!player || !price || !Number.isInteger(quantity) || quantity <= 0) {
            return { success: false, message: "Invalid sell request." };
        }
        if (player.inventory[item] < quantity) {
            return { success: false, message: `Not enough ${item} to sell.` };
        }
        player.coins += price * quantity;
        player.inventory[item] -= quantity;
        return { success: true, message: `Sold ${quantity} ${item}.` };
    }

    handleCraft(playerId, componentName) {
        const player = this.gameState.players[playerId];
        const recipe = GameConstants.COMPLEX_COMPONENTS[componentName];
        if (!player || !recipe) return { success: false, message: "Invalid craft request." };
        for (const ingredient in recipe) {
            if (player.inventory[ingredient] < recipe[ingredient]) {
                return { success: false, message: `Not enough ${ingredient}.` };
            }
        }
        for (const ingredient in recipe) {
            player.inventory[ingredient] -= recipe[ingredient];
        }
        player.inventory[componentName]++;
        return { success: true, message: `Crafted a ${componentName}!` };
    }

    handleBuild(playerId, io) {
        const player = this.gameState.players[playerId];
        if (!player?.gadget) return;
        const required = this.gameState.gadgetRecipes[player.gadget];
        if (!required) return;
        const hasAll = required.every(component => player.inventory[component] >= 1);
        if (hasAll) {
            this.gameState.gamePhase = 'FINISHED';
            this.gameState.winner = player;
            io.emit('gameOver', { winnerName: player.name, winningGadget: player.gadget });
        }
    }

    handleOfferTrade(fromPlayerId, io, payload) {
        const { toPlayerId, offering, requesting } = payload;
        const fromPlayer = this.gameState.players[fromPlayerId]; // <-- Change 'from' to 'fromPlayer'
        const toPlayer = this.gameState.players[toPlayerId];   // <-- Change 'to' to 'toPlayer'
        if (!fromPlayer || !toPlayer || fromPlayerId === toPlayerId) return;

        if (offering.coins > fromPlayer.coins) return; // <-- Use fromPlayer
        for (const item in offering.items) {
            if ((fromPlayer.inventory[item] || 0) < offering.items[item]) return; // <-- Use fromPlayer
        }
        
        const tradeId = randomUUID();
        const tradeOffer = {
            id: tradeId, fromId: fromPlayerId, fromName: fromPlayer.name, // <-- Use fromPlayer
            toId: toPlayerId, offering, requesting
        };
        this.gameState.pendingTrades[tradeId] = tradeOffer;

        io.to(fromPlayerId).emit('actionFeedback', { success: true, message: `Trade offer sent to ${toPlayer.name}.` }); // <-- This now works
        io.emit('gameStateUpdate', GameManager.getSanitizedGameState(this.gameState));
    }

    handleResolveTrade(resolverId, io, payload) {
        const { tradeId, accepted } = payload;
        const trade = this.gameState.pendingTrades[tradeId];
        if (!trade || trade.toId !== resolverId) return;

        const fromPlayer = this.gameState.players[trade.fromId]; // <-- Change 'from' to 'fromPlayer'
        const toPlayer = this.gameState.players[trade.toId];   // <-- Change 'to' to 'toPlayer'
        delete this.gameState.pendingTrades[tradeId];

        if (!accepted || !fromPlayer || !toPlayer) { // <-- Use fromPlayer and toPlayer
            io.to(fromPlayer.id).emit('actionFeedback', { success: false, message: 'Trade rejected.' });
            return;
        }

        let canAfford = fromPlayer.coins >= trade.offering.coins && toPlayer.coins >= trade.requesting.coins; // <-- Use fromPlayer and toPlayer
        for (const item in trade.offering.items) {
            if ((fromPlayer.inventory[item] || 0) < trade.offering.items[item]) canAfford = false; // <-- Use fromPlayer
        }
        for (const item in trade.requesting.items) {
            if ((toPlayer.inventory[item] || 0) < trade.requesting.items[item]) canAfford = false; // <-- Use toPlayer
        }

        if (!canAfford) {
            io.to(fromPlayer.id).emit('actionFeedback', { success: false, message: 'Trade failed. A player lacked resources.' });
            io.to(toPlayer.id).emit('actionFeedback', { success: false, message: 'Trade failed. A player lacked resources.' });
            return;
        }

        fromPlayer.coins = fromPlayer.coins - trade.offering.coins + trade.requesting.coins; // <-- Use fromPlayer and toPlayer
        toPlayer.coins = toPlayer.coins - trade.requesting.coins + trade.offering.coins;

        for (const item in trade.offering.items) {
            fromPlayer.inventory[item] -= trade.offering.items[item];
            toPlayer.inventory[item] = (toPlayer.inventory[item] || 0) + trade.offering.items[item];
        }
        for (const item in trade.requesting.items) {
            toPlayer.inventory[item] -= trade.requesting.items[item];
            fromPlayer.inventory[item] = (fromPlayer.inventory[item] || 0) + trade.requesting.items[item];
        }

        io.emit('gameStateUpdate', GameManager.getSanitizedGameState(this.gameState));
        io.to(fromPlayer.id).emit('actionFeedback', { success: true, message: `Trade with ${toPlayer.name} successful.` });
        io.to(toPlayer.id).emit('actionFeedback', { success: true, message: `Trade with ${fromPlayer.name} successful.` });
    }

    static getSanitizedGameState(gameState) {
        const state = JSON.parse(JSON.stringify(gameState));
        state.constants = GameConstants;
        state.config = { 
            turnTimer: config.turnTimer,
            baseMarketPrices: config.economy.baseMarketPrices
        };
        return state;
    }
}

module.exports = { GameManager, createNewGameState };