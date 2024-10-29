const express = require('express');
const router = express.Router();
const aStar = require('../pathfinding/aStar');

let mines = [];

router.get('/mines', (req, res) => {
  res.json(mines);
});

router.post('/mines', (req, res) => {
  const { x, y } = req.body;
  mines.push({ x, y });
  res.status(201).json({ message: 'Mine added successfully' });
});

router.post('/paths', (req, res) => {
  const { start, end } = req.body;
  const paths = aStar.findPaths(start, end, mines);
  res.json(paths);
});

module.exports = router; 