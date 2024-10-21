// client/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css'; // Assurez-vous de créer ce fichier CSS

function App() {
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [end, setEnd] = useState({ x: 10, y: 10 });
  const [mines, setMines] = useState([]);
  const [path, setPath] = useState([]);
  const [newMine, setNewMine] = useState({ x: '', y: '' });
  const [gridSize, setGridSize] = useState({ width: 20, height: 20 });

  useEffect(() => {
    fetchMines();
  }, []);

  const fetchMines = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/mines');
      const data = await response.json();
      setMines(data.mines);
    } catch (error) {
      console.error("Erreur lors de la récupération des mines:", error);
    }
  };

  const calculatePath = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end, minesList: mines }),
      });
      const data = await response.json();
      setPath(data.path);
    } catch (error) {
      console.error("Erreur lors du calcul du chemin:", error);
    }
  };

  const addMine = async () => {
    try {
      const mineToAdd = {
        x: parseInt(newMine.x) || 0,
        y: parseInt(newMine.y) || 0
      };
      const response = await fetch('http://localhost:5000/api/mines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mineToAdd),
      });
      const data = await response.json();
      setMines(data.mines);
    } catch (error) {
      console.error("Erreur lors de l'ajout d'une mine:", error);
    }
  };

  const removeMine = async (index) => {
    try {
      const response = await fetch(`http://localhost:5000/api/mines/${index}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMines(data.mines);
    } catch (error) {
      console.error("Erreur lors de la suppression d'une mine:", error);
      // Vous pouvez ajouter ici un état pour afficher l'erreur à l'utilisateur
    }
  };

  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < gridSize.height; y++) {
      for (let x = 0; x < gridSize.width; x++) {
        let cellContent = '';
        let cellClass = 'cell';

        if (x === start.x && y === start.y) {
          cellContent = 'S';
          cellClass += ' start';
        } else if (x === end.x && y === end.y) {
          cellContent = 'E';
          cellClass += ' end';
        } else if (mines.some(mine => mine.x === x && mine.y === y)) {
          cellContent = 'M';
          cellClass += ' mine';
        }

        grid.push(
          <div key={`${x},${y}`} className={cellClass}>
            {cellContent}
          </div>
        );
      }
    }
    return grid;
  };

  return (
    <div>
      <h1>Pathfinding App</h1>
      <div>
        <h2>Start</h2>
        <input type="number" value={start.x} onChange={e => setStart({ ...start, x: parseInt(e.target.value) || 0 })} />
        <input type="number" value={start.y} onChange={e => setStart({ ...start, y: parseInt(e.target.value) || 0 })} />
      </div>
      <div>
        <h2>End</h2>
        <input type="number" value={end.x} onChange={e => setEnd({ ...end, x: parseInt(e.target.value) || 0 })} />
        <input type="number" value={end.y} onChange={e => setEnd({ ...end, y: parseInt(e.target.value) || 0 })} />
      </div>
      <div>
        <h2>Add Mine</h2>
        <input 
          type="text" 
          value={newMine.x} 
          onChange={e => setNewMine({ ...newMine, x: e.target.value })} 
          placeholder="X coordinate"
        />
        <input 
          type="text" 
          value={newMine.y} 
          onChange={e => setNewMine({ ...newMine, y: e.target.value })} 
          placeholder="Y coordinate"
        />
        <button onClick={addMine}>Add Mine</button>
      </div>
      <button onClick={calculatePath}>Calculate Path</button>
      <div>
        <h2>Mines</h2>
        {mines && mines.length > 0 ? (
          <ul>
            {mines.map((mine, index) => (
              <li key={index}>
                Mine at ({mine.x}, {mine.y})
                <button onClick={() => removeMine(index)}>Supprimer</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune mine ajoutée.</p>
        )}
      </div>
      <div>
        <h2>Instructions</h2>
        {path && path.length > 0 ? (
          <ul>
            {path.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        ) : (
          <p>Aucun chemin calculé.</p>
        )}
      </div>
      <div className="grid-container">
        <h2>Map</h2>
        <div className="grid" style={{
          gridTemplateColumns: `repeat(${gridSize.width}, 20px)`,
          gridTemplateRows: `repeat(${gridSize.height}, 20px)`
        }}>
          {renderGrid()}
        </div>
      </div>
    </div>
  );
}

export default App;
