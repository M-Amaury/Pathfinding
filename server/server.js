// server/server.js
const express = require('express');
const cors = require('cors');
const pathfinding = require('./pathfinding');
const mines = require('./mines');

const app = express();
app.use(cors());
app.use(express.json());

// Ajoutez ceci à votre fichier server.js, juste après les imports

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Route pour obtenir les instructions
app.post('/api/path', (req, res) => {
  const { start, end, minesList } = req.body;
  const path = pathfinding.findPath(start, end, minesList);
  res.json({ path });
});

// Route pour ajouter des mines
app.post('/api/mines', (req, res) => {
  const newMine = req.body;
  mines.addMine(newMine);
  res.json({ mines: mines.getMines() });
});

// Route pour obtenir la liste des mines
app.get('/api/mines', (req, res) => {
  res.json({ mines: mines.getMines() });
});

// Route de débogage pour voir toutes les données du serveur
app.get('/api/debug', (req, res) => {
  res.json({
    mines: mines.getMines(),
    // Ajoutez ici d'autres données que vous voulez voir
  });
});

// Ajoutez cette nouvelle route après les routes existantes
app.delete('/api/mines/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    if (isNaN(index)) {
      throw new Error('Invalid index');
    }
    const removed = mines.removeMine(index);
    if (removed) {
      res.json({ mines: mines.getMines() });
    } else {
      res.status(404).json({ error: 'Mine not found' });
    }
  } catch (error) {
    console.error('Error removing mine:', error);
    res.status(400).json({ error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
