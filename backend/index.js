// backend/index.js

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { createNewGameState, GameManager } = require('./game/manager');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3001;

const lobbies = {};
// NEW: Object to hold the timer ID for each active lobby's turn
const activeTimers = {};

app.get('/', (req, res) => {
  res.json({ status: "online", message: "Recipe for Chaos backend is running!" });
});

io.on('connection', (socket) => {
  console.log(`A user connected with ID: ${socket.id}`);

  socket.on('createLobby', ({ username }) => {
    const lobbyId = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.join(lobbyId);
    lobbies[lobbyId] = createNewGameState();
    lobbies[lobbyId].hostId = socket.id;
    GameManager.addNewPlayer(lobbies[lobbyId], socket, username);
    console.log(`Lobby ${lobbyId} created by ${username}`);
    socket.emit('lobbyCreated', { lobbyId });
    io.to(lobbyId).emit('gameStateUpdate', GameManager.getSanitizedGameState(lobbies[lobbyId]));
  });

  socket.on('joinLobby', ({ lobbyId, username }) => {
    if (lobbies[lobbyId] && lobbies[lobbyId].gamePhase === 'LOBBY') {
        socket.join(lobbyId);
        GameManager.addNewPlayer(lobbies[lobbyId], socket, username);
        console.log(`${username} joined lobby ${lobbyId}`);
        io.to(lobbyId).emit('gameStateUpdate', GameManager.getSanitizedGameState(lobbies[lobbyId]));
    } else {
        socket.emit('gameError', { message: 'Lobby not found or game already in progress.' });
    }
  });

  socket.on('startGame', ({ lobbyId }) => {
    const gameState = lobbies[lobbyId];
    // THIS 'IF' IS THE ENTIRE FIX for host-only start
    if (gameState && gameState.gamePhase === 'LOBBY' && gameState.hostId === socket.id) {
        const gameManagerInstance = new GameManager(gameState);
        gameManagerInstance.startGame(io.to(lobbyId), activeTimers);
    }
});
  
  socket.on('playerAction', ({ lobbyId, action }) => {
      const gameState = lobbies[lobbyId];
      if (!gameState || gameState.gamePhase !== 'IN_PROGRESS') return;

      const gameManagerInstance = new GameManager(gameState);
      // NEW: Pass the activeTimers object to the manager
      gameManagerInstance.handlePlayerAction(socket, io.to(lobbyId), action, activeTimers);
  });

  socket.on('disconnect', () => {
    console.log(`User with ID: ${socket.id} disconnected`);
    for (const lobbyId in lobbies) {
        const gameState = lobbies[lobbyId];
        if (gameState.players[socket.id]) {
            const gameManagerInstance = new GameManager(gameState);
            gameManagerInstance.removePlayer(socket.id);
            if (Object.keys(gameState.players).length === 0) {
                console.log(`Lobby ${lobbyId} is empty, deleting.`);
                // NEW: Clean up the timer when the lobby is deleted
                if (activeTimers[gameState.id]) {
                    clearInterval(activeTimers[gameState.id]);
                    delete activeTimers[gameState.id];
                }
                delete lobbies[lobbyId];
            } else {
                io.to(lobbyId).emit('gameStateUpdate', GameManager.getSanitizedGameState(gameState));
            }
            break;
        }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});